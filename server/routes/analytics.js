const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');

// Get comprehensive analytics data
router.get('/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    // Get basic counts
    const [shopsSnapshot, itemsSnapshot, bookingsSnapshot] = await Promise.all([
      db.collection('shops').get(),
      db.collectionGroup('items').get(), // Use collection group for new structure
      db.collection('bookings').get()
    ]);
    
    // Get daily stats
    const dailyStats = await getDailyStats(days);
    
    // Get top shops
    const topShops = await getTopShops();
    
    // Get top searches
    const topSearches = await getTopSearches();
    
    // Get top booked items
    const topBookedItems = await getTopBookedItems();
    
    // Get recent activity
    const recentActivity = await getRecentActivity();
    
    const analytics = {
      totalShops: shopsSnapshot.size,
      totalItems: itemsSnapshot.size,
      totalBookings: bookingsSnapshot.size,
      totalReviews: await getTotalReviews(),
      dailyStats,
      topShops,
      topSearches,
      topBookedItems,
      recentActivity
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Helper functions
async function getDailyStats(days) {
  const stats = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get bookings for this date
    const bookingsSnapshot = await db.collection('bookings')
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .get();
    
    // Get searches for this date
    const searchSnapshot = await db.collection('logs')
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .where('type', '==', 'incoming')
      .get();
    
    // Get new users for this date
    const usersSnapshot = await db.collection('users')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .get();
    
    stats.push({
      date: dateStr,
      bookings: bookingsSnapshot.size,
      searches: searchSnapshot.size,
      newUsers: usersSnapshot.size,
      reviews: 0
    });
  }
  
  return stats.reverse();
}

async function getTopShops() {
  const shopsSnapshot = await db.collection('shops').get();
  const shopStats = [];
  
  for (const shopDoc of shopsSnapshot.docs) {
    const shopData = shopDoc.data();
    
    // Get booking count
    const bookingsSnapshot = await db.collection('bookings')
      .where('shopId', '==', shopDoc.id)
      .get();
    
    // Get reviews count
    const reviewsSnapshot = await db.collection('shops')
      .doc(shopDoc.id)
      .collection('reviews')
      .get();
    
    shopStats.push({
      id: shopDoc.id,
      name: shopData.shopName,
      totalBookings: bookingsSnapshot.size,
      averageRating: shopData.averageRating || 0,
      totalReviews: reviewsSnapshot.size
    });
  }
  
  return shopStats
    .sort((a, b) => (b.totalBookings + b.totalReviews) - (a.totalBookings + a.totalReviews))
    .slice(0, 10);
}

async function getTopSearches() {
  const logsSnapshot = await db.collection('logs')
    .where('type', '==', 'incoming')
    .orderBy('timestamp', 'desc')
    .limit(1000)
    .get();
  
  const searchCounts = {};
  
  logsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.message) {
      const query = data.message.toLowerCase().trim();
      if (query.length > 2) {
        searchCounts[query] = (searchCounts[query] || 0) + 1;
      }
    }
  });
  
  return Object.entries(searchCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function getTopBookedItems() {
  const analyticsSnapshot = await db.collection('bookingAnalytics')
    .orderBy('count', 'desc')
    .limit(10)
    .get();
  
  const topItems = [];
  
  for (const doc of analyticsSnapshot.docs) {
    const data = doc.data();
    
    // Get shop name
    const shopDoc = await db.collection('shops').doc(data.shopId).get();
    const shopName = shopDoc.exists ? shopDoc.data().shopName : 'Unknown Shop';
    
    topItems.push({
      itemName: data.itemName,
      shopName,
      bookingCount: data.count,
      lastBooked: data.lastBookedAt?.toDate() || new Date()
    });
  }
  
  return topItems;
}

async function getRecentActivity() {
  const activities = [];
  
  // Recent bookings
  const bookingsSnapshot = await db.collection('bookings')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  bookingsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'booking',
      description: `New booking at ${data.shopName}`,
      timestamp: data.timestamp?.toDate() || new Date(),
      userId: data.uid,
      shopId: data.shopId
    });
  });
  
  // Recent searches
  const searchSnapshot = await db.collection('logs')
    .where('type', '==', 'incoming')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  searchSnapshot.docs.forEach(doc => {
    const data = doc.data();
    activities.push({
      type: 'search',
      description: `Search: "${data.message}"`,
      timestamp: data.timestamp?.toDate() || new Date(),
      userId: data.phoneNumber
    });
  });
  
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);
}

async function getTotalReviews() {
  const shopsSnapshot = await db.collection('shops').get();
  let totalReviews = 0;
  
  for (const shopDoc of shopsSnapshot.docs) {
    const reviewsSnapshot = await db.collection('shops')
      .doc(shopDoc.id)
      .collection('reviews')
      .get();
    totalReviews += reviewsSnapshot.size;
  }
  
  return totalReviews;
}

module.exports = router;