const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { admin } = require('../firebaseAdmin');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { verifyAdmin, adminRateLimit } = require('../middleware/adminAuth');

// Enhanced Asset Management Routes

// Upload asset to Firebase Storage and register metadata
router.post('/assets/upload', adminRateLimit(50, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { fileName, fileType, category, assetType, description, tags, festivalId, templateId } = req.body;
    
    if (!fileName || !fileType || !category || !assetType) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileType, category, assetType' 
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const uniqueFileName = `${assetType}_${timestamp}_${sanitizedName}`;
    
    // Determine storage path
    const storagePath = getStoragePath(category, uniqueFileName);
    
    // Create asset metadata
    const assetMetadata = {
      name: fileName,
      originalName: fileName,
      type: assetType,
      category,
      mimeType: fileType,
      firebasePath: storagePath,
      description: description || '',
      tags: tags || [],
      festivalIds: festivalId ? [festivalId] : [],
      templateIds: templateId ? [templateId] : [],
      usageCount: 0,
      isPublic: false,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid
    };

    // Save to Firestore
    const docRef = await db.collection('assetMetadata').add(assetMetadata);
    
    res.json({
      success: true,
      assetId: docRef.id,
      uploadUrl: `https://storage.googleapis.com/upload/storage/v1/b/${process.env.FIREBASE_STORAGE_BUCKET}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`,
      metadata: { ...assetMetadata, id: docRef.id }
    });

  } catch (error) {
    console.error('Error initiating asset upload:', error);
    res.status(500).json({ 
      error: 'Failed to initiate asset upload',
      details: error.message 
    });
  }
});

// Complete asset upload (update metadata with final URL)
router.post('/assets/:assetId/complete', adminRateLimit(50, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { firebaseUrl, size, dimensions, thumbnailUrl } = req.body;
    
    const assetRef = db.collection('assetMetadata').doc(assetId);
    const updateData = {
      firebaseUrl,
      size: size || 0,
      dimensions: dimensions || null,
      thumbnailUrl: thumbnailUrl || null,
      status: 'active',
      updatedAt: new Date()
    };
    
    await assetRef.update(updateData);
    
    res.json({
      success: true,
      message: 'Asset upload completed successfully'
    });

  } catch (error) {
    console.error('Error completing asset upload:', error);
    res.status(500).json({ 
      error: 'Failed to complete asset upload',
      details: error.message 
    });
  }
});

// Search and filter assets with pagination
router.get('/assets/search', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { 
      type, 
      category, 
      festivalId, 
      templateId, 
      search, 
      status = 'active',
      page = 1, 
      limit = 20 
    } = req.query;

    let assetsQuery = db.collection('assetMetadata');
    
    // Apply filters
    if (type) {
      assetsQuery = assetsQuery.where('type', '==', type);
    }
    if (category) {
      assetsQuery = assetsQuery.where('category', '==', category);
    }
    if (festivalId) {
      assetsQuery = assetsQuery.where('festivalIds', 'array-contains', festivalId);
    }
    if (templateId) {
      assetsQuery = assetsQuery.where('templateIds', 'array-contains', templateId);
    }
    if (status) {
      assetsQuery = assetsQuery.where('status', '==', status);
    }
    
    // Order and paginate
    assetsQuery = assetsQuery.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await assetsQuery.get();
    let assets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));

    // Apply text search (client-side for now)
    if (search) {
      const searchTerm = search.toLowerCase();
      assets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.description.toLowerCase().includes(searchTerm) ||
        (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    const total = assets.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasMore = parseInt(page) < totalPages;

    res.json({
      success: true,
      assets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({ 
      error: 'Failed to search assets',
      details: error.message 
    });
  }
});

// Update asset metadata
router.put('/assets/:assetId', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      tags: updates.tags,
      type: updates.type,
      category: updates.category,
      isPublic: updates.isPublic,
      status: updates.status
    };
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );
    
    await db.collection('assetMetadata').doc(assetId).update({
      ...cleanUpdates,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Asset metadata updated successfully'
    });

  } catch (error) {
    console.error('Error updating asset metadata:', error);
    res.status(500).json({ 
      error: 'Failed to update asset metadata',
      details: error.message 
    });
  }
});

