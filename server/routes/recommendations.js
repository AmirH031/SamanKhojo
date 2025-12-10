/**
 * Recommendations API Routes
 * Handles personalized recommendations and related features
 */

const express = require('express');
const router = express.Router();
const personalizedShoppingService = require('../services/personalizedShoppingService');

const { verifyToken } = require('../middleware/auth');

// Get personalized recommendations
router.get('/personalized/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, limit = 10, includePromotions = true, includeCrossSell = true } = req.query;

    const recommendations = await personalizedShoppingService.getPersonalizedRecommendations(userId, {
      category,
      limit: parseInt(limit),
      includePromotions: includePromotions === 'true',
      includeCrossSell: includeCrossSell === 'true',
      location: req.query.location
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Failed to get personalized recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

// Get recommendations for homepage
router.get('/homepage/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'anonymous';
    console.log(`Getting homepage recommendations for user: ${userId}`);
    
    const { db } = require('../firebaseAdmin');
    
    // Get personalized recommendations if user is logged in
    let personalizedRecs = [];
    if (userId !== 'anonymous') {
      try {
        const personalizedData = await personalizedShoppingService.getPersonalizedRecommendations(userId, {
          limit: 6,
          includePromotions: true
        });
        personalizedRecs = personalizedData.recommendations || [];
      } catch (personalizedError) {
        console.warn('Failed to get personalized recommendations, continuing with general recommendations:', personalizedError.message);
      }
    }

    // Get trending items for all users (simplified query)
    let trendingItems = [];
    try {
      const trendingSnapshot = await db.collection('items')
        .limit(8)
        .get();

      trendingSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.stock && data.stock > 0) {
          trendingItems.push({ id: doc.id, ...data });
        }
      });
    } catch (trendingError) {
      console.warn('Failed to get trending items:', trendingError.message);
    }

    // Get featured promotions (simplified query)
    let featuredPromotions = [];
    try {
      const promotionsSnapshot = await db.collection('promotions')
        .limit(5)
        .get();

      promotionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.isActive) {
          featuredPromotions.push({ id: doc.id, ...data });
        }
      });
    } catch (promotionsError) {
      console.warn('Failed to get promotions:', promotionsError.message);
    }

    // Get new arrivals (simplified query)
    let newArrivals = [];
    try {
      const newArrivalsSnapshot = await db.collection('items')
        .limit(10)
        .get();

      newArrivalsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.stock && data.stock > 0) {
          newArrivals.push({ id: doc.id, ...data });
        }
      });
      
      // Sort by createdAt if available, otherwise keep first 6
      newArrivals.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt.toDate()) - new Date(a.createdAt.toDate());
        }
        return 0;
      });
      newArrivals = newArrivals.slice(0, 6);
    } catch (newArrivalsError) {
      console.warn('Failed to get new arrivals:', newArrivalsError.message);
    }

    // Filter out invalid promotions
    const validPromotions = featuredPromotions.filter(promo => {
      if (!promo.validUntil) return false;
      const validUntilDate = promo.validUntil.seconds 
        ? new Date(promo.validUntil.seconds * 1000)
        : new Date(promo.validUntil);
      return validUntilDate > new Date();
    });

    console.log(`Returning recommendations: personalized=${personalizedRecs.length}, trending=${trendingItems.length}, promotions=${validPromotions.length}, newArrivals=${newArrivals.length}`);

    res.json({
      success: true,
      data: {
        personalized: personalizedRecs,
        trending: trendingItems,
        promotions: validPromotions,
        newArrivals: newArrivals,
        isPersonalized: userId !== 'anonymous' && personalizedRecs.length > 0
      }
    });
  } catch (error) {
    console.error('Failed to get homepage recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get homepage recommendations',
      details: error.message
    });
  }
});

// Record user interaction
router.post('/interaction', async (req, res) => {
  try {
    const { userId, interaction } = req.body;

    if (!userId || !interaction) {
      return res.status(400).json({
        success: false,
        error: 'userId and interaction are required'
      });
    }

    const result = await personalizedShoppingService.recordUserInteraction(userId, interaction);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to record interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record interaction'
    });
  }
});

// Get user profile and preferences
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await personalizedShoppingService.getUserProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Get cross-sell recommendations for an item
router.get('/cross-sell/:itemId/:userId?', async (req, res) => {
  try {
    const { itemId, userId = 'anonymous' } = req.params;

    // Get item details
    const { db } = require('../firebaseAdmin');
    const itemDoc = await db.collection('items').doc(itemId).get();
    
    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    const item = itemDoc.data();
    
    // Get cross-sell recommendations (simple alternative matching)
    const crossSellItems = [];
    
    // If user is logged in, get personalized cross-sell
    let personalizedCrossSell = [];
    if (userId !== 'anonymous') {
      personalizedCrossSell = await personalizedShoppingService.getCrossSellRecommendations(
        userId, 
        [{ data: { itemId, category: item.category } }]
      );
    }

    res.json({
      success: true,
      data: {
        item: { id: itemId, ...item },
        crossSell: crossSellItems,
        personalized: personalizedCrossSell,
        isPersonalized: userId !== 'anonymous'
      }
    });
  } catch (error) {
    console.error('Failed to get cross-sell recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cross-sell recommendations'
    });
  }
});

// Get trending items by category
router.get('/trending/:category?', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const { db } = require('../firebaseAdmin');
    let query = db.collection('items').where('stock', '>', 0);

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    const itemsSnapshot = await query
      .orderBy('rating', 'desc')
      .limit(parseInt(limit))
      .get();

    const trendingItems = [];
    itemsSnapshot.forEach(doc => {
      trendingItems.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      data: {
        category: category || 'all',
        items: trendingItems,
        count: trendingItems.length
      }
    });
  } catch (error) {
    console.error('Failed to get trending items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending items'
    });
  }
});

// AI search endpoint (simple implementation)
router.post('/ai/search', async (req, res) => {
  try {
    const { query, userId, context = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Simple search suggestions based on query
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('rice')) {
      suggestions.push('Basmati Rice', 'Brown Rice', 'Jasmine Rice');
    } else if (lowerQuery.includes('mobile') || lowerQuery.includes('phone')) {
      suggestions.push('Smartphones', 'Mobile Accessories', 'Phone Cases');
    } else if (lowerQuery.includes('pizza')) {
      suggestions.push('Pizza Delivery', 'Italian Restaurants', 'Fast Food');
    } else {
      suggestions.push('Popular Items', 'Trending Products', 'Best Sellers');
    }

    res.json({
      success: true,
      data: {
        suggestions,
        query,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;