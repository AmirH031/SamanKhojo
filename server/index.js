const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { festivalCacheMiddleware, userCacheMiddleware, bagCacheMiddleware, searchCacheMiddleware, getCacheStats } = require('./middleware/cache');
const { withConnection, connectionPool } = require('./middleware/connectionPool');
const { errorHandler, notFoundHandler, requestIdMiddleware } = require('./middleware/errorHandler');

// Import background jobs and triggers
const availabilityMonitorJob = require('./jobs/availabilityMonitorJob');
const nluModelRetrainingJob = require('./jobs/nluModelRetrainingJob');
const productAvailabilityTrigger = require('./triggers/productAvailabilityTrigger');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://khojo-9ae5c.web.app', 'https://khojo-9ae5c.firebaseapp.com'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002', 'https://khojo-9ae5c.web.app'],
  credentials: true
}));

// Middleware
app.use(requestIdMiddleware); // Add request ID tracking
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add connection pooling middleware
app.use(withConnection);

// Performance monitoring middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - req.startTime;
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Add performance headers (only if not already sent)
    if (!res.headersSent) {
      res.set('X-Response-Time', `${duration}ms`);
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
});

// Optimized rate limiting for high-throughput scenarios
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 500, // 500 requests per minute per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path.startsWith('/static');
  }
});

// Per-user rate limiting for expensive operations
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Production rate limit
  message: { error: 'Rate limit exceeded for this operation.' },
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user?.uid || req.ip;
  }
});

// High-capacity rate limiting for read-only operations
const readOnlyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Increased from 200 to 1000 for read operations
  message: { error: 'Too many read requests, please slow down.' },
  skip: (req) => {
    // Skip for cached responses
    return req.headers['x-cache'] === 'HIT';
  }
});

app.use('/api/', generalLimiter);

// Import routes
const analyticsRouter = require('./routes/analytics');
const adminDataRouter = require('./routes/adminData');
const searchRouter = require('./routes/search');
const shopsRouter = require('./routes/shops');
const feedbackRouter = require('./routes/feedback');
const ratingsRouter = require('./routes/ratings');
const itemsRouter = require('./routes/items');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const chatbotRouter = require('./routes/chatbot');
const bagRouter = require('./routes/bag');
const festivalRouter = require('./routes/festival');
const monitoringRouter = require('./routes/monitoring');
const recommendationsRouter = require('./routes/recommendations');
const inventoryRouter = require('./routes/inventory');



// Routes