// Delete asset from storage and metadata
router.delete('/assets/:assetId', adminRateLimit(50, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // Get asset metadata
    const assetDoc = await db.collection('assetMetadata').doc(assetId).get();
    if (!assetDoc.exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const assetData = assetDoc.data();
    
    // Check if asset is in use
    if (assetData.usageCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete asset that is currently in use',
        usageCount: assetData.usageCount 
      });
    }
    
    // Delete from Firebase Storage
    try {
      const bucket = admin.storage().bucket();
      await bucket.file(assetData.firebasePath).delete();
      
      // Delete thumbnail if exists
      if (assetData.thumbnailUrl) {
        const thumbnailPath = assetData.firebasePath.replace(/\.[^/.]+$/, '_thumb.jpg');
        try {
          await bucket.file(thumbnailPath).delete();
        } catch (thumbError) {
          console.warn('Failed to delete thumbnail:', thumbError);
        }
      }
    } catch (storageError) {
      console.warn('Failed to delete from storage:', storageError);
      // Continue with metadata deletion even if storage deletion fails
    }
    
    // Delete metadata
    await db.collection('assetMetadata').doc(assetId).delete();
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ 
      error: 'Failed to delete asset',
      details: error.message 
    });
  }
});

// Get asset statistics
router.get('/assets/stats', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const assetsSnapshot = await db.collection('assetMetadata').get();
    
    const stats = {
      totalAssets: 0,
      totalSize: 0,
      byType: {},
      byCategory: {},
      byStatus: {},
      recentUploads: []
    };
    
    const assets = [];
    
    assetsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      assets.push({ id: doc.id, ...data });
      
      stats.totalAssets++;
      stats.totalSize += data.size || 0;
      
      // Count by type
      stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
      
      // Count by category
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
    });
    
    // Get recent uploads
    stats.recentUploads = assets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting asset stats:', error);
    res.status(500).json({ 
      error: 'Failed to get asset statistics',
      details: error.message 
    });
  }
});

// Assign asset to festival
router.post('/assets/:assetId/assign-festival', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { assetId } = req.params;
    const { festivalId } = req.body;
    
    if (!festivalId) {
      return res.status(400).json({ error: 'Festival ID is required' });
    }
    
    const assetRef = db.collection('assetMetadata').doc(assetId);
    const assetDoc = await assetRef.get();
    
    if (!assetDoc.exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const assetData = assetDoc.data();
    const updatedFestivalIds = [...new Set([...(assetData.festivalIds || []), festivalId])];
    
    await assetRef.update({
      festivalIds: updatedFestivalIds,
      usageCount: (assetData.usageCount || 0) + 1,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Asset assigned to festival successfully'
    });

  } catch (error) {
    console.error('Error assigning asset to festival:', error);
    res.status(500).json({ 
      error: 'Failed to assign asset to festival',
      details: error.message 
    });
  }
});

// Remove asset from festival
router.delete('/assets/:assetId/festivals/:festivalId', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { assetId, festivalId } = req.params;
    
    const assetRef = db.collection('assetMetadata').doc(assetId);
    const assetDoc = await assetRef.get();
    
    if (!assetDoc.exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const assetData = assetDoc.data();
    const updatedFestivalIds = (assetData.festivalIds || []).filter(id => id !== festivalId);
    
    await assetRef.update({
      festivalIds: updatedFestivalIds,
      usageCount: Math.max(0, (assetData.usageCount || 0) - 1),
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Asset removed from festival successfully'
    });

  } catch (error) {
    console.error('Error removing asset from festival:', error);
    res.status(500).json({ 
      error: 'Failed to remove asset from festival',
      details: error.message 
    });
  }
});

// Get assets for a specific festival
router.get('/festivals/:festivalId/assets', async (req, res) => {
  try {
    const { festivalId } = req.params;
    
    const assetsQuery = db.collection('assetMetadata')
      .where('festivalIds', 'array-contains', festivalId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc');
    
    const snapshot = await assetsQuery.get();
    const assets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));
    
    res.json({
      success: true,
      assets
    });

  } catch (error) {
    console.error('Error getting festival assets:', error);
    res.status(500).json({ 
      error: 'Failed to get festival assets',
      details: error.message 
    });
  }
});

