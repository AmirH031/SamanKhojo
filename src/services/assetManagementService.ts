import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  listAll 
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { storage, db, auth } from './firebase';
import { getUserRole } from './userRoleService';
import { 
  AssetMetadata, 
  AssetUploadRequest, 
  AssetSearchFilters, 
  AssetSearchResult 
} from '../types/Festival';

/**
 * Production-ready Asset Management Service
 * Handles Firebase Storage uploads and Firestore metadata management
 */

export class AssetManagementService {
  private static instance: AssetManagementService;
  
  static getInstance(): AssetManagementService {
    if (!this.instance) {
      this.instance = new AssetManagementService();
    }
    return this.instance;
  }

  /**
   * Upload asset to Firebase Storage and register metadata
   */
  async uploadAsset(uploadRequest: AssetUploadRequest): Promise<AssetMetadata> {
    try {
      // Verify admin permissions
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required for asset upload');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required');
      }

      // Validate file
      this.validateFile(uploadRequest.file);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFilename(uploadRequest.file.name);
      const filename = `${uploadRequest.type}_${timestamp}_${sanitizedName}`;
      
      // Determine storage path based on category
      const storagePath = this.getStoragePath(uploadRequest.category, filename);
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, uploadRequest.file, {
        customMetadata: {
          originalName: uploadRequest.file.name,
          uploadedBy: user.uid,
          type: uploadRequest.type,
          category: uploadRequest.category
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Generate thumbnail for images/videos
      const thumbnailUrl = await this.generateThumbnail(uploadRequest.file, downloadURL);

      // Get file dimensions for images/videos
      const dimensions = await this.getFileDimensions(uploadRequest.file);

      // Create metadata object
      const assetMetadata: Omit<AssetMetadata, 'id'> = {
        name: uploadRequest.file.name,
        originalName: uploadRequest.file.name,
        type: uploadRequest.type,
        category: uploadRequest.category,
        mimeType: uploadRequest.file.type,
        size: uploadRequest.file.size,
        dimensions,
        firebaseUrl: downloadURL,
        firebasePath: storagePath,
        thumbnailUrl,
        isAnimated: this.isAnimatedFile(uploadRequest.file),
        tags: uploadRequest.tags || [],
        description: uploadRequest.description || '',
        festivalIds: uploadRequest.festivalId ? [uploadRequest.festivalId] : [],
        templateIds: uploadRequest.templateId ? [uploadRequest.templateId] : [],
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        isPublic: false,
        status: 'active'
      };

      // Save metadata to Firestore
      const firestoreData: any = {
        ...assetMetadata,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Only add optional fields if they have values
      if (uploadRequest.festivalId) {
        firestoreData.primaryFestivalId = uploadRequest.festivalId;
      }
      if (uploadRequest.templateId) {
        firestoreData.primaryTemplateId = uploadRequest.templateId;
      }

      const docRef = await addDoc(collection(db, 'assetMetadata'), firestoreData);

      const result: AssetMetadata = {
        id: docRef.id,
        ...assetMetadata
      };

      // Only add optional fields if they have values
      if (uploadRequest.festivalId) {
        result.primaryFestivalId = uploadRequest.festivalId;
      }
      if (uploadRequest.templateId) {
        result.primaryTemplateId = uploadRequest.templateId;
      }

      return result;

    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }

  /**
   * Search and filter assets with pagination
   */
  async searchAssets(filters: AssetSearchFilters): Promise<AssetSearchResult> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      let assetsQuery = collection(db, 'assetMetadata');
      const constraints: any[] = [];

      // Apply filters
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.festivalId) {
        constraints.push(where('festivalIds', 'array-contains', filters.festivalId));
      }
      if (filters.templateId) {
        constraints.push(where('templateIds', 'array-contains', filters.templateId));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));

      // Apply pagination
      const pageSize = filters.limit || 20;
      constraints.push(limit(pageSize));

