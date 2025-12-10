const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');

// Get shops with distance calculation and filtering
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10, sortBy = 'distance', search } = req.query;
    
    const shopsSnapshot = await db.collection('shops').get();
    let shops = shopsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Add distance calculation if location provided
    if (lat && lng) {
      shops = shops.map(shop => {
        if (shop.location) {
          const distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            shop.location.lat, shop.location.lng
          );
          return { ...shop, distance };
        }
        return shop;
      });

      // Filter by radius
      shops = shops.filter(shop => 
        !shop.distance || shop.distance <= parseFloat(radius)
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      shops = shops.filter(shop =>
        shop.shopName?.toLowerCase().includes(searchLower) ||
        shop.address?.toLowerCase().includes(searchLower) ||
        shop.type?.toLowerCase().includes(searchLower)
      );
    }

    // Sort shops
    shops.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (a.distance && b.distance) return a.distance - b.distance;
          return 0;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'name':
          return (a.shopName || '').localeCompare(b.shopName || '');
        default:
          return 0;
      }
    });

    res.json(shops);
  } catch (error) {
    console.error('Shops API error:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Get shop details with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // Optional type filter: product, menu, service
    
    // Get shop details
    const shopDoc = await db.collection('shops').doc(id).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shop = { id: shopDoc.id, ...shopDoc.data() };

    // Get items for this shop with optional type filtering (NEW STRUCTURE)
    let itemsQuery = db.collection('shops').doc(id).collection('items');
    
    if (type && ['product', 'menu', 'service'].includes(type)) {
      itemsQuery = itemsQuery.where('type', '==', type);
    }
    
    const itemsSnapshot = await itemsQuery.get();
    
    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      shopId: id, // Add shopId since it's implicit in the path
      ...doc.data()
    }));

    // Group items by category and type
    const groupedItems = items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});

    // Group by type as well
    const itemsByType = items.reduce((acc, item) => {
      const itemType = item.type || 'product';
      if (!acc[itemType]) acc[itemType] = [];
      acc[itemType].push(item);
      return acc;
    }, {});

    res.json({
      shop,
      items,
      groupedItems,
      itemsByType,
      categories: Object.keys(groupedItems).map(category => ({
        name: category,
        count: groupedItems[category].length,
        items: groupedItems[category]
      })),
      types: Object.keys(itemsByType).map(type => ({
        name: type,
        count: itemsByType[type].length,
        items: itemsByType[type]
      }))
    });
  } catch (error) {
    console.error('Shop details API error:', error);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
});

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = router;