// Enhanced festival creation with asset management
router.post('/create', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { 
      name, 
      displayName, 
      description, 
      startDate, 
      endDate, 
      style, 
      assetIds = [],
      templateId 
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, displayName, startDate, endDate' 
      });
    }

    // Validate festival name
    if (!/^[a-z0-9-]+$/.test(name)) {
      return res.status(400).json({ 
        error: 'Festival name must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    // Check if festival already exists
    const existingFestival = await db.collection('festivals').where('name', '==', name).get();
    if (!existingFestival.empty) {
      return res.status(400).json({ 
        error: 'Festival with this name already exists' 
      });
    }

    // Deactivate other festivals if this one is being activated
    const activeFestivalsSnapshot = await db.collection('festivals')
      .where('isActive', '==', true)
      .get();
    
    const batch = db.batch();
    activeFestivalsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    if (!activeFestivalsSnapshot.empty) {
      await batch.commit();
    }

    // Create festival document
    const festivalData = {
      name,
      displayName,
      description: description || '',
      startDate,
      endDate,
      isActive: true,
      style: style || getDefaultStyle(name),
      assetIds: assetIds || [],
      status: 'active',
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid
    };

    const docRef = await db.collection('festivals').add(festivalData);

    // Update asset usage if assets are assigned
    if (assetIds.length > 0) {
      const assetBatch = db.batch();
      for (const assetId of assetIds) {
        const assetRef = db.collection('assetMetadata').doc(assetId);
        assetBatch.update(assetRef, {
          festivalIds: admin.firestore.FieldValue.arrayUnion(docRef.id),
          usageCount: admin.firestore.FieldValue.increment(1),
          updatedAt: new Date()
        });
      }
      await assetBatch.commit();
    }

    res.json({
      success: true,
      message: 'Festival created successfully',
      festival: {
        id: docRef.id,
        ...festivalData
      }
    });

  } catch (error) {
    console.error('Error creating festival:', error);
    res.status(500).json({ 
      error: 'Failed to create festival',
      details: error.message 
    });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/', 'video/', 'audio/'];
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    cb(null, isAllowed);
  }
});

// Helper function to get storage path
function getStoragePath(category, filename) {
  const basePath = 'festival-assets';
  
  switch (category) {
    case 'festival':
      return `${basePath}/festivals/${filename}`;
    case 'template':
      return `${basePath}/templates/${filename}`;
    case 'common':
      return `${basePath}/common/${filename}`;
    case 'seasonal':
      return `${basePath}/seasonal/${filename}`;
    default:
      return `${basePath}/misc/${filename}`;
  }
}

// Helper function to get default festival style
function getDefaultStyle(festivalName) {
  const styleTemplates = {
    diwali: {
      colors: {
        primary: '#FF9933',
        secondary: '#FFCC00',
        accent: '#FF6B35',
        background: 'linear-gradient(135deg, #FF9933 0%, #FFCC00 50%, #FF6B35 100%)',
        text: '#8B4513'
      },
      effects: {
        confetti: true,
        sparkles: true,
        glow: true,
        snow: false,
        colorSplash: false,
        particles: true
      }
    },
    christmas: {
      colors: {
        primary: '#C41E3A',
        secondary: '#228B22',
        accent: '#FFD700',
        background: 'linear-gradient(135deg, #C41E3A 0%, #228B22 50%, #FFD700 100%)',
        text: '#2F4F4F'
      },
      effects: {
        confetti: false,
        sparkles: true,
        glow: false,
        snow: true,
        colorSplash: false,
        particles: false
      }
    },
    holi: {
      colors: {
        primary: '#FF1493',
        secondary: '#00CED1',
        accent: '#FFD700',
        background: 'linear-gradient(135deg, #FF1493 0%, #00CED1 50%, #FFD700 100%)',
        text: '#4B0082'
      },
      effects: {
        confetti: true,
        sparkles: false,
        glow: false,
        snow: false,
        colorSplash: true,
        particles: true
      }
    }
  };
  
  const template = styleTemplates[festivalName.toLowerCase()] || styleTemplates.diwali;
  
  return {
    name: festivalName,
    displayName: festivalName.charAt(0).toUpperCase() + festivalName.slice(1),
    ...template,
    animations: {
      float: true,
      pulse: true,
      rotate: false,
      bounce: false,
      fade: true
    },
    layout: {
      bannerPosition: 'hero',
      overlayPosition: 'fullscreen',
      showDecorations: true,
      decorationDensity: 'medium'
    },
    assets: {
      bannerAssetId: null,
      overlayAssetId: null,
      decorationAssetIds: [],
      videoAssetIds: [],
      audioAssetId: null
    },
    sounds: {
      enabled: false,
      backgroundAssetId: null,
      volume: 0.5
    }
  };
}

