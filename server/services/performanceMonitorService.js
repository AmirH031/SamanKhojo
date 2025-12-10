/**
 * Performance Monitoring Service
 * Monitors NLU response times, alert processing, and system performance
 */

const cacheService = require('./cacheService');

class PerformanceMonitorService {
  constructor() {
    this.metrics = {
      nlu: {
        totalRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorCount: 0,
        cacheHitCount: 0,
        cacheMissCount: 0,
        timeouts: 0,
        lastReset: new Date()
      },
      alerts: {
        totalGenerated: 0,
        totalDelivered: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        errorCount: 0,
        lastReset: new Date()
      },
      search: {
        totalQueries: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorCount: 0,
        lastReset: new Date()
      },
      system: {
        memoryUsage: [],
        cpuUsage: [],
        lastMemoryCheck: new Date(),
        lastCpuCheck: new Date()
      }
    };

    this.performanceThresholds = {
      nlu: {
        maxResponseTime: parseInt(process.env.NLU_MAX_RESPONSE_TIME) || 3000,
        maxErrorRate: parseFloat(process.env.NLU_MAX_ERROR_RATE) || 0.05 // 5%
      },
      alerts: {
        maxProcessingTime: parseInt(process.env.ALERT_MAX_PROCESSING_TIME) || 5000,
        maxErrorRate: parseFloat(process.env.ALERT_MAX_ERROR_RATE) || 0.02 // 2%
      },
      search: {
        maxResponseTime: parseInt(process.env.SEARCH_MAX_RESPONSE_TIME) || 2000,
        maxErrorRate: parseFloat(process.env.SEARCH_MAX_ERROR_RATE) || 0.03 // 3%
      }
    };

    this.alertCallbacks = [];
    this.startSystemMonitoring();
  }

  // NLU Performance Monitoring
  startNLUTimer() {
    return {
      startTime: Date.now(),
      end: (success = true, fromCache = false, error = null) => {
        const responseTime = Date.now() - Date.now();
        this.recordNLUMetrics(responseTime, success, fromCache, error);
        return responseTime;
      }
    };
  }

  recordNLUMetrics(responseTime, success = true, fromCache = false, error = null) {
    const metrics = this.metrics.nlu;
    
    metrics.totalRequests++;
    
    if (success) {
      metrics.totalResponseTime += responseTime;
      metrics.averageResponseTime = metrics.totalResponseTime / (metrics.totalRequests - metrics.errorCount);
      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
      
      if (fromCache) {
        metrics.cacheHitCount++;
      } else {
        metrics.cacheMissCount++;
      }
    } else {
      metrics.errorCount++;
      
      if (error && error.message && error.message.includes('timeout')) {
        metrics.timeouts++;
      }
    }

    // Check for performance issues
    this.checkNLUPerformance(responseTime, success);
    
    // Cache metrics for API access
    cacheService.setMetrics('nlu', metrics);
    
    console.log(`📊 NLU Metrics - Response: ${responseTime}ms, Success: ${success}, Cache: ${fromCache}`);
  }

  checkNLUPerformance(responseTime, success) {
    const thresholds = this.performanceThresholds.nlu;
    const metrics = this.metrics.nlu;
    
    // Check response time threshold
    if (responseTime > thresholds.maxResponseTime) {
      this.triggerAlert('nlu_slow_response', {
        responseTime,
        threshold: thresholds.maxResponseTime,
        message: `NLU response time ${responseTime}ms exceeds threshold ${thresholds.maxResponseTime}ms`
      });
    }

    // Check error rate threshold
    if (metrics.totalRequests > 10) { // Only check after some requests
      const errorRate = metrics.errorCount / metrics.totalRequests;
      if (errorRate > thresholds.maxErrorRate) {
        this.triggerAlert('nlu_high_error_rate', {
          errorRate: (errorRate * 100).toFixed(2),
          threshold: (thresholds.maxErrorRate * 100).toFixed(2),
          message: `NLU error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.maxErrorRate * 100).toFixed(2)}%`
        });
      }
    }
  }

  // Alert Processing Performance Monitoring
  startAlertTimer() {
    return {
      startTime: Date.now(),
      end: (success = true, alertsGenerated = 0, error = null) => {
        const processingTime = Date.now() - Date.now();
        this.recordAlertMetrics(processingTime, success, alertsGenerated, error);
        return processingTime;
      }
    };
  }

  recordAlertMetrics(processingTime, success = true, alertsGenerated = 0, error = null) {
    const metrics = this.metrics.alerts;
    
    if (success) {
      metrics.totalGenerated += alertsGenerated;
      metrics.totalProcessingTime += processingTime;
      
      // Calculate average only for successful operations
      const successfulOperations = metrics.totalGenerated > 0 ? 
        Math.ceil(metrics.totalGenerated / (alertsGenerated || 1)) : 1;
      metrics.averageProcessingTime = metrics.totalProcessingTime / successfulOperations;
    } else {
      metrics.errorCount++;
    }

    // Check for performance issues
    this.checkAlertPerformance(processingTime, success);
    
    // Cache metrics
    cacheService.setMetrics('alerts', metrics);
    
    console.log(`📊 Alert Metrics - Processing: ${processingTime}ms, Generated: ${alertsGenerated}, Success: ${success}`);
  }

