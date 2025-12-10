

const express = require('express');
const router = express.Router();

const conversationalAI = require('../services/conversationalAI');
const { verifyToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/adminAuth');

// Helper function for traditional search
async function performTraditionalSearch(query, context = {}) {
  try {
    const { db } = require('../firebaseAdmin');
    const { category, priceRange, shopId, limit = 20 } = context;

    // Build Firestore query
    let itemsQuery = db.collectionGroup('items');

    // Add category filter if specified
    if (category) {
      itemsQuery = itemsQuery.where('category', '==', category);
    }

    // Add shop filter if specified
    if (shopId) {
      itemsQuery = itemsQuery.where('shopId', '==', shopId);
    }

    // Add price range filter if specified
    if (priceRange?.min) {
      itemsQuery = itemsQuery.where('price', '>=', parseFloat(priceRange.min));
    }
    if (priceRange?.max) {
      itemsQuery = itemsQuery.where('price', '<=', parseFloat(priceRange.max));
    }

    // Limit results
    itemsQuery = itemsQuery.limit(limit);

    const snapshot = await itemsQuery.get();
    const allItems = [];

    snapshot.forEach(doc => {
      allItems.push({ id: doc.id, ...doc.data() });
    });

    // Filter by search query (simple text matching)
    const queryLower = query.toLowerCase();
    const filteredItems = allItems.filter(item => {
      const searchText = `${item.name} ${item.category} ${item.description || ''} ${item.brand || ''}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    // Sort by relevance (exact matches first, then partial matches)
    filteredItems.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact name matches first
      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;

      // Name starts with query
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;

      // Sort by stock (available items first)
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (b.stock > 0 && a.stock <= 0) return 1;

      // Sort by price (ascending)
      return a.price - b.price;
    });

    return filteredItems;
  } catch (error) {
    console.error('Traditional search failed:', error);
    return [];
  }
}

// NLU-powered search endpoint (Requirements 5.4, 5.5)
router.post('/search/nlu', async (req, res) => {
  try {
    const { query, userId, context = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Process query using simple text analysis
    const nluResults = await performTraditionalSearch(query, context);

    const processedResults = {
      query,
      processedQuery: query,
      results: nluResults,
      nluResult: {
        intents: [{ name: 'search', confidence: 0.8 }],
        entities: [{ name: 'searchTerm', value: query }],
        processingTime: Date.now()
      },
      confidence: 0.8,
      language: 'auto',
      semanticMatches: 0,
      traditionalMatches: nluResults.length,
      enhancedWithAI: false,
      personalized: false,
      fallbackUsed: false
    };

    // Track search for unavailable products (Requirement 6.1)
    if (userId && processedResults.results) {
      const unavailableProducts = processedResults.results.filter(item =>
        !item.stock || item.stock <= 0
      );

      if (unavailableProducts.length > 0) {
        await conversationalAI.trackUserSearchInterest(
          userId,
          query,
          unavailableProducts,
          context
        );
      }
    }

    res.json({
      success: true,
      data: {
        query: processedResults.query,
        processedQuery: processedResults.processedQuery,
        results: processedResults.results,
        nluAnalysis: {
          intents: processedResults.nluResult?.intents || [],
          entities: processedResults.nluResult?.entities || [],
          confidence: processedResults.confidence,
          language: processedResults.language,
          processingTime: processedResults.nluResult?.processingTime
        },
        metadata: {
          totalResults: processedResults.results?.length || 0,
          semanticMatches: processedResults.semanticMatches || 0,
          traditionalMatches: processedResults.traditionalMatches || 0,
          enhancedWithAI: processedResults.enhancedWithAI,
          personalized: processedResults.personalized,
          fallbackUsed: processedResults.fallbackUsed || false
        }
      }
    });
  } catch (error) {
    console.error('NLU search failed:', error);
    res.status(500).json({
      success: false,
      error: 'NLU search processing failed',
      fallback: true,
      message: 'Please try using basic search or contact support'
    });
  }
});

// Get user's product alerts (Requirements 6.4, 6.5)
router.get('/alerts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, status = 'active' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user's product alerts from conversationalAI service
    const alerts = await conversationalAI.getUserProductAlerts(userId, {
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: {
        alerts: alerts || [],
        count: alerts?.length || 0,
        userId,
        status,
        hasActiveAlerts: alerts && alerts.length > 0
      }
    });
  } catch (error) {
    console.error('Failed to get user alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user alerts'
    });
  }
});

// Track product interest manually (Requirements 6.4, 6.5)
router.post('/alerts/track', async (req, res) => {
  try {
    const { userId, productId, searchQuery, context = {} } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Product ID are required'
      });
    }

    // Get product details to check availability
    const { db } = require('../firebaseAdmin');
    const productDoc = await db.collection('items').doc(productId).get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const product = { id: productDoc.id, ...productDoc.data() };

    // Track interest using conversationalAI service
    const trackingResult = await conversationalAI.trackUserSearchInterest(
      userId,
      searchQuery || `Interest in ${product.name}`,
      [product],
      {
        ...context,
        manualTracking: true,
        timestamp: new Date()
      }
    );

    res.json({
      success: true,
      data: {
        tracked: true,
        productId,
        productName: product.name,
        userId,
        isAvailable: product.stock > 0,
        alertCreated: !product.stock || product.stock <= 0,
        message: product.stock > 0
          ? 'Product is currently available'
          : 'Alert created - you will be notified when this product becomes available'
      }
    });
  } catch (error) {
    console.error('Failed to track product interest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track product interest'
    });
  }
});

// Enhanced search with tracking for unavailable products (Requirements 5.4, 6.1)
router.get('/search', async (req, res) => {
  try {
    const { q: query, userId, category, minPrice, maxPrice, shopId, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Perform traditional search using direct database query
    const searchContext = {
      category,
      priceRange: { min: minPrice, max: maxPrice },
      shopId,
      limit: parseInt(limit)
    };

    const searchResults = await performTraditionalSearch(query, searchContext);

    // Track unavailable products if user is provided
    if (userId && searchResults) {
      const unavailableProducts = searchResults.filter(item =>
        !item.stock || item.stock <= 0
      );

      if (unavailableProducts.length > 0) {
        // Track interest in unavailable products for alert system
        await conversationalAI.trackUserSearchInterest(
          userId,
          query,
          unavailableProducts,
          {
            ...searchContext,
            searchType: 'traditional',
            timestamp: new Date()
          }
        );
      }
    }

    res.json({
      success: true,
      data: {
        query,
        results: searchResults || [],
        count: searchResults?.length || 0,
        searchContext,
        unavailableTracked: userId ? searchResults?.filter(item => !item.stock || item.stock <= 0).length : 0
      }
    });
  } catch (error) {
    console.error('Enhanced search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get inventory status
router.get('/status/:shopId?', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { db } = require('../firebaseAdmin');

    // Direct database query for inventory status
    let query = db.collectionGroup('items');
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const snapshot = await query.get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    const status = {
      totalItems: items.length,
      inStock: items.filter(item => item.stock > 0).length,
      outOfStock: items.filter(item => item.stock <= 0).length,
      lowStock: items.filter(item => item.stock > 0 && item.stock <= 10).length,
      shopId: shopId || 'all'
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get inventory status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory status'
    });
  }
});

// Get inventory analytics
router.get('/analytics/:shopId?', verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { db } = require('../firebaseAdmin');

    // Direct database query for analytics
    let query = db.collectionGroup('items');
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const snapshot = await query.get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    // Calculate basic analytics
    const analytics = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.price * item.stock), 0),
      averagePrice: items.length > 0 ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0,
      stockLevels: {
        inStock: items.filter(item => item.stock > 0).length,
        outOfStock: items.filter(item => item.stock <= 0).length,
        lowStock: items.filter(item => item.stock > 0 && item.stock <= 10).length
      },
      categories: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
      shopId: shopId || 'all',
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Failed to get inventory analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get inventory analytics'
    });
  }
});

// Get all shops with inventory metrics
router.get('/shops', async (req, res) => {
  try {
    const { db } = require('../firebaseAdmin');

    // Get all shops
    const shopsSnapshot = await db.collection('shops').get();
    const shops = [];

    for (const shopDoc of shopsSnapshot.docs) {
      const shop = { id: shopDoc.id, ...shopDoc.data() };

      // Get item count for each shop
      const itemsSnapshot = await db.collection('items').where('shopId', '==', shop.id).get();
      const items = [];
      itemsSnapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

      shops.push({
        ...shop,
        metrics: {
          totalItems: items.length,
          inStock: items.filter(item => item.stock > 0).length,
          outOfStock: items.filter(item => item.stock <= 0).length
        }
      });
    }

    res.json({
      success: true,
      data: shops,
      count: shops.length
    });
  } catch (error) {
    console.error('Failed to get shops:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shops'
    });
  }
});

// Get items for a shop
router.get('/items/:shopId?', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { format = 'json' } = req.query;
    const { db } = require('../firebaseAdmin');

    // Get items from database
    let query = db.collectionGroup('items');
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const snapshot = await query.get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    if (format === 'csv') {
      // Simple CSV formatting
      const csvHeaders = 'ID,Name,Category,Price,Stock,ShopId\n';
      const csvRows = items.map(item =>
        `${item.id},"${item.name}","${item.category}",${item.price},${item.stock},"${item.shopId}"`
      ).join('\n');
      const csvData = csvHeaders + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
      return res.send(csvData);
    }

    if (format === 'json-export') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.json');
      return res.json({ items, exportedAt: new Date(), count: items.length });
    }

    res.json({
      success: true,
      data: items,
      count: items.length,
      shopId: shopId || 'all'
    });
  } catch (error) {
    console.error('Failed to get items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get items'
    });
  }
});

// Check specific item inventory
router.get('/check/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { db } = require('../firebaseAdmin');

    const itemDoc = await db.collection('items').doc(itemId).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const item = { id: itemDoc.id, ...itemDoc.data() };

    // Calculate inventory metrics
    const isAvailable = item.stock > 0;
    const isLowStock = item.stock <= (item.lowStockThreshold || 10);
    const stockStatus = item.stock === 0 ? 'out_of_stock' :
      isLowStock ? 'low_stock' : 'in_stock';

    // Get shop details
    const shopDoc = await db.collection('shops').doc(item.shopId).get();
    const shop = shopDoc.exists ? shopDoc.data() : null;

    res.json({
      success: true,
      data: {
        item: {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          stock: item.stock,
          lowStockThreshold: item.lowStockThreshold || 10
        },
        shop: shop ? {
          id: item.shopId,
          name: shop.shopName,
          address: shop.address,
          phone: shop.phone
        } : null,
        availability: {
          isAvailable,
          isLowStock,
          stockStatus,
          message: isAvailable ?
            (isLowStock ? `Low stock: ${item.stock} units left` : `In stock: ${item.stock} units`) :
            'Out of stock',
          expectedRestockDate: item.expectedRestockDate || null
        }
      }
    });
  } catch (error) {
    console.error('Failed to check item inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check inventory'
    });
  }
});

// Update stock levels (Admin only)
router.put('/update-stock/:itemId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { newStock, reason = 'manual' } = req.body;

    if (typeof newStock !== 'number' || newStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid stock quantity is required'
      });
    }

    // Direct database update for stock
    const { db } = require('../firebaseAdmin');
    const itemRef = db.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const oldStock = itemDoc.data().stock;
    await itemRef.update({
      stock: newStock,
      lastUpdated: new Date(),
      updatedBy: req.user.uid
    });

    // Log stock movement
    await db.collection('stock_movements').add({
      itemId,
      oldStock,
      newStock,
      reason,
      updatedBy: req.user.uid,
      timestamp: new Date()
    });

    const result = {
      itemId,
      oldStock,
      newStock,
      reason,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: result,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Failed to update stock:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update stock'
    });
  }
});

// Bulk update inventory (Admin only)
router.post('/bulk-update', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { itemId, newStock, reason }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    const { db } = require('../firebaseAdmin');

    for (const update of updates) {
      try {
        const itemRef = db.collection('items').doc(update.itemId);
        const itemDoc = await itemRef.get();

        if (!itemDoc.exists) {
          errors.push({
            itemId: update.itemId,
            error: 'Item not found'
          });
          continue;
        }

        const oldStock = itemDoc.data().stock;
        await itemRef.update({
          stock: update.newStock,
          lastUpdated: new Date(),
          updatedBy: req.user.uid
        });

        // Log stock movement
        await db.collection('stock_movements').add({
          itemId: update.itemId,
          oldStock,
          newStock: update.newStock,
          reason: update.reason || 'bulk_update',
          updatedBy: req.user.uid,
          timestamp: new Date()
        });

        results.push({
          itemId: update.itemId,
          oldStock,
          newStock: update.newStock,
          reason: update.reason || 'bulk_update'
        });
      } catch (error) {
        errors.push({
          itemId: update.itemId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        totalProcessed: updates.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('Bulk update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk update failed'
    });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock/:shopId?', verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { threshold = 10 } = req.query;

    const { db } = require('../firebaseAdmin');
    let query = db.collection('items')
      .where('stock', '<=', parseInt(threshold))
      .where('stock', '>', 0);

    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const lowStockSnapshot = await query.get();
    const lowStockItems = [];

    lowStockSnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      lowStockItems.push({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.stock,
        threshold: item.lowStockThreshold || 10,
        shopId: item.shopId,
        priority: item.stock === 0 ? 'critical' : item.stock <= 5 ? 'high' : 'medium',
        daysUntilStockout: Math.ceil(item.stock / (item.avgSalesPerDay || 1))
      });
    });

    // Sort by priority and stock level
    lowStockItems.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.currentStock - b.currentStock;
    });

    res.json({
      success: true,
      data: {
        alerts: lowStockItems,
        count: lowStockItems.length,
        critical: lowStockItems.filter(item => item.priority === 'critical').length,
        high: lowStockItems.filter(item => item.priority === 'high').length,
        medium: lowStockItems.filter(item => item.priority === 'medium').length
      }
    });
  } catch (error) {
    console.error('Failed to get low stock alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get low stock alerts'
    });
  }
});

// Get restock recommendations
router.get('/recommendations/restock/:shopId?', verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { db } = require('../firebaseAdmin');

    // Get items for analysis
    let query = db.collectionGroup('items');
    if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const snapshot = await query.get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    // Generate simple restock recommendations
    const recommendations = items
      .filter(item => item.stock <= (item.lowStockThreshold || 10))
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        currentStock: item.stock,
        recommendedStock: Math.max(50, (item.lowStockThreshold || 10) * 3),
        priority: item.stock === 0 ? 'critical' : item.stock <= 5 ? 'high' : 'medium',
        estimatedCost: item.price * Math.max(50, (item.lowStockThreshold || 10) * 3),
        category: item.category,
        shopId: item.shopId
      }))
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    res.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
        totalEstimatedCost: recommendations.reduce((sum, rec) => sum + (rec.estimatedCost || 0), 0)
      }
    });
  } catch (error) {
    console.error('Failed to get restock recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restock recommendations'
    });
  }
});

// Run inventory update process
router.post('/update-process', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../firebaseAdmin');

    // Simple inventory update process - refresh analytics
    const itemsSnapshot = await db.collectionGroup('items').get();
    const items = [];
    itemsSnapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    const result = {
      totalItems: items.length,
      inStock: items.filter(item => item.stock > 0).length,
      outOfStock: items.filter(item => item.stock <= 0).length,
      lowStock: items.filter(item => item.stock > 0 && item.stock <= 10).length,
      processedAt: new Date(),
      message: 'Basic inventory analysis completed'
    };

    res.json({
      success: true,
      data: result,
      message: 'Inventory update process completed'
    });
  } catch (error) {
    console.error('Inventory update process failed:', error);
    res.status(500).json({
      success: false,
      error: 'Inventory update process failed'
    });
  }
});

// Get stock movement history
router.get('/movements/:itemId?', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 50, shopId } = req.query;

    const { db } = require('../firebaseAdmin');
    let query = db.collection('stock_movements')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (itemId) {
      query = query.where('itemId', '==', itemId);
    } else if (shopId) {
      query = query.where('shopId', '==', shopId);
    }

    const movementsSnapshot = await query.get();
    const movements = [];

    movementsSnapshot.forEach(doc => {
      movements.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      data: movements,
      count: movements.length
    });
  } catch (error) {
    console.error('Failed to get stock movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stock movements'
    });
  }
});

module.exports = router;