// Helper function to ensure festival directory exists
async function ensureFestivalDirectory(festivalName) {
  const festivalPath = path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', festivalName);
  try {
    await fs.access(festivalPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(festivalPath, { recursive: true });
    console.log(`Created festival directory: ${festivalPath}`);
  }
  return festivalPath;
}

// Helper function to copy template assets to festival directory
async function copyTemplateAssets(templateName, festivalName) {
  try {
    const templatePath = path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', 'templates', templateName);
    const festivalPath = path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', festivalName);
    
    // Check if template directory exists
    try {
      await fs.access(templatePath);
    } catch (error) {
      console.warn(`Template directory not found: ${templatePath}`);
      return [];
    }
    
    // Copy template files to festival directory
    const templateFiles = await fs.readdir(templatePath);
    const copiedAssets = [];
    
    for (const file of templateFiles) {
      if (file === 'style.json') continue; // Skip style.json, we'll generate our own
      
      const sourcePath = path.join(templatePath, file);
      const destPath = path.join(festivalPath, file);
      
      try {
        await fs.copyFile(sourcePath, destPath);
        const stats = await fs.stat(destPath);
        
        copiedAssets.push({
          id: `${festivalName}_${file}`,
          name: file,
          type: getAssetType({ originalname: file, mimetype: getMimeTypeFromExtension(file) }),
          url: `/SamanKhojo/festival/${festivalName}/${file}`,
          filename: file,
          size: stats.size,
          description: getAssetDescription(file),
          tags: getAssetTags(file),
          isCustom: false,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn(`Failed to copy template file ${file}:`, error.message);
      }
    }
    
    return copiedAssets;
  } catch (error) {
    console.error('Error copying template assets:', error);
    return [];
  }
}

// Helper function to get MIME type from file extension
function getMimeTypeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Helper function to get asset description
function getAssetDescription(filename) {
  const name = filename.toLowerCase();
  if (name.includes('diya')) return 'Traditional oil lamp for Diwali';
  if (name.includes('rangoli')) return 'Colorful floor art pattern';
  if (name.includes('tree')) return 'Christmas tree decoration';
  if (name.includes('snowflake')) return 'Winter snowflake element';
  if (name.includes('moon')) return 'Crescent moon for Eid';
  if (name.includes('star')) return 'Decorative star element';
  if (name.includes('colors')) return 'Holi color splash effect';
  if (name.includes('sparkle')) return 'Sparkling decoration element';
  return 'Festival decoration element';
}

// Helper function to get asset tags
function getAssetTags(filename) {
  const name = filename.toLowerCase();
  const tags = [];
  
  if (name.includes('diwali') || name.includes('diya') || name.includes('rangoli')) {
    tags.push('diwali', 'traditional', 'indian');
  }
  if (name.includes('christmas') || name.includes('tree') || name.includes('snow')) {
    tags.push('christmas', 'winter', 'western');
  }
  if (name.includes('eid') || name.includes('moon') || name.includes('star')) {
    tags.push('eid', 'islamic', 'traditional');
  }
  if (name.includes('holi') || name.includes('color')) {
    tags.push('holi', 'colorful', 'spring');
  }
  if (name.includes('animation') || name.endsWith('.mp4') || name.endsWith('.webm')) {
    tags.push('animated', 'video');
  }
  
  return tags;
}
// Helper function to save file to festival directory
async function saveAssetToDirectory(festivalName, filename, buffer) {
  const festivalPath = await ensureFestivalDirectory(festivalName);
  const filePath = path.join(festivalPath, filename);
  await fs.writeFile(filePath, buffer);
  return `/SamanKhojo/festival/${festivalName}/${filename}`;
}

// Helper function to delete file from festival directory
async function deleteAssetFromDirectory(festivalName, filename) {
  const festivalPath = path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', festivalName);
  const filePath = path.join(festivalPath, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Could not delete file: ${filePath}`, error.message);
  }
}

// Create new festival with assets
router.post('/create', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, upload.array('assets', 20), async (req, res) => {
  try {
    const festivalData = JSON.parse(req.body.festivalData || '{}');
    const files = req.files || [];

    // Validate required fields
    if (!festivalData.name || !festivalData.displayName || !festivalData.startDate || !festivalData.endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, displayName, startDate, endDate' 
      });
    }

    // Validate festival name (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(festivalData.name)) {
      return res.status(400).json({ 
        error: 'Festival name must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    // Check if festival already exists
    const existingFestival = await db.collection('festivals').where('name', '==', festivalData.name).get();
    if (!existingFestival.empty) {
      return res.status(400).json({ 
        error: 'Festival with this name already exists' 
      });
    }

    // Create festival directory
    await ensureFestivalDirectory(festivalData.name);

    // Copy template assets if template is specified
    let templateAssets = [];
    if (festivalData.template && festivalData.template !== 'custom') {
      templateAssets = await copyTemplateAssets(festivalData.template, festivalData.name);
    }
    // Process uploaded assets
    const assets = [];
    for (const file of files) {
      const filename = `${Date.now()}_${file.originalname}`;
      const assetUrl = await saveAssetToDirectory(festivalData.name, filename, file.buffer);
      
      assets.push({
        id: `${festivalData.name}_${filename}`,
        name: file.originalname,
        type: getAssetType(file),
        url: assetUrl,
        filename,
        size: file.size,
        description: getAssetDescription(file.originalname),
        tags: getAssetTags(file.originalname),
        isCustom: true,
        uploadedAt: new Date().toISOString()
      });
    }

    // Combine template assets and uploaded assets
    const allAssets = [...templateAssets, ...assets];

    // Generate and save style.json
    const styleJson = generateStyleJson(festivalData.style, allAssets);
    const styleJsonPath = await saveAssetToDirectory(
      festivalData.name, 
      'style.json', 
      Buffer.from(JSON.stringify(styleJson, null, 2))
    );

    // Deactivate other festivals if this one is being activated
    if (festivalData.isActive !== false) {
      const activeFestivalsSnapshot = await db.collection('festivals')
        .where('isActive', '==', true)
        .get();
      
      const batch = db.batch();
      activeFestivalsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      
      if (!activeFestivalsSnapshot.empty) {
        await batch.commit();
      }
    }

    // Save festival to database
    const docRef = await db.collection('festivals').add({
      name: festivalData.name,
      displayName: festivalData.displayName,
      description: festivalData.description || '',
      startDate: festivalData.startDate,
      endDate: festivalData.endDate,
      isActive: festivalData.isActive !== false,
      style: festivalData.style,
      assets: allAssets,
      templateId: festivalData.template || null,
      styleJsonUrl: styleJsonPath,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'Festival created successfully',
      festival: {
        id: docRef.id,
        ...festivalData,
        assets: allAssets,
        styleJsonUrl: styleJsonPath
      }
    });

    console.log(`Festival created: ${festivalData.displayName} (${festivalData.startDate} to ${festivalData.endDate})`);
    if (templateAssets.length > 0) {
      console.log(`Copied ${templateAssets.length} template assets from ${festivalData.template}`);
    }
  } catch (error) {
    console.error('Error creating festival:', error);
    res.status(500).json({ 
      error: 'Failed to create festival',
      details: error.message 
    });
  }
});
// Get festival templates and prebuilt assets
router.get('/templates', async (req, res) => {
  try {
    // Return built-in templates (this could be moved to a database in the future)
    const templates = [
      {
        id: 'diwali-traditional',
        name: 'diwali-traditional',
        displayName: 'Traditional Diwali',
        description: 'Classic Diwali celebration with diyas, rangoli, and warm colors',
        icon: '🪔',
        category: 'traditional',
        prebuiltAssets: [
          'diya.svg',
          'rangoli.png',
          'lantern.svg'
        ]
      },
      {
        id: 'christmas-modern',
        name: 'christmas-modern',
        displayName: 'Modern Christmas',
        description: 'Contemporary Christmas design with snow effects',
        icon: '🎄',
        category: 'modern',
        prebuiltAssets: [
          'snowflake.svg',
          'tree.png',
          'star.svg'
        ]
      },
      {
        id: 'holi-colorful',
        name: 'holi-colorful',
        displayName: 'Colorful Holi',
        description: 'Vibrant Holi celebration with color splash effects',
        icon: '🎨',
        category: 'traditional',
        prebuiltAssets: [
          'color-splash.svg',
          'gulal.png',
          'water-balloon.svg'
        ]
      }
    ];

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      details: error.message 
    });
  }
});

// Get prebuilt assets for a specific festival or common assets
router.get('/assets/:festivalType?', async (req, res) => {
  try {
    const { festivalType } = req.params;
    const assetsPath = festivalType 
      ? path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', 'templates', festivalType)
      : path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', 'templates', 'common');
    
    const assets = [];
    
    try {
      const files = await fs.readdir(assetsPath);
      
      for (const file of files) {
        if (file === 'style.json') continue;
        
        const filePath = path.join(assetsPath, file);
        const stats = await fs.stat(filePath);
        const assetUrl = `/SamanKhojo/festival/templates/${festivalType || 'common'}/${file}`;
        
        assets.push({
          id: `template-${festivalType || 'common'}-${file}`,
          name: file,
          type: getAssetType({ originalname: file, mimetype: getMimeTypeFromExtension(file) }),
          url: assetUrl,
          filename: file,
          size: stats.size,
          description: getAssetDescription(file),
          tags: getAssetTags(file),
          isCustom: false,
          uploadedAt: stats.birthtime.toISOString()
        });
      }
    } catch (error) {
      console.warn(`Template assets directory not found: ${assetsPath}`);
    }
    
    res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('Error fetching prebuilt assets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prebuilt assets',
      details: error.message 
    });
  }
});

// Create banner template with code
router.post('/banner-template', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { name, htmlCode, cssCode, jsCode, variables, category } = req.body;
    
    if (!name || !htmlCode || !cssCode) {
      return res.status(400).json({ 
        error: 'Name, HTML code, and CSS code are required' 
      });
    }
    
    // Save banner template to database
    const docRef = await db.collection('bannerTemplates').add({
      name,
      htmlCode,
      cssCode,
      jsCode: jsCode || '',
      variables: variables || [],
      category: category || 'custom',
      responsive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.uid
    });
    
    res.json({
      success: true,
      message: 'Banner template created successfully',
      templateId: docRef.id
    });
  } catch (error) {
    console.error('Error creating banner template:', error);
    res.status(500).json({ 
      error: 'Failed to create banner template',
      details: error.message 
    });
  }
});

// Get banner templates
router.get('/banner-templates', async (req, res) => {
  try {
    const templatesSnapshot = await db.collection('bannerTemplates').orderBy('createdAt', 'desc').get();
    
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching banner templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch banner templates',
      details: error.message 
    });
  }
});

// Upload additional assets to existing festival
router.post('/:festivalId/assets', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, upload.array('assets', 10), async (req, res) => {
  try {
    const { festivalId } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Get festival details
    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    
    // Process uploaded assets
    const newAssets = [];
    for (const file of files) {
      const filename = `${Date.now()}_${file.originalname}`;
      const assetUrl = await saveAssetToDirectory(festivalData.name, filename, file.buffer);
      
      newAssets.push({
        id: `${festivalData.name}_${filename}`,
        name: file.originalname,
        type: getAssetType(file),
        url: assetUrl,
        filename,
        size: file.size,
        description: getAssetDescription(file.originalname),
        tags: getAssetTags(file.originalname),
        isCustom: true,
        uploadedAt: new Date().toISOString()
      });
    }

    // Update festival with new assets
    const updatedAssets = [...(festivalData.assets || []), ...newAssets];
    await db.collection('festivals').doc(festivalId).update({
      assets: updatedAssets,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${newAssets.length} assets`,
      assets: newAssets
    });

  } catch (error) {
    console.error('Error uploading festival assets:', error);
    res.status(500).json({ 
      error: 'Failed to upload assets',
      details: error.message 
    });
  }
});

