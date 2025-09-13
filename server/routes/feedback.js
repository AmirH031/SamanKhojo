const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');
const { verifyAdmin, adminRateLimit } = require('../middleware/adminAuth');

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      type,
      category,
      subject,
      message,
      rating,
      userAgent,
      url
    } = req.body;

    // Validate required fields
    if (!type || !category || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, category, subject, message' 
      });
    }

    if (subject.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Subject must be at least 5 characters long' 
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Message must be at least 10 characters long' 
      });
    }

    // Determine priority based on type
    let priority = 'medium';
    if (type === 'bug') priority = 'high';
    if (type === 'complaint') priority = 'high';
    if (type === 'suggestion') priority = 'low';

    // Create feedback document
    const feedbackData = {
      userId: userId || null,
      userName: userName || 'Anonymous',
      userEmail: userEmail || null,
      type,
      category,
      subject: subject.trim(),
      message: message.trim(),
      rating: rating || null,
      status: 'pending',
      priority,
      createdAt: FieldValue.serverTimestamp(),
      userAgent: userAgent || null,
      url: url || null
    };

    const docRef = await db.collection('feedback').add(feedbackData);

    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: error.message 
    });
  }
});

// Get user's feedback (authenticated users only)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const feedbackSnapshot = await db.collection('feedback')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const feedback = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user feedback',
      details: error.message 
    });
  }
});

// Get all feedback (admin only)
router.get('/admin/all', adminRateLimit(50, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { status, type, category, limit = 50 } = req.query;

    let query = db.collection('feedback');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    // Order and limit
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));

    const feedbackSnapshot = await query.get();

    const feedback = feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json({
      success: true,
      feedback,
      total: feedback.length
    });

  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback',
      details: error.message 
    });
  }
});

// Get feedback statistics (admin only)
router.get('/admin/stats', adminRateLimit(20, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const feedbackSnapshot = await db.collection('feedback').get();

    const stats = {
      total: 0,
      byType: {},
      byCategory: {},
      byStatus: {},
      byPriority: {},
      averageRating: 0
    };

    let totalRating = 0;
    let ratingCount = 0;

    feedbackSnapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;

      // Count by type
      stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;

      // Count by category
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;

      // Count by status
      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;

      // Count by priority
      stats.byPriority[data.priority] = (stats.byPriority[data.priority] || 0) + 1;

      // Calculate average rating
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
    });

    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback statistics',
      details: error.message 
    });
  }
});

// Update feedback status (admin only)
router.patch('/admin/:feedbackId', adminRateLimit(30, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status, adminNotes } = req.body;

    if (!feedbackId) {
      return res.status(400).json({ error: 'Feedback ID is required' });
    }

    const updateData = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (status) {
      updateData.status = status;
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await db.collection('feedback').doc(feedbackId).update(updateData);

    res.json({
      success: true,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ 
      error: 'Failed to update feedback',
      details: error.message 
    });
  }
});

module.exports = router;