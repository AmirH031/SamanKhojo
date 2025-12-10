/**
 * Enhanced Error Handling and Logging Service
 * Provides comprehensive error handling and logging for all enhanced services
 */

const fs = require('fs').promises;
const path = require('path');
const cacheService = require('./cacheService');

class ErrorHandlingService {
  constructor() {
    this.logDirectory = path.join(__dirname, '../logs');
    this.errorCounts = new Map();
    this.errorPatterns = new Map();
    this.circuitBreakers = new Map();
    
    this.initializeLogging();
    this.setupCircuitBreakers();
  }

  async initializeLogging() {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
      console.log(`📁 Log directory initialized: ${this.logDirectory}`);
    } catch (error) {
      console.error('Failed to initialize log directory:', error);
    }
  }

  setupCircuitBreakers() {
    // Circuit breaker configurations for different services
    this.circuitBreakers.set('nlu', {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      state: 'closed', // closed, open, half-open
      failures: 0,
      lastFailure: null,
      nextAttempt: null
    });

    this.circuitBreakers.set('alerts', {
      failureThreshold: 3,
      resetTimeout: 60000, // 1 minute
      state: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null
    });

    this.circuitBreakers.set('search', {
      failureThreshold: 10,
      resetTimeout: 15000, // 15 seconds
      state: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null
    });
  }

  // Enhanced Error Logging
  async logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      context: {
        service: context.service || 'unknown',
        operation: context.operation || 'unknown',
        userId: context.userId || null,
        requestId: context.requestId || null,
        ...context
      },
      severity: this.determineSeverity(error, context),
      category: this.categorizeError(error),
      fingerprint: this.generateErrorFingerprint(error)
    };

    // Log to console with appropriate level
    this.logToConsole(errorEntry);

    // Log to file
    await this.logToFile(errorEntry);

    // Track error patterns
    this.trackErrorPattern(errorEntry);

    // Update circuit breaker if applicable
    if (context.service) {
      this.updateCircuitBreaker(context.service, false);
    }

    // Cache recent errors for API access
    this.cacheRecentError(errorEntry);

    return errorEntry;
  }

  logToConsole(errorEntry) {
    const { severity, message, context } = errorEntry;
    const prefix = `[${severity.toUpperCase()}] ${context.service}/${context.operation}`;
    
    switch (severity) {
      case 'critical':
        console.error(`🚨 ${prefix}: ${message}`);
        break;
      case 'high':
        console.error(`❌ ${prefix}: ${message}`);
        break;
      case 'medium':
        console.warn(`⚠️ ${prefix}: ${message}`);
        break;
      case 'low':
        console.log(`ℹ️ ${prefix}: ${message}`);
        break;
      default:
        console.log(`📝 ${prefix}: ${message}`);
    }
  }

  async logToFile(errorEntry) {
    try {
      const logFileName = `errors-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDirectory, logFileName);
      
      const logLine = JSON.stringify(errorEntry) + '\n';
      await fs.appendFile(logFilePath, logLine);
    } catch (fileError) {
      console.error('Failed to write error to file:', fileError);
    }
  }

  determineSeverity(error, context) {
    // Critical errors
    if (error.name === 'DatabaseConnectionError' || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Authentication failed')) {
      return 'critical';
    }

    // High severity errors
    if (error.name === 'ValidationError' ||
        error.message.includes('timeout') ||
        context.operation === 'processNLUQuery' && error.message.includes('failed')) {
      return 'high';
    }

    // Medium severity errors
    if (error.name === 'TypeError' ||
        error.name === 'ReferenceError' ||
        error.message.includes('not found')) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  categorizeError(error) {
    if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return 'network';
    }
    
    if (error.message.includes('timeout')) {
      return 'timeout';
    }
    
    if (error.name === 'ValidationError' || error.message.includes('invalid')) {
      return 'validation';
    }
    
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'authorization';
    }
    
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'programming';
    }
    
    return 'unknown';
  }

  generateErrorFingerprint(error) {
    // Create a unique fingerprint for similar errors
    const key = `${error.name}:${error.message.substring(0, 100)}`;
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  trackErrorPattern(errorEntry) {
    const { fingerprint, category, severity } = errorEntry;
    
    // Track error counts
    const currentCount = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, currentCount + 1);
    
    // Track error patterns
    if (!this.errorPatterns.has(fingerprint)) {
      this.errorPatterns.set(fingerprint, {
        firstSeen: errorEntry.timestamp,
        lastSeen: errorEntry.timestamp,
        count: 1,
        category,
        severity,
        message: errorEntry.message,
        contexts: [errorEntry.context.service]
      });
    } else {
      const pattern = this.errorPatterns.get(fingerprint);
      pattern.lastSeen = errorEntry.timestamp;
      pattern.count++;
      
      if (!pattern.contexts.includes(errorEntry.context.service)) {
        pattern.contexts.push(errorEntry.context.service);
      }
    }

    // Alert on error spikes
    this.checkErrorSpikes(fingerprint);
  }

  checkErrorSpikes(fingerprint) {
    const pattern = this.errorPatterns.get(fingerprint);
    
    if (pattern && pattern.count > 5) {
      const firstSeen = new Date(pattern.firstSeen);
      const lastSeen = new Date(pattern.lastSeen);
      const timeSpan = lastSeen - firstSeen;
      
      // If more than 5 errors in less than 5 minutes
      if (timeSpan < 5 * 60 * 1000) {
        console.warn(`🚨 Error spike detected: ${pattern.message} (${pattern.count} times in ${Math.round(timeSpan / 1000)}s)`);
        
        // Cache alert for monitoring
        const alert = {
          type: 'error_spike',
          fingerprint,
          pattern,
          timestamp: new Date().toISOString()
        };
        
        const existingAlerts = cacheService.getMetrics('error_alerts') || [];
        existingAlerts.push(alert);
        cacheService.setMetrics('error_alerts', existingAlerts.slice(-20)); // Keep last 20
      }
    }
  }

  cacheRecentError(errorEntry) {
    const recentErrors = cacheService.getMetrics('recent_errors') || [];
    recentErrors.push(errorEntry);
    
    // Keep only last 50 errors
    if (recentErrors.length > 50) {
      recentErrors.splice(0, recentErrors.length - 50);
    }
    
    cacheService.setMetrics('recent_errors', recentErrors);
  }

  // Circuit Breaker Implementation
  updateCircuitBreaker(service, success) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return;

    if (success) {
      // Reset failures on success
      breaker.failures = 0;
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        console.log(`✅ Circuit breaker for ${service} closed (recovered)`);
      }
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= breaker.failureThreshold && breaker.state === 'closed') {
        breaker.state = 'open';
        breaker.nextAttempt = Date.now() + breaker.resetTimeout;
        console.warn(`🔴 Circuit breaker for ${service} opened (${breaker.failures} failures)`);
      }
    }
  }

  isCircuitBreakerOpen(service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      if (Date.now() >= breaker.nextAttempt) {
        breaker.state = 'half-open';
        console.log(`🟡 Circuit breaker for ${service} half-open (testing)`);
        return false;
      }
      return true;
    }

    return false;
  }

  getCircuitBreakerStatus(service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return null;

    return {
      service,
      state: breaker.state,
      failures: breaker.failures,
      threshold: breaker.failureThreshold,
      lastFailure: breaker.lastFailure ? new Date(breaker.lastFailure).toISOString() : null,
      nextAttempt: breaker.nextAttempt ? new Date(breaker.nextAttempt).toISOString() : null
    };
  }

  // Enhanced Error Handling Wrappers
  async withErrorHandling(operation, context = {}) {
    const service = context.service || 'unknown';
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(service)) {
      const error = new Error(`Service ${service} is currently unavailable (circuit breaker open)`);
      error.name = 'CircuitBreakerOpenError';
      throw error;
    }

    try {
      const result = await operation();
      this.updateCircuitBreaker(service, true);
      return result;
    } catch (error) {
      await this.logError(error, context);
      this.updateCircuitBreaker(service, false);
      throw error;
    }
  }

  withRetry(operation, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
      context = {}
    } = options;

    return async (...args) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await this.withErrorHandling(
            () => operation(...args),
            { ...context, attempt }
          );
        } catch (error) {
          lastError = error;
          
          if (attempt === maxRetries) {
            break;
          }

          // Don't retry on certain error types
          if (error.name === 'ValidationError' || 
              error.name === 'AuthenticationError' ||
              error.name === 'CircuitBreakerOpenError') {
            break;
          }

          const waitTime = delay * Math.pow(backoff, attempt - 1);
          console.log(`🔄 Retrying ${context.operation} (attempt ${attempt + 1}/${maxRetries}) in ${waitTime}ms`);
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      throw lastError;
    };
  }

  // Graceful Degradation Helpers
  async withFallback(primaryOperation, fallbackOperation, context = {}) {
    try {
      return await this.withErrorHandling(primaryOperation, context);
    } catch (error) {
      console.warn(`⚠️ Primary operation failed, using fallback: ${error.message}`);
      
      try {
        const result = await fallbackOperation();
        return {
          ...result,
          fallbackUsed: true,
          primaryError: error.message
        };
      } catch (fallbackError) {
        await this.logError(fallbackError, { 
          ...context, 
          operation: `${context.operation}_fallback`,
          primaryError: error.message 
        });
        throw fallbackError;
      }
    }
  }

  // Error Reporting and Analytics
  getErrorReport(timeRange = '24h') {
    const now = Date.now();
    const timeRangeMs = this.parseTimeRange(timeRange);
    const cutoff = now - timeRangeMs;

    const recentErrors = cacheService.getMetrics('recent_errors') || [];
    const filteredErrors = recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > cutoff
    );

    // Aggregate by category and severity
    const bySeverity = {};
    const byCategory = {};
    const byService = {};

    filteredErrors.forEach(error => {
      // By severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // By category
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      
      // By service
      const service = error.context.service;
      byService[service] = (byService[service] || 0) + 1;
    });

    // Get top error patterns
    const topPatterns = Array.from(this.errorPatterns.entries())
      .filter(([_, pattern]) => new Date(pattern.lastSeen).getTime() > cutoff)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([fingerprint, pattern]) => ({
        fingerprint,
        ...pattern
      }));

    return {
      timeRange,
      totalErrors: filteredErrors.length,
      bySeverity,
      byCategory,
      byService,
      topPatterns,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([service, breaker]) => 
        this.getCircuitBreakerStatus(service)
      ),
      timestamp: new Date().toISOString()
    };
  }

  parseTimeRange(timeRange) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };

    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }

  // Health Check
  healthCheck() {
    const errorReport = this.getErrorReport('1h');
    const criticalErrors = errorReport.bySeverity.critical || 0;
    const highErrors = errorReport.bySeverity.high || 0;
    
    const openCircuitBreakers = errorReport.circuitBreakers.filter(cb => cb.state === 'open');
    
    let status = 'healthy';
    let issues = [];

    if (criticalErrors > 0) {
      status = 'unhealthy';
      issues.push(`${criticalErrors} critical errors in last hour`);
    }

    if (highErrors > 5) {
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
      issues.push(`${highErrors} high severity errors in last hour`);
    }

    if (openCircuitBreakers.length > 0) {
      status = 'degraded';
      issues.push(`${openCircuitBreakers.length} services with open circuit breakers`);
    }

    return {
      status,
      issues,
      summary: {
        totalErrors: errorReport.totalErrors,
        criticalErrors,
        highErrors,
        openCircuitBreakers: openCircuitBreakers.length,
        topErrorCategory: Object.keys(errorReport.byCategory)[0] || 'none'
      },
      timestamp: new Date().toISOString()
    };
  }

  // Cleanup old logs
  async cleanupOldLogs(retentionDays = 30) {
    try {
      const files = await fs.readdir(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('errors-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`🗑️ Deleted old log file: ${file}`);
          }
        }
      }

      console.log(`🧹 Cleanup completed: ${deletedCount} old log files deleted`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new ErrorHandlingService();