// Delete festival asset
router.delete('/:festivalId/assets/:filename', adminRateLimit(30, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId, filename } = req.params;

    // Get festival details
    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    
    // Delete file from filesystem
    await deleteAssetFromDirectory(festivalData.name, filename);

    // Update festival assets list
    const updatedAssets = (festivalData.assets || []).filter(asset => asset.filename !== filename);
    await db.collection('festivals').doc(festivalId).update({
      assets: updatedAssets,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting festival asset:', error);
    res.status(500).json({ 
      error: 'Failed to delete asset',
      details: error.message 
    });
  }
});

// Update festival style and regenerate style.json
router.put('/:festivalId/style', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId } = req.params;
    const { style } = req.body;

    if (!style) {
      return res.status(400).json({ error: 'Style data is required' });
    }

    // Get festival details
    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    
    // Generate updated style.json
    const styleJson = generateStyleJson(style, festivalData.assets || []);
    const styleJsonPath = await saveAssetToDirectory(
      festivalData.name, 
      'style.json', 
      Buffer.from(JSON.stringify(styleJson, null, 2))
    );

    // Update festival in database
    await db.collection('festivals').doc(festivalId).update({
      style,
      styleJsonUrl: styleJsonPath,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Festival style updated successfully',
      styleJsonUrl: styleJsonPath
    });

  } catch (error) {
    console.error('Error updating festival style:', error);
    res.status(500).json({ 
      error: 'Failed to update festival style',
      details: error.message 
    });
  }
});

