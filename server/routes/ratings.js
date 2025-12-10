const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

// Add or update shop rating
router.post('/shops/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { userId, userName, rating, review } = req.body;

    // Validate required fields
    if (!userId || !userName || !rating) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userName, rating' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Check if shop exists
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if user has already rated this shop
    const existingRatingQuery = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .where('userId', '==', userId)
      .get();

    let ratingId;

    if (!existingRatingQuery.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatingQuery.docs[0];
      ratingId = existingRatingDoc.id;
      
      await db.collection('shops')
        .doc(shopId)
        .collection('reviews')
        .doc(ratingId)
        .update({
          rating,
          comment: review || '',
          updatedAt: FieldValue.serverTimestamp()
        });
    } else {
      // Add new rating
      const newRatingRef = await db.collection('shops')
        .doc(shopId)
        .collection('reviews')
        .add({
          shopId,
          userId,
          userName,
          rating,
          comment: review || '',
          createdAt: FieldValue.serverTimestamp(),
          isVerified: false,
          helpfulCount: 0
        });
      ratingId = newRatingRef.id;
    }

    // Update shop's average rating
    await updateShopRating(shopId);

    res.status(201).json({
      success: true,
      id: ratingId,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Shop rating submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit rating',
      details: error.message 
    });
  }
});

// Get shop ratings
router.get('/shops/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if shop exists
    const shopDoc = await db.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Get reviews
    const reviewsSnapshot = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Get rating summary
    const allReviewsSnapshot = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .get();

    const allReviews = allReviewsSnapshot.docs.map(doc => doc.data());
    
    const summary = calculateRatingSummary(allReviews);

    res.json({
      success: true,
      reviews,
      summary,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: allReviews.length,
        hasMore: (parseInt(offset) + parseInt(limit)) < allReviews.length
      }
    });

  } catch (error) {
    console.error('Get shop ratings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shop ratings',
      details: error.message 
    });
  }
});

// Get user's rating for a shop
router.get('/shops/:shopId/user/:userId', async (req, res) => {
  try {
    const { shopId, userId } = req.params;

    const userRatingQuery = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .where('userId', '==', userId)
      .get();

    if (userRatingQuery.empty) {
      return res.json({
        success: true,
        rating: null
      });
    }

    const ratingDoc = userRatingQuery.docs[0];
    const rating = {
      id: ratingDoc.id,
      ...ratingDoc.data(),
      createdAt: ratingDoc.data().createdAt?.toDate?.() || ratingDoc.data().createdAt
    };

    res.json({
      success: true,
      rating
    });

  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user rating',
      details: error.message 
    });
  }
});

// Mark review as helpful
router.post('/shops/:shopId/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const { shopId, reviewId } = req.params;

    await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .doc(reviewId)
      .update({
        helpfulCount: FieldValue.increment(1)
      });

    res.json({
      success: true,
      message: 'Review marked as helpful'
    });

  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({ 
      error: 'Failed to mark review as helpful',
      details: error.message 
    });
  }
});

// Delete review (user can delete their own review)
router.delete('/shops/:shopId/reviews/:reviewId', async (req, res) => {
  try {
    const { shopId, reviewId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if the review belongs to the user
    const reviewDoc = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .doc(reviewId)
      .get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (reviewDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    // Delete the review
    await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .doc(reviewId)
      .delete();

    // Update shop's average rating
    await updateShopRating(shopId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      error: 'Failed to delete review',
      details: error.message 
    });
  }
});

// Helper function to update shop's average rating
async function updateShopRating(shopId) {
  try {
    const reviewsSnapshot = await db.collection('shops')
      .doc(shopId)
      .collection('reviews')
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => doc.data());
    
    if (reviews.length === 0) {
      // No reviews, remove rating fields
      await db.collection('shops').doc(shopId).update({
        averageRating: FieldValue.delete(),
        totalReviews: 0,
        updatedAt: FieldValue.serverTimestamp()
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update shop document
    await db.collection('shops').doc(shopId).update({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      updatedAt: FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error updating shop rating:', error);
  }
}

// Helper function to calculate rating summary
function calculateRatingSummary(reviews) {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
    }
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution
  };
}

// Get all reviews by a user across all shops
router.get('/user/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get all shops first
    const shopsSnapshot = await db.collection('shops').get();
    const allReviews = [];

    // Query each shop's reviews subcollection for this user
    for (const shopDoc of shopsSnapshot.docs) {
      const shopData = shopDoc.data();
      const reviewsQuery = await db.collection('shops')
        .doc(shopDoc.id)
        .collection('reviews')
        .where('userId', '==', userId)
        .get();

      reviewsQuery.docs.forEach(reviewDoc => {
        allReviews.push({
          id: reviewDoc.id,
          shopId: shopDoc.id,
          shopName: shopData.shopName,
          ...reviewDoc.data(),
          createdAt: reviewDoc.data().createdAt?.toDate?.() || reviewDoc.data().createdAt
        });
      });
    }

    // Sort by creation date (newest first)
    allReviews.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    res.json({
      success: true,
      reviews: paginatedReviews,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: allReviews.length,
        hasMore: endIndex < allReviews.length
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user reviews',
      details: error.message 
    });
  }
});

// Get user activity statistics
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get bookings count
    const bookingsSnapshot = await db.collection('bookings')
      .where('uid', '==', userId)
      .get();

    // Get reviews count across all shops
    const shopsSnapshot = await db.collection('shops').get();
    let totalReviews = 0;
    const visitedShops = new Set();

    for (const shopDoc of shopsSnapshot.docs) {
      const reviewsQuery = await db.collection('shops')
        .doc(shopDoc.id)
        .collection('reviews')
        .where('userId', '==', userId)
        .get();

      if (!reviewsQuery.empty) {
        totalReviews += reviewsQuery.size;
        visitedShops.add(shopDoc.id);
      }
    }

    // Also count shops from bookings
    bookingsSnapshot.docs.forEach(doc => {
      visitedShops.add(doc.data().shopId);
    });

    const stats = {
      totalBookings: bookingsSnapshot.size,
      totalReviews,
      shopsVisited: visitedShops.size
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      details: error.message 
    });
  }
});

module.exports = router;