app.use('/api/analytics', analyticsRouter);
app.use('/api/admin-data', adminDataRouter);
app.use('/api/search', searchRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/bag', bagRouter);
// Apply rate limiting and caching to frequently accessed routes
app.use('/api/festival/active', readOnlyLimiter, festivalCacheMiddleware);
app.use('/api/festival/:id/layout', readOnlyLimiter, festivalCacheMiddleware);
app.use('/api/festival/assets/search', readOnlyLimiter, festivalCacheMiddleware);
app.use('/api/auth/user/role', readOnlyLimiter, userCacheMiddleware);
app.use('/api/bag/:userId', readOnlyLimiter, bagCacheMiddleware);
app.use('/api/search', readOnlyLimiter, searchCacheMiddleware); // Cache expensive search queries
app.use('/api/festival', festivalRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/inventory', inventoryRouter);




// Chatbot interface removed - integrated into main application


// Enhanced health check with performance metrics and background job status
app.get('/health', async (req, res) => {
  const cacheStats = getCacheStats();
  const connectionStats = connectionPool.getStats();
  
  // Get background job status
  let backgroundJobs = {};
  try {
    backgroundJobs = {
      availabilityMonitor: availabilityMonitorJob.getStatus(),
      nluRetraining: nluModelRetrainingJob.getStatus(),
      productTrigger: productAvailabilityTrigger.getHealthStatus()
    };
  } catch (error) {
    backgroundJobs.error = error.message;
  }
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    performance: {
      rateLimits: {
        general: '500 requests per minute',
        readOnly: '1000 requests per minute',
        strict: '100 requests per minute'
      },
      caching: {
        enabled: true,
        stats: cacheStats
      },
      database: {
        connectionPool: connectionStats
      }
    },
    backgroundJobs,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Background job management endpoints
app.get('/api/admin/background-jobs/status', async (req, res) => {
  try {
    const [availabilityStats, trainingStats] = await Promise.all([
      availabilityMonitorJob.getStatistics(),
      nluModelRetrainingJob.getTrainingStatistics()
    ]);
    
    res.json({
      availabilityMonitoring: availabilityStats,
      nluTraining: trainingStats,
      triggers: productAvailabilityTrigger.getHealthStatus()
    });
  } catch (error) {
    console.error('❌ Error getting background job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger endpoints for admin
app.post('/api/admin/background-jobs/trigger-availability-check', async (req, res) => {
  try {
    await availabilityMonitorJob.runJob();
    res.json({ message: 'Availability check triggered successfully' });
  } catch (error) {
    console.error('❌ Error triggering availability check:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/background-jobs/trigger-nlu-retraining', async (req, res) => {
  try {
    await nluModelRetrainingJob.triggerManualRetraining();
    res.json({ message: 'NLU retraining triggered successfully' });
  } catch (error) {
    console.error('❌ Error triggering NLU retraining:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for background monitoring system
app.post('/api/admin/background-jobs/test-system', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Test availability monitoring
    try {
      const availabilityStats = await availabilityMonitorJob.getStatistics();
      testResults.tests.push({
        name: 'Availability Monitor',
        status: 'pass',
        details: availabilityStats
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Availability Monitor',
        status: 'fail',
        error: error.message
      });
    }
    
    // Test NLU retraining job
    try {
      const trainingStats = await nluModelRetrainingJob.getTrainingStatistics();
      testResults.tests.push({
        name: 'NLU Retraining',
        status: 'pass',
        details: trainingStats
      });
    } catch (error) {
      testResults.tests.push({
        name: 'NLU Retraining',
        status: 'fail',
        error: error.message
      });
    }
    
    // Test Firestore triggers
    try {
      const triggerHealth = productAvailabilityTrigger.getHealthStatus();
      testResults.tests.push({
        name: 'Product Availability Trigger',
        status: 'pass',
        details: triggerHealth
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Product Availability Trigger',
        status: 'fail',
        error: error.message
      });
    }
    
    const passedTests = testResults.tests.filter(t => t.status === 'pass').length;
    const totalTests = testResults.tests.length;
    
    testResults.summary = {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    };
    
    res.json(testResults);
  } catch (error) {
    console.error('❌ Error running background system tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Enhanced error handling middleware
app.use(errorHandler);

// Initialize background monitoring system
async function initializeBackgroundSystem() {
  try {
    console.log('🔄 Initializing background monitoring system...');
    

    
    // Initialize Firestore triggers for real-time monitoring
    productAvailabilityTrigger.initializeListeners();
    
    // Start availability monitoring job
    if (process.env.PRODUCT_ALERTS_ENABLED === 'true') {
      availabilityMonitorJob.start();
      console.log('✅ Availability monitoring job started');
    } else {
      console.log('⚠️ Product alerts disabled, skipping availability monitoring');
    }
    
    // Start NLU model retraining job
    if (process.env.NLU_TRAINING_ENABLED === 'true') {
      nluModelRetrainingJob.start();
      console.log('✅ NLU model retraining job started');
    } else {
      console.log('⚠️ NLU training disabled, skipping model retraining job');
    }
    
    console.log('✅ Background monitoring system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize background monitoring system:', error);
    
    // Don't crash the server, but log the error
    setTimeout(() => {
      console.log('🔄 Retrying background system initialization in 30 seconds...');
      initializeBackgroundSystem();
    }, 30000);
  }
}

// Graceful shutdown handler
function setupGracefulShutdown() {
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Stop background jobs
    try {
      availabilityMonitorJob.stop();
      nluModelRetrainingJob.stop();
      console.log('✅ Background jobs stopped');
    } catch (error) {
      console.error('❌ Error stopping background jobs:', error);
    }
    
    // Close server
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

const server = app.listen(PORT, async () => {
  console.log(`🚀 SamanKhojo Server running on port ${PORT}`);
  console.log(`🛍️ Shopping platform ready`);
  
  // Initialize background monitoring system
  await initializeBackgroundSystem();
  
  // Setup graceful shutdown
  setupGracefulShutdown();
});

module.exports = app;
