const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { verifyToken } = require('../middleware/auth');

// Get user role and permissions
router.get('/user/role', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    const isAdmin = user.email === adminEmail && user.email_verified;
    
    res.json({
      success: true,
      isAdmin,
      role: isAdmin ? 'admin' : 'user',
      permissions: isAdmin ? ['read', 'write', 'delete', 'admin'] : ['read']
    });
  } catch (error) {
    console.error('Get user role error:', error);
    res.status(500).json({ 
      error: 'Failed to get user role',
      details: error.message 
    });
  }
});

// Get user profile
router.get('/user/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User profile not found' 
      });
    }
    
    const userData = userDoc.data();
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = user.email === adminEmail && user.email_verified;
    
    res.json({
      success: true,
      profile: {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        isGuest: userData.isGuest || false,
        isAdmin,
        emailVerified: user.email_verified,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get user profile',
      details: error.message 
    });
  }
});

// Update user profile
router.put('/user/profile', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { name, phoneNumber } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) {
      updateData.name = name.trim();
    }
    
    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }
    
    await db.collection('users').doc(user.uid).update(updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error.message 
    });
  }
});

// Verify admin email (admin only)
router.post('/user/verify-email', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (user.email !== adminEmail) {
      return res.status(403).json({ 
        error: 'Not authorized for email verification' 
      });
    }

    // Auto-verify admin email if not already verified
    if (!user.email_verified) {
      const { admin } = require('../firebaseAdmin');
      await admin.auth().updateUser(user.uid, {
        emailVerified: true
      });
      
      res.json({
        success: true,
        message: 'Admin email verified successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Email already verified'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify email',
      details: error.message 
    });
  }
});

// Find existing user by email or phone
router.post('/find-user', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ 
        error: 'Email or phone number is required' 
      });
    }

    let query = db.collection('users');
    
    if (email) {
      query = query.where('email', '==', email);
    } else if (phoneNumber) {
      query = query.where('phoneNumber', '==', phoneNumber);
    }

    const snapshot = await query.limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No user found with the provided credentials'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        isGuest: userData.isGuest || false
      }
    });

  } catch (error) {
    console.error('Find user error:', error);
    res.status(500).json({ 
      error: 'Failed to find user',
      details: error.message 
    });
  }
});

// Create user profile
router.post('/create-profile', async (req, res) => {
  try {
    const { uid, name, email, phoneNumber, isGuest } = req.body;

    if (!uid || !name) {
      return res.status(400).json({ 
        error: 'User ID and name are required' 
      });
    }

    const profileData = {
      name: name.trim(),
      email: email || null,
      phoneNumber: phoneNumber || null,
      isGuest: isGuest || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };

    await db.collection('users').doc(uid).set(profileData);

    res.json({
      success: true,
      message: 'Profile created successfully',
      profile: profileData
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ 
      error: 'Failed to create profile',
      details: error.message 
    });
  }
});

module.exports = router;