// Update homepage layout for festival
router.put('/:festivalId/layout', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId } = req.params;
    const layoutData = req.body;

    // Save layout to database
    const layoutRef = db.collection('festivalLayouts').doc(festivalId);
    await layoutRef.set({
      ...layoutData,
      festivalId,
      updatedAt: new Date()
    }, { merge: true });

    res.json({
      success: true,
      message: 'Layout updated successfully'
    });

  } catch (error) {
    console.error('Error updating festival layout:', error);
    res.status(500).json({ 
      error: 'Failed to update layout',
      details: error.message 
    });
  }
});

// Get homepage layout for festival
router.get('/:festivalId/layout', async (req, res) => {
  try {
    const { festivalId } = req.params;

    const layoutDoc = await db.collection('festivalLayouts').doc(festivalId).get();
    
    if (layoutDoc.exists) {
      res.json({
        success: true,
        layout: layoutDoc.data()
      });
    } else {
      res.json({
        success: true,
        layout: null
      });
    }

  } catch (error) {
    console.error('Error getting festival layout:', error);
    res.status(500).json({ 
      error: 'Failed to get layout',
      details: error.message 
    });
  }
});

// Generate festival preview
router.get('/:festivalId/preview', async (req, res) => {
  try {
    const { festivalId } = req.params;

    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
      success: true,
      previewUrl: `${baseUrl}/SamanKhojo?preview=${festivalId}`,
      assets: festivalData.assets || [],
      style: festivalData.style || {},
      layout: festivalData.layout || {}
    });

  } catch (error) {
    console.error('Error generating festival preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      details: error.message 
    });
  }
});

