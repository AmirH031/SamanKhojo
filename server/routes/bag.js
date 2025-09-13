const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { verifyToken } = require('../middleware/auth');

// Add item to bag
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { itemId, itemName, shopId, shopName, quantity = 1, unit = 'piece', price } = req.body;
    const userId = req.user.uid;

    if (!itemId || !itemName || !shopId || !shopName) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemId, itemName, shopId, shopName' 
      });
    }

    // Get or create user's bag
    const bagRef = db.collection('bags').doc(userId);
    const bagDoc = await bagRef.get();

    let bagData;
    if (bagDoc.exists) {
      bagData = bagDoc.data();
    } else {
      bagData = {
        uid: userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Check if item already exists in bag
    const existingItemIndex = bagData.items.findIndex(
      item => item.itemId === itemId && item.shopId === shopId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      bagData.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to bag
      bagData.items.push({
        itemId,
        itemName,
        shopId,
        shopName,
        quantity,
        unit,
        price: price || null,
        addedAt: new Date()
      });
    }

    bagData.updatedAt = new Date();

    await bagRef.set(bagData);

    res.json({
      success: true,
      message: 'Item added to bag successfully',
      bagCount: bagData.items.reduce((sum, item) => sum + item.quantity, 0)
    });

  } catch (error) {
    console.error('Add to bag error:', error);
    res.status(500).json({ 
      error: 'Failed to add item to bag',
      details: error.message 
    });
  }
});

// Get user's bag
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only access their own bag
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bagRef = db.collection('bags').doc(userId);
    const bagDoc = await bagRef.get();

    if (!bagDoc.exists) {
      return res.json({
        success: true,
        bag: {
          items: [],
          totalItems: 0,
          totalShops: 0
        }
      });
    }

    const bagData = bagDoc.data();
    const items = bagData.items || [];

    // Group items by shop
    const shopGroups = items.reduce((groups, item) => {
      if (!groups[item.shopId]) {
        groups[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          items: []
        };
      }
      groups[item.shopId].items.push(item);
      return groups;
    }, {});

    res.json({
      success: true,
      bag: {
        items,
        shopGroups: Object.values(shopGroups),
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalShops: Object.keys(shopGroups).length,
        updatedAt: bagData.updatedAt
      }
    });

  } catch (error) {
    console.error('Get bag error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bag',
      details: error.message 
    });
  }
});

// Update item quantity in bag
router.put('/item/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.uid;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const bagRef = db.collection('bags').doc(userId);
    const bagDoc = await bagRef.get();

    if (!bagDoc.exists) {
      return res.status(404).json({ error: 'Bag not found' });
    }

    const bagData = bagDoc.data();
    const itemIndex = bagData.items.findIndex(item => item.itemId === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in bag' });
    }

    bagData.items[itemIndex].quantity = quantity;
    bagData.updatedAt = new Date();

    await bagRef.set(bagData);

    res.json({
      success: true,
      message: 'Item quantity updated successfully'
    });

  } catch (error) {
    console.error('Update bag item error:', error);
    res.status(500).json({ 
      error: 'Failed to update item',
      details: error.message 
    });
  }
});

// Remove item from bag
router.delete('/item/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.uid;

    const bagRef = db.collection('bags').doc(userId);
    const bagDoc = await bagRef.get();

    if (!bagDoc.exists) {
      return res.status(404).json({ error: 'Bag not found' });
    }

    const bagData = bagDoc.data();
    bagData.items = bagData.items.filter(item => item.itemId !== itemId);
    bagData.updatedAt = new Date();

    await bagRef.set(bagData);

    res.json({
      success: true,
      message: 'Item removed from bag successfully'
    });

  } catch (error) {
    console.error('Remove from bag error:', error);
    res.status(500).json({ 
      error: 'Failed to remove item from bag',
      details: error.message 
    });
  }
});

// Clear entire bag
router.delete('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only clear their own bag
    if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bagRef = db.collection('bags').doc(userId);
    await bagRef.delete();

    res.json({
      success: true,
      message: 'Bag cleared successfully'
    });

  } catch (error) {
    console.error('Clear bag error:', error);
    res.status(500).json({ 
      error: 'Failed to clear bag',
      details: error.message 
    });
  }
});

// Confirm booking - Generate WhatsApp links
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { userPhone, userName } = req.body;

    // Get user's bag
    const bagRef = db.collection('bags').doc(userId);
    const bagDoc = await bagRef.get();

    if (!bagDoc.exists) {
      return res.status(404).json({ error: 'Bag is empty' });
    }

    const bagData = bagDoc.data();
    const items = bagData.items || [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'Bag is empty' });
    }

    // Group items by shop
    const shopGroups = items.reduce((groups, item) => {
      if (!groups[item.shopId]) {
        groups[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          items: []
        };
      }
      groups[item.shopId].items.push(item);
      return groups;
    }, {});

    // Get shop details for phone numbers
    const shopIds = Object.keys(shopGroups);
    const shopsSnapshot = await db.collection('shops').where('__name__', 'in', shopIds).get();
    const shopsMap = {};
    shopsSnapshot.docs.forEach(doc => {
      shopsMap[doc.id] = doc.data();
    });

    // Generate WhatsApp links for each shop
    const whatsappLinks = [];
    const bookingShops = [];

    for (const [shopId, shopGroup] of Object.entries(shopGroups)) {
      const shop = shopsMap[shopId];
      if (!shop || !shop.phone) {
        console.warn(`Shop ${shopId} not found or missing phone number`);
        continue;
      }

      // Generate booking message
      const itemsList = shopGroup.items
        .map(item => `• ${item.itemName} - ${item.quantity} ${item.unit}`)
        .join('\n');

      const message = `🛍️ New Booking Request

Customer: ${userName || 'Customer'}${userPhone ? ` (${userPhone})` : ''}

Items:
${itemsList}

📍 Please confirm availability and total amount.

Source: SamanKhojo
Thank you! 🙏`;

      // Create WhatsApp deep link
      const cleanPhone = shop.phone.replace(/[^0-9]/g, '');
      const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      whatsappLinks.push({
        shopId,
        shopName: shopGroup.shopName,
        shopPhone: shop.phone,
        whatsappLink,
        itemCount: shopGroup.items.length,
        totalQuantity: shopGroup.items.reduce((sum, item) => sum + item.quantity, 0)
      });

      // Prepare booking data
      bookingShops.push({
        shopId,
        shopName: shopGroup.shopName,
        shopPhone: shop.phone,
        items: shopGroup.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price
        })),
        status: 'pending',
        confirmedVia: 'WhatsAppDeepLink',
        whatsappLink
      });
    }

    // Save booking to Firestore
    const bookingData = {
      uid: userId,
      userName: userName || 'Customer',
      userPhone: userPhone || null,
      shops: bookingShops,
      totalShops: bookingShops.length,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      status: 'pending',
      createdAt: new Date(),
      source: 'SamanKhojo'
    };

    const bookingRef = await db.collection('bookings').add(bookingData);

    // Clear user's bag after successful booking
    await bagRef.delete();

    res.json({
      success: true,
      bookingId: bookingRef.id,
      message: 'Booking confirmed successfully',
      links: whatsappLinks,
      totalShops: whatsappLinks.length
    });

  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm booking',
      details: error.message 
    });
  }
});

module.exports = router;