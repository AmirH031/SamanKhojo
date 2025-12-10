const { verifyAdmin } = require('./auth');


/**
 * Rate limiting middleware for admin endpoints
 */
const adminRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [id, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(id);
      }
    }
    
    // Check current client
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      requests.set(clientId, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    if (now - clientData.firstRequest > windowMs) {
      // Reset window
      requests.set(clientId, {
        count: 1,
        firstRequest: now
      });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for admin endpoints'
      });
    }
    
    clientData.count++;
    next();
  };
};

module.exports = {
  verifyAdmin,
  adminRateLimit
};