// Get active festival configuration
router.get('/active', async (req, res) => {
  try {
    // Get all festivals and find the active one
    const festivalsSnapshot = await db.collection('festivals').get();
    
    if (festivalsSnapshot.empty) {
      return res.json({ isActive: false });
    }

    const festivals = festivalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Find currently active festival based on dates
    const now = new Date();
    const activeFestival = festivals.find(festival => {
      if (!festival.isActive) return false;
      
      const startDate = new Date(festival.startDate);
      const endDate = new Date(festival.endDate);
      
      return now >= startDate && now <= endDate;
    });

    if (activeFestival) {
      res.json({
        name: activeFestival.name,
        displayName: activeFestival.displayName,
        startDate: activeFestival.startDate,
        endDate: activeFestival.endDate,
        isActive: true,
        id: activeFestival.id
      });
    } else {
      // Auto-deactivate expired festivals
      const expiredFestivals = festivals.filter(festival => {
        if (!festival.isActive) return false;
        const endDate = new Date(festival.endDate);
        return now > endDate;
      });

      // Deactivate expired festivals
      const batch = db.batch();
      expiredFestivals.forEach(festival => {
        const festivalRef = db.collection('festivals').doc(festival.id);
        batch.update(festivalRef, { isActive: false });
      });
      
      if (expiredFestivals.length > 0) {
        await batch.commit();
        console.log(`Deactivated ${expiredFestivals.length} expired festivals`);
      }

      res.json({ isActive: false });
    }
  } catch (error) {
    console.error('Error fetching active festival:', error);
    res.status(500).json({ error: 'Failed to fetch festival configuration' });
  }
});

// Get all festivals (admin only)
router.get('/all', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const festivalsSnapshot = await db.collection('festivals').orderBy('createdAt', 'desc').get();
    
    const festivals = festivalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    res.json({
      success: true,
      festivals
    });
  } catch (error) {
    console.error('Error fetching all festivals:', error);
    res.status(500).json({ error: 'Failed to fetch festivals' });
  }
});

// Get single festival details
router.get('/:festivalId', async (req, res) => {
  try {
    const { festivalId } = req.params;

    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festival = {
      id: festivalDoc.id,
      ...festivalDoc.data(),
      createdAt: festivalDoc.data().createdAt?.toDate?.() || festivalDoc.data().createdAt,
      updatedAt: festivalDoc.data().updatedAt?.toDate?.() || festivalDoc.data().updatedAt
    };

    res.json({
      success: true,
      festival
    });

  } catch (error) {
    console.error('Error fetching festival:', error);
    res.status(500).json({ 
      error: 'Failed to fetch festival',
      details: error.message 
    });
  }
});

// Helper function to determine asset type
function getAssetType(file) {
  const mimeType = file.mimetype.toLowerCase();
  const fileName = file.originalname.toLowerCase();

  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (fileName.includes('banner') || fileName.includes('poster')) return 'banner';
  if (fileName.includes('overlay')) return 'overlay';
  return 'decoration';
}

// Helper function to generate style.json
function generateStyleJson(style, assets) {
  const bannerAsset = assets.find(a => a.type === 'banner');
  const overlayAsset = assets.find(a => a.type === 'overlay');
  const decorationAssets = assets.filter(a => a.type === 'decoration');
  const videoAssets = assets.filter(a => a.type === 'video');

  return {
    name: style.name,
    displayName: style.displayName,
    banner: bannerAsset?.filename || 'banner.png',
    overlay: overlayAsset?.filename || null,
    decorations: decorationAssets.map(a => a.filename),
    videos: videoAssets.map(a => a.filename),
    effects: style.effects || {},
    colors: style.colors || {},
    animations: style.animations || {},
    layout: style.layout || {},
    sounds: style.sounds || { enabled: false },
    assets: {
      banner: bannerAsset?.url,
      overlay: overlayAsset?.url,
      decorations: decorationAssets.map(a => ({ name: a.filename, url: a.url })),
      videos: videoAssets.map(a => ({ name: a.filename, url: a.url }))
    }
  };
}

