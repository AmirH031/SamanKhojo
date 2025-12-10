const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const cacheMiddleware = require('../middleware/cache');

// Get booking items for a user
router.get('/items/:userId', cacheMiddleware(30000), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const bookingItemsRef = db.collection('bookingItems');
    const query = bookingItemsRef
      .where('uid', '==', userId)
      .orderBy('addedAt', 'desc');
    
    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ items });
  } catch (error) {
    console.error('Error fetching booking items:', error);
    res.status(500).json({ error: 'Failed to fetch booking items' });
  }
});

// Search items for booking
router.get('/search-items', cacheMiddleware(60000), async (req, res) => {
  try {
    const { q: query, shopId, limit = 20 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let itemsQuery = db.collection('items');
    
    // Filter by shop if provided
    if (shopId) {
      itemsQuery = itemsQuery.where('shopId', '==', shopId);
    }
    
    // Only get available items
    itemsQuery = itemsQuery.where('isAvailable', '==', true);
    
    const snapshot = await itemsQuery.limit(parseInt(limit)).get();
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter items based on search terms
    items = items.filter(item => {
      const searchableText = [
        item.name || '',
        item.hindi_name || '',
        item.description || '',
        item.category || '',
        item.brand_name || ''
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchableText.includes(term));
    });

    // Sort by relevance (exact matches first)
    items.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
      if (!aName.includes(queryLower) && bName.includes(queryLower)) return 1;
      return 0;
    });

    res.json({ results: items });
  } catch (error) {
    console.error('Error searching booking items:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

// Get shop details for booking
router.get('/shop/:shopId', cacheMiddleware(300000), async (req, res) => {
  try {
    const { shopId } = req.params;
    
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }

    const shopDoc = await db.collection('shops').doc(shopId).get();
    
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shopData = {
      id: shopDoc.id,
      ...shopDoc.data()
    };

    res.json(shopData);
  } catch (error) {
    console.error('Error fetching shop for booking:', error);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
});

// Get all shops for booking selection
router.get('/shops', cacheMiddleware(300000), async (req, res) => {
  try {
    const { limit = 50, category, isOpen } = req.query;
    
    let shopsQuery = db.collection('shops');
    
    // Filter by category if provided
    if (category && category !== 'all') {
      shopsQuery = shopsQuery.where('category', '==', category);
    }
    
    // Get shops
    const snapshot = await shopsQuery.limit(parseInt(limit)).get();
    let shops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by open status if requested
    if (isOpen === 'true') {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      shops = shops.filter(shop => {
        if (!shop.openingTime || !shop.closingTime) return true;
        
        const [openHour, openMin] = shop.openingTime.split(':').map(Number);
        const [closeHour, closeMin] = shop.closingTime.split(':').map(Number);
        
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        
        if (closeTime > openTime) {
          return currentTime >= openTime && currentTime <= closeTime;
        } else {
          return currentTime >= openTime || currentTime <= closeTime;
        }
      });
    }

    // Sort by featured first, then by name
    shops.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (a.shopName || '').localeCompare(b.shopName || '');
    });

    res.json({ shops });
  } catch (error) {
    console.error('Error fetching shops for booking:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Create a booking
router.post('/create', async (req, res) => {
  try {
    const { shopId, shopName, items, uid, userAgent = 'web' } = req.body;
    
    if (!shopId || !shopName || !items || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty' });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.name || !item.quantity || !item.unit) {
        return res.status(400).json({ error: 'Each item must have name, quantity, and unit' });
      }
    }

    const bookingData = {
      shopId,
      shopName,
      items,
      uid,
      userAgent,
      status: 'pending',
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('bookings').add(bookingData);
    
    res.json({ 
      success: true, 
      bookingId: docRef.id,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's booking history
router.get('/history/:userId', cacheMiddleware(30000), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, status } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let bookingsQuery = db.collection('bookings')
      .where('uid', '==', userId)
      .orderBy('timestamp', 'desc');
    
    if (status) {
      bookingsQuery = bookingsQuery.where('status', '==', status);
    }
    
    const snapshot = await bookingsQuery.limit(parseInt(limit)).get();
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
});

module.exports = router;