  checkAlertPerformance(processingTime, success) {
    const thresholds = this.performanceThresholds.alerts;
    const metrics = this.metrics.alerts;
    
    // Check processing time threshold
    if (processingTime > thresholds.maxProcessingTime) {
      this.triggerAlert('alert_slow_processing', {
        processingTime,
        threshold: thresholds.maxProcessingTime,
        message: `Alert processing time ${processingTime}ms exceeds threshold ${thresholds.maxProcessingTime}ms`
      });
    }

    // Check error rate threshold
    const totalOperations = metrics.totalGenerated + metrics.errorCount;
    if (totalOperations > 5) { // Only check after some operations
      const errorRate = metrics.errorCount / totalOperations;
      if (errorRate > thresholds.maxErrorRate) {
        this.triggerAlert('alert_high_error_rate', {
          errorRate: (errorRate * 100).toFixed(2),
          threshold: (thresholds.maxErrorRate * 100).toFixed(2),
          message: `Alert error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.maxErrorRate * 100).toFixed(2)}%`
        });
      }
    }
  }

  // Search Performance Monitoring
  startSearchTimer() {
    return {
      startTime: Date.now(),
      end: (success = true, resultCount = 0, error = null) => {
        const responseTime = Date.now() - Date.now();
        this.recordSearchMetrics(responseTime, success, resultCount, error);
        return responseTime;
      }
    };
  }

  recordSearchMetrics(responseTime, success = true, resultCount = 0, error = null) {
    const metrics = this.metrics.search;
    
    metrics.totalQueries++;
    
    if (success) {
      metrics.totalResponseTime += responseTime;
      metrics.averageResponseTime = metrics.totalResponseTime / (metrics.totalQueries - metrics.errorCount);
      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    } else {
      metrics.errorCount++;
    }

    // Check for performance issues
    this.checkSearchPerformance(responseTime, success);
    
    // Cache metrics
    cacheService.setMetrics('search', metrics);
    
    console.log(`📊 Search Metrics - Response: ${responseTime}ms, Results: ${resultCount}, Success: ${success}`);
  }

  checkSearchPerformance(responseTime, success) {
    const thresholds = this.performanceThresholds.search;
    const metrics = this.metrics.search;
    
    // Check response time threshold
    if (responseTime > thresholds.maxResponseTime) {
      this.triggerAlert('search_slow_response', {
        responseTime,
        threshold: thresholds.maxResponseTime,
        message: `Search response time ${responseTime}ms exceeds threshold ${thresholds.maxResponseTime}ms`
      });
    }

    // Check error rate threshold
    if (metrics.totalQueries > 10) {
      const errorRate = metrics.errorCount / metrics.totalQueries;
      if (errorRate > thresholds.maxErrorRate) {
        this.triggerAlert('search_high_error_rate', {
          errorRate: (errorRate * 100).toFixed(2),
          threshold: (thresholds.maxErrorRate * 100).toFixed(2),
          message: `Search error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.maxErrorRate * 100).toFixed(2)}%`
        });
      }
    }
  }

