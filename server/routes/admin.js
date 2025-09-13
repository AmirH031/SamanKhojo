const express = require('express');
const router = express.Router();
const { admin } = require('../firebaseAdmin');
const { verifyAdmin } = require('../middleware/auth');
const { adminRateLimit } = require('../middleware/adminAuth');


// Get admin status
router.get('/status', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      admin: {
        email: user.email,
        uid: user.uid,
        emailVerified: user.email_verified,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get admin status error:', error);
    res.status(500).json({ 
      error: 'Failed to get admin status',
      details: error.message 
    });
  }
});

// Admin dashboard analytics
router.get('/analytics', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { db } = require('../firebaseAdmin');
    
    // Get basic counts
    const [shopsSnapshot, itemsSnapshot, bookingsSnapshot] = await Promise.all([
      db.collection('shops').get(),
      db.collectionGroup('items').get(), // Use collection group for new structure
      db.collection('bookings').get()
    ]);

    const analytics = {
      totalShops: shopsSnapshot.size,
      totalItems: itemsSnapshot.size,
      totalBookings: bookingsSnapshot.size,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      details: error.message 
    });
  }
});

module.exports = router;