      if (filters.page && filters.page > 1) {
        // For pagination, we'd need to implement cursor-based pagination
        // This is a simplified version
        const offset = (filters.page - 1) * pageSize;
        // Note: Firestore doesn't support offset, so we'd need cursor-based pagination
      }

      const q = query(assetsQuery, ...constraints);
      const snapshot = await getDocs(q);

      let assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as AssetMetadata[];

      // Apply text search filter (client-side for now)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        assets = assets.filter(asset =>
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.description.toLowerCase().includes(searchTerm) ||
          asset.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply tag filter (client-side)
      if (filters.tags && filters.tags.length > 0) {
        assets = assets.filter(asset =>
          filters.tags!.some(tag => asset.tags.includes(tag))
        );
      }

      const total = assets.length;
      const page = filters.page || 1;
      const totalPages = Math.ceil(total / pageSize);

      return {
        assets,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      };

    } catch (error) {
      console.error('Error searching assets:', error);
      throw error;
    }
  }

  /**
   * Update asset metadata
   */
  async updateAssetMetadata(
    assetId: string, 
    updates: Partial<AssetMetadata>
  ): Promise<void> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      const assetRef = doc(db, 'assetMetadata', assetId);
      await updateDoc(assetRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating asset metadata:', error);
      throw error;
    }
  }

  /**
   * Delete asset from storage and metadata
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      // Get asset metadata
      const assetDoc = await getDoc(doc(db, 'assetMetadata', assetId));
      if (!assetDoc.exists()) {
        throw new Error('Asset not found');
      }

      const assetData = assetDoc.data() as AssetMetadata;

      // Check if asset is in use
      if (assetData.usageCount > 0) {
        throw new Error('Cannot delete asset that is currently in use by festivals or templates');
      }

      // Delete from Firebase Storage
      const storageRef = ref(storage, assetData.firebasePath);
      await deleteObject(storageRef);

      // Delete thumbnail if exists
      if (assetData.thumbnailUrl) {
        try {
          const thumbnailPath = assetData.firebasePath.replace(/\.[^/.]+$/, '_thumb.jpg');
          const thumbnailRef = ref(storage, thumbnailPath);
          await deleteObject(thumbnailRef);
        } catch (error) {
          console.warn('Failed to delete thumbnail:', error);
        }
      }

      // Delete metadata from Firestore
      await deleteDoc(doc(db, 'assetMetadata', assetId));

    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  /**
   * Assign asset to festival or template
   */
  async assignAssetToFestival(assetId: string, festivalId: string): Promise<void> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      const assetRef = doc(db, 'assetMetadata', assetId);
      const assetDoc = await getDoc(assetRef);
      
      if (!assetDoc.exists()) {
        throw new Error('Asset not found');
      }

      const assetData = assetDoc.data() as AssetMetadata;
      const updatedFestivalIds = [...new Set([...assetData.festivalIds, festivalId])];

      await updateDoc(assetRef, {
        festivalIds: updatedFestivalIds,
        usageCount: increment(1),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error assigning asset to festival:', error);
      throw error;
    }
  }

  /**
   * Remove asset from festival or template
   */
  async removeAssetFromFestival(assetId: string, festivalId: string): Promise<void> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      const assetRef = doc(db, 'assetMetadata', assetId);
      const assetDoc = await getDoc(assetRef);
      
      if (!assetDoc.exists()) {
        throw new Error('Asset not found');
      }

      const assetData = assetDoc.data() as AssetMetadata;
      const updatedFestivalIds = assetData.festivalIds.filter(id => id !== festivalId);

      await updateDoc(assetRef, {
        festivalIds: updatedFestivalIds,
        usageCount: increment(-1),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error removing asset from festival:', error);
      throw error;
    }
  }

  /**
   * Get assets for a specific festival
   */
  async getFestivalAssets(festivalId: string): Promise<AssetMetadata[]> {
    try {
      const q = query(
        collection(db, 'assetMetadata'),
        where('festivalIds', 'array-contains', festivalId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as AssetMetadata[];

    } catch (error) {
      console.error('Error getting festival assets:', error);
      return [];
    }
  }

  /**
   * Get all available tags for filtering
   */
  async getAllTags(): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, 'assetMetadata'));
      const allTags = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  /**
   * Generate thumbnail for images and videos
   */
  private async generateThumbnail(file: File, downloadURL: string): Promise<string | undefined> {
    try {
      if (file.type.startsWith('image/')) {
        // For images, we can use the original URL as thumbnail
        return downloadURL;
      }

      if (file.type.startsWith('video/')) {
        // For videos, we'd need to generate a thumbnail
        // This is a simplified implementation
        return this.generateVideoThumbnail(file);
      }

      return undefined;
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
      return undefined;
    }
  }

  /**
   * Generate video thumbnail (client-side)
   */
  private async generateVideoThumbnail(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailDataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataURL);
        } else {
          resolve(undefined);
        }
      };

      video.onerror = () => resolve(undefined);

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file dimensions for images and videos
   */
  private async getFileDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => resolve(undefined);
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth, height: video.videoHeight });
        };
        video.onerror = () => resolve(undefined);
        video.src = URL.createObjectURL(file);
      } else {
        resolve(undefined);
      }
    });
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];

    if (file.size > maxSize) {
      throw new Error(`File size exceeds 50MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  /**
   * Sanitize filename for storage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Get storage path based on category
   */
  private getStoragePath(category: string, filename: string): string {
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

  /**
   * Check if file is animated
   */
  private isAnimatedFile(file: File): boolean {
    const animatedTypes = ['video/', 'image/gif'];
    return animatedTypes.some(type => file.type.startsWith(type));
  }

  /**
   * Get asset usage statistics
   */
  async getAssetStats(): Promise<{
    totalAssets: number;
    totalSize: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    recentUploads: AssetMetadata[];
  }> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      const snapshot = await getDocs(collection(db, 'assetMetadata'));
      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AssetMetadata[];

      const stats = {
        totalAssets: assets.length,
        totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
        byType: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        recentUploads: assets
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      };

      // Calculate type distribution
      assets.forEach(asset => {
        stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
        stats.byCategory[asset.category] = (stats.byCategory[asset.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting asset stats:', error);
      throw error;
    }
  }

  /**
   * Bulk delete assets
   */
  async bulkDeleteAssets(assetIds: string[]): Promise<void> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      const deletePromises = assetIds.map(async (assetId) => {
        try {
          await this.deleteAsset(assetId);
        } catch (error) {
          console.error(`Failed to delete asset ${assetId}:`, error);
          throw error;
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error bulk deleting assets:', error);
      throw error;
    }
  }



  /**
   * Copy asset to new location (for templates)
   */
  async copyAsset(assetId: string, newCategory: string): Promise<AssetMetadata> {
    try {
      const role = await getUserRole();
      if (!role.isAdmin) {
        throw new Error('Admin permissions required');
      }

      // Get original asset
      const assetDoc = await getDoc(doc(db, 'assetMetadata', assetId));
      if (!assetDoc.exists()) {
        throw new Error('Asset not found');
      }

      const originalAsset = assetDoc.data() as AssetMetadata;

      // Download original file
      const response = await fetch(originalAsset.firebaseUrl);
      const blob = await response.blob();
      const file = new File([blob], originalAsset.originalName, { type: originalAsset.mimeType });

      // Upload to new location
      const newAsset = await this.uploadAsset({
        file,
        type: originalAsset.type,
        category: newCategory as any,
        description: `Copy of ${originalAsset.description}`,
        tags: [...originalAsset.tags, 'copy']
      });

      return newAsset;
    } catch (error) {
      console.error('Error copying asset:', error);
      throw error;
    }
  }
}

export const assetManagementService = AssetManagementService.getInstance();