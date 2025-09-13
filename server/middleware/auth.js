const { admin } = require('../firebaseAdmin');

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No valid authorization token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token Expired', 
        message: 'Authentication token has expired' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid authentication token' 
    });
  }
};

/**
 * Middleware to verify admin access
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // First verify the token
    await new Promise((resolve, reject) => {
      verifyToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const user = req.user;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    // Check admin privileges
    const isAdmin = user.email === adminEmail && user.email_verified;
    
    if (!isAdmin) {
      console.warn(`Unauthorized admin access attempt by: ${user.email}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin privileges required' 
      });
    }

    req.isAdmin = true;
    console.log(`Admin access granted to: ${user.email}`);
    
    next();
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid authentication token' 
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};