  // System Performance Monitoring
  startSystemMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);

    // Monitor CPU usage every minute (simplified)
    setInterval(() => {
      this.recordCPUUsage();
    }, 60000);
  }

  recordMemoryUsage() {
    const memUsage = process.memoryUsage();
    const metrics = this.metrics.system;
    
    metrics.memoryUsage.push({
      timestamp: new Date(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });

    // Keep only last 100 measurements (50 minutes of data)
    if (metrics.memoryUsage.length > 100) {
      metrics.memoryUsage = metrics.memoryUsage.slice(-100);
    }

    metrics.lastMemoryCheck = new Date();

    // Check for memory leaks (simplified)
    if (metrics.memoryUsage.length > 10) {
      const recent = metrics.memoryUsage.slice(-10);
      const avgRecent = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
      const older = metrics.memoryUsage.slice(-20, -10);
      
      if (older.length > 0) {
        const avgOlder = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;
        const growthRate = (avgRecent - avgOlder) / avgOlder;
        
        if (growthRate > 0.2) { // 20% growth
          this.triggerAlert('memory_growth', {
            growthRate: (growthRate * 100).toFixed(2),
            currentUsage: (avgRecent / 1024 / 1024).toFixed(2),
            message: `Memory usage growing rapidly: ${(growthRate * 100).toFixed(2)}% increase`
          });
        }
      }
    }
  }

  recordCPUUsage() {
    // Simplified CPU monitoring using process.cpuUsage()
    const cpuUsage = process.cpuUsage();
    const metrics = this.metrics.system;
    
    metrics.cpuUsage.push({
      timestamp: new Date(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });

    // Keep only last 60 measurements (1 hour of data)
    if (metrics.cpuUsage.length > 60) {
      metrics.cpuUsage = metrics.cpuUsage.slice(-60);
    }

    metrics.lastCpuCheck = new Date();
  }

  // Performance Reporting
  getPerformanceReport() {
    const cacheStats = cacheService.getCacheStats();
    
    return {
      timestamp: new Date().toISOString(),
      nlu: {
        ...this.metrics.nlu,
        cacheHitRate: this.metrics.nlu.cacheHitCount > 0 ? 
          (this.metrics.nlu.cacheHitCount / (this.metrics.nlu.cacheHitCount + this.metrics.nlu.cacheMissCount) * 100).toFixed(2) : 0,
        errorRate: this.metrics.nlu.totalRequests > 0 ? 
          (this.metrics.nlu.errorCount / this.metrics.nlu.totalRequests * 100).toFixed(2) : 0
      },
      alerts: {
        ...this.metrics.alerts,
        errorRate: (this.metrics.alerts.totalGenerated + this.metrics.alerts.errorCount) > 0 ? 
          (this.metrics.alerts.errorCount / (this.metrics.alerts.totalGenerated + this.metrics.alerts.errorCount) * 100).toFixed(2) : 0
      },
      search: {
        ...this.metrics.search,
        errorRate: this.metrics.search.totalQueries > 0 ? 
          (this.metrics.search.errorCount / this.metrics.search.totalQueries * 100).toFixed(2) : 0
      },
      system: {
        currentMemory: process.memoryUsage(),
        memoryHistory: this.metrics.system.memoryUsage.slice(-10), // Last 10 measurements
        cpuHistory: this.metrics.system.cpuUsage.slice(-10) // Last 10 measurements
      },
      cache: cacheStats,
      thresholds: this.performanceThresholds
    };
  }

  // Performance Alerts
  triggerAlert(alertType, details) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getAlertSeverity(alertType)
    };

    console.warn(`🚨 Performance Alert [${alert.severity}]: ${alertType}`, details);

    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in performance alert callback:', error);
      }
    });

    // Store alert in cache for API access
    const existingAlerts = cacheService.getMetrics('performance_alerts') || [];
    existingAlerts.push(alert);
    
    // Keep only last 50 alerts
    if (existingAlerts.length > 50) {
      existingAlerts.splice(0, existingAlerts.length - 50);
    }
    
    cacheService.setMetrics('performance_alerts', existingAlerts);
  }

  getAlertSeverity(alertType) {
    const severityMap = {
      'nlu_slow_response': 'medium',
      'nlu_high_error_rate': 'high',
      'alert_slow_processing': 'medium',
      'alert_high_error_rate': 'high',
      'search_slow_response': 'low',
      'search_high_error_rate': 'medium',
      'memory_growth': 'high'
    };

    return severityMap[alertType] || 'medium';
  }

  // Alert Management
  onPerformanceAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  getRecentAlerts(limit = 10) {
    const alerts = cacheService.getMetrics('performance_alerts') || [];
    return alerts.slice(-limit);
  }

  // Reset Metrics
  resetMetrics(type = 'all') {
    const resetTime = new Date();
    
    if (type === 'all' || type === 'nlu') {
      this.metrics.nlu = {
        totalRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorCount: 0,
        cacheHitCount: 0,
        cacheMissCount: 0,
        timeouts: 0,
        lastReset: resetTime
      };
    }

    if (type === 'all' || type === 'alerts') {
      this.metrics.alerts = {
        totalGenerated: 0,
        totalDelivered: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        errorCount: 0,
        lastReset: resetTime
      };
    }

    if (type === 'all' || type === 'search') {
      this.metrics.search = {
        totalQueries: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorCount: 0,
        lastReset: resetTime
      };
    }

    console.log(`📊 Reset ${type} metrics at ${resetTime.toISOString()}`);
  }

  // Health Check
  healthCheck() {
    const report = this.getPerformanceReport();
    const recentAlerts = this.getRecentAlerts(5);
    
    // Determine overall health status
    let status = 'healthy';
    let issues = [];

    // Check NLU health
    if (report.nlu.errorRate > this.performanceThresholds.nlu.maxErrorRate * 100) {
      status = 'degraded';
      issues.push(`NLU error rate too high: ${report.nlu.errorRate}%`);
    }

    if (report.nlu.averageResponseTime > this.performanceThresholds.nlu.maxResponseTime) {
      status = 'degraded';
      issues.push(`NLU response time too slow: ${report.nlu.averageResponseTime}ms`);
    }

    // Check for recent critical alerts
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'high');
    if (criticalAlerts.length > 0) {
      status = 'unhealthy';
      issues.push(`${criticalAlerts.length} critical performance alerts in last period`);
    }

    return {
      status,
      issues,
      summary: {
        nluRequests: report.nlu.totalRequests,
        alertsGenerated: report.alerts.totalGenerated,
        searchQueries: report.search.totalQueries,
        cacheHitRate: report.cache.nlu.hitRate,
        recentAlerts: recentAlerts.length
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new PerformanceMonitorService();