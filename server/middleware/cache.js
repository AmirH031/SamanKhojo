const NodeCache = require('node-cache');

// Enhanced cache instances with better performance settings
const festivalCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for festival data
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance, but be careful with object mutations
  maxKeys: 1000 // Limit memory usage
});

const userCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for user data
  checkperiod: 120,
  useClones: false,
  maxKeys: 5000
});

const bagCache = new NodeCache({ 
  stdTTL: 60, // 1 minute for bag data (more dynamic)
  checkperiod: 30,
  useClones: false,
  maxKeys: 2000
});

// High-performance search cache for expensive queries
const searchCache = new NodeCache({
  stdTTL: 180, // 3 minutes for search results
  checkperiod: 60,
  useClones: false,
  maxKeys: 10000
});

// Generic cache middleware factory
const createCacheMiddleware = (cache, keyGenerator, ttl) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cachedData = cache.get(key);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      if (res.statusCode === 200 && data) {
        cache.set(key, data, ttl || undefined);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Specific cache middlewares
const festivalCacheMiddleware = createCacheMiddleware(
  festivalCache,
  (req) => `festival:${req.path}:${JSON.stringify(req.query)}`,
  300 // 5 minutes
);

const userCacheMiddleware = createCacheMiddleware(
  userCache,
  (req) => `user:${req.user?.uid || 'anonymous'}:${req.path}`,
  600 // 10 minutes
);

const bagCacheMiddleware = createCacheMiddleware(
  bagCache,
  (req) => `bag:${req.params.userId || req.user?.uid}:${req.path}`,
  60 // 1 minute
);

// Cache invalidation helpers
const invalidateFestivalCache = () => {
  festivalCache.flushAll();
  console.log('Festival cache invalidated');
};

const invalidateUserCache = (userId) => {
  if (userId) {
    const keys = userCache.keys().filter(key => key.includes(userId));
    userCache.del(keys);
    console.log(`User cache invalidated for: ${userId}`);
  } else {
    userCache.flushAll();
    console.log('All user cache invalidated');
  }
};

const invalidateBagCache = (userId) => {
  if (userId) {
    const keys = bagCache.keys().filter(key => key.includes(userId));
    bagCache.del(keys);
    console.log(`Bag cache invalidated for: ${userId}`);
  } else {
    bagCache.flushAll();
    console.log('All bag cache invalidated');
  }
};

// Search cache middleware for expensive queries
const searchCacheMiddleware = createCacheMiddleware(
  searchCache,
  (req) => `search:${JSON.stringify(req.body)}:${JSON.stringify(req.query)}`,
  180 // 3 minutes
);

// Cache invalidation for search
const invalidateSearchCache = () => {
  searchCache.flushAll();
  console.log('Search cache invalidated');
};

// Enhanced cache stats for monitoring
const getCacheStats = () => {
  return {
    festival: {
      keys: festivalCache.keys().length,
      hits: festivalCache.getStats().hits,
      misses: festivalCache.getStats().misses
    },
    user: {
      keys: userCache.keys().length,
      hits: userCache.getStats().hits,
      misses: userCache.getStats().misses
    },
    bag: {
      keys: bagCache.keys().length,
      hits: bagCache.getStats().hits,
      misses: bagCache.getStats().misses
    },
    search: {
      keys: searchCache.keys().length,
      hits: searchCache.getStats().hits,
      misses: searchCache.getStats().misses
    }
  };
};

module.exports = {
  festivalCacheMiddleware,
  userCacheMiddleware,
  bagCacheMiddleware,
  searchCacheMiddleware,
  invalidateFestivalCache,
  invalidateUserCache,
  invalidateBagCache,
  invalidateSearchCache,
  createCacheMiddleware,
  getCacheStats
};