// Update existing festival
router.put('/:festivalId', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId } = req.params;
    const updates = req.body;

    // Get current festival
    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const currentData = festivalDoc.data();

    // Update style.json if style was updated
    if (updates.style) {
      const styleJson = generateStyleJson(updates.style, currentData.assets || []);
      const styleJsonPath = await saveAssetToDirectory(
        currentData.name, 
        'style.json', 
        Buffer.from(JSON.stringify(styleJson, null, 2))
      );
      updates.styleJsonUrl = styleJsonPath;
    }

    // Deactivate other festivals if this one is being activated
    if (updates.isActive === true) {
      const activeFestivalsSnapshot = await db.collection('festivals')
        .where('isActive', '==', true)
        .get();
      
      const batch = db.batch();
      activeFestivalsSnapshot.docs.forEach(doc => {
        if (doc.id !== festivalId) {
          batch.update(doc.ref, { isActive: false });
        }
      });
      
      if (!activeFestivalsSnapshot.empty) {
        await batch.commit();
      }
    }

    // Update festival
    await db.collection('festivals').doc(festivalId).update({
      ...updates,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Festival updated successfully'
    });

  } catch (error) {
    console.error('Error updating festival:', error);
    res.status(500).json({ 
      error: 'Failed to update festival',
      details: error.message 
    });
  }
});

// Delete festival and cleanup files
router.delete('/:festivalId', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId } = req.params;

    // Get festival details
    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    
    // Delete festival directory and all assets
    const festivalPath = path.join(process.cwd(), 'public', 'SamanKhojo', 'festival', festivalData.name);
    try {
      await fs.rmdir(festivalPath, { recursive: true });
      console.log(`Deleted festival directory: ${festivalPath}`);
    } catch (error) {
      console.warn(`Could not delete festival directory: ${festivalPath}`, error.message);
    }

    // Delete festival from database
    await db.collection('festivals').doc(festivalId).delete();
    
    // Delete associated layout
    try {
      await db.collection('festivalLayouts').doc(festivalId).delete();
    } catch (error) {
      console.warn('Could not delete festival layout:', error.message);
    }

    res.json({
      success: true,
      message: 'Festival deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting festival:', error);
    res.status(500).json({ 
      error: 'Failed to delete festival',
      details: error.message 
    });
  }
});

// Toggle festival status (admin only)
router.patch('/:festivalId/toggle', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { festivalId } = req.params;

    const festivalRef = db.collection('festivals').doc(festivalId);
    const festivalDoc = await festivalRef.get();

    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const currentData = festivalDoc.data();
    const newStatus = !currentData.isActive;

    // If activating this festival, deactivate others
    if (newStatus) {
      const activeFestivalsSnapshot = await db.collection('festivals')
        .where('isActive', '==', true)
        .get();

      const batch = db.batch();
      activeFestivalsSnapshot.docs.forEach(doc => {
        if (doc.id !== festivalId) {
          batch.update(doc.ref, { isActive: false });
        }
      });

      if (!activeFestivalsSnapshot.empty) {
        await batch.commit();
      }
    }

    await festivalRef.update({
      isActive: newStatus,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Festival ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus
    });
  } catch (error) {
    console.error('Error toggling festival status:', error);
    res.status(500).json({
      error: 'Failed to toggle festival status',
      details: error.message
    });
  }
});

// Get festival banners (top and center)
router.get('/:festivalId/banners', async (req, res) => {
  try {
    const { festivalId } = req.params;

    const festivalDoc = await db.collection('festivals').doc(festivalId).get();
    if (!festivalDoc.exists) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    const festivalData = festivalDoc.data();
    const banners = {};

    // Get banner assets based on layout position
    const assetsQuery = db.collection('assetMetadata')
      .where('festivalIds', 'array-contains', festivalId)
      .where('type', '==', 'banner')
      .where('status', '==', 'active');

    const snapshot = await assetsQuery.get();

    snapshot.docs.forEach(doc => {
      const asset = doc.data();
      if (asset.layoutPosition === 'hero' || !asset.layoutPosition) {
        banners.top = {
          id: doc.id,
          imageUrl: asset.firebaseUrl
        };
      } else if (asset.layoutPosition === 'background') {
        banners.center = {
          id: doc.id,
          imageUrl: asset.firebaseUrl
        };
      }
    });

    res.json({
      success: true,
      banners
    });

  } catch (error) {
    console.error('Error fetching festival banners:', error);
    res.status(500).json({
      error: 'Failed to fetch festival banners',
      details: error.message
    });
  }
});

module.exports = router;