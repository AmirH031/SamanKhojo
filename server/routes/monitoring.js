const express = require('express');
const { getCacheStats } = require('../middleware/cache');
const { connectionPool } = require('../middleware/connectionPool');

const router = express.Router();

// Performance metrics endpoint
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform
    },
    cache: getCacheStats(),
    database: connectionPool.getStats(),
    performance: {
      // These would be populated by your monitoring middleware
      averageResponseTime: req.app.locals.averageResponseTime || 0,
      requestsPerSecond: req.app.locals.requestsPerSecond || 0,
      errorRate: req.app.locals.errorRate || 0
    }
  };

  res.json(metrics);
});

// Health check with detailed status
router.get('/health/detailed', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: 'healthy',
        connections: connectionPool.getStats()
      },
      cache: {
        status: 'healthy',
        stats: getCacheStats()
      },
      memory: {
        status: process.memoryUsage().heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning', // 1GB threshold
        usage: process.memoryUsage()
      }
    }
  };

  // Determine overall health
  const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
  health.status = allHealthy ? 'healthy' : 'degraded';

  res.status(allHealthy ? 200 : 503).json(health);
});

// Performance alerts endpoint
router.get('/alerts', (req, res) => {
  const alerts = [];
  const memoryUsage = process.memoryUsage();
  const connectionStats = connectionPool.getStats();

  // Memory alerts
  if (memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
    alerts.push({
      type: 'warning',
      message: 'High memory usage detected',
      value: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      threshold: '1GB'
    });
  }

  // Connection pool alerts
  if (connectionStats.activeConnections > connectionStats.maxConnections * 0.8) {
    alerts.push({
      type: 'warning',
      message: 'High database connection usage',
      value: `${connectionStats.activeConnections}/${connectionStats.maxConnections}`,
      threshold: '80%'
    });
  }

  if (connectionStats.waitingQueue > 10) {
    alerts.push({
      type: 'critical',
      message: 'Database connection queue backing up',
      value: connectionStats.waitingQueue,
      threshold: '10'
    });
  }

  res.json({
    timestamp: new Date().toISOString(),
    alertCount: alerts.length,
    alerts
  });
});

module.exports = router;