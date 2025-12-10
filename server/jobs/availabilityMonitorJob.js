/**
 * Background Job for Availability Monitoring
 * Periodically checks product availability and processes alerts
 */

const { db } = require('../firebaseAdmin');
const personalizedShoppingService = require('../services/personalizedShoppingService');

class AvailabilityMonitorJob {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastRun = null;
    this.runCount = 0;
    this.errorCount = 0;
    this.config = {
      intervalMs: parseInt(process.env.AVAILABILITY_MONITOR_INTERVAL) || 300000, // 5 minutes default
      batchSize: parseInt(process.env.AVAILABILITY_BATCH_SIZE) || 100,
      maxRetries: 3,
      retryDelayMs: 5000
    };
  }

  // Start the availability monitoring job
  start() {
    if (this.isRunning) {
      console.log('⚠️ Availability monitor job is already running');
      return;
    }

    console.log(`🚀 Starting availability monitor job (interval: ${this.config.intervalMs}ms)`);
    
    this.isRunning = true;
    
    // Run immediately on start
    this.runJob();
    
    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runJob();
    }, this.config.intervalMs);
  }

  // Stop the availability monitoring job
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Availability monitor job is not running');
      return;
    }

    console.log('🛑 Stopping availability monitor job');
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Run the monitoring job
  async runJob() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.runCount++;
    
    try {
      console.log(`🔄 Running availability monitor job #${this.runCount}...`);
      
      // Get all products that need monitoring
      const productsToMonitor = await this.getProductsToMonitor();
      
      if (productsToMonitor.length === 0) {
        console.log('📭 No products to monitor');
        this.lastRun = new Date();
        return;
      }
      
      console.log(`📊 Monitoring ${productsToMonitor.length} products for availability changes`);
      
      // Process products in batches
      const batches = this.createBatches(productsToMonitor, this.config.batchSize);
      let totalChanges = 0;
      let totalAlerts = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} products)`);
        
        try {
          const batchResults = await this.processBatch(batch);
          totalChanges += batchResults.changes;
          totalAlerts += batchResults.alerts;
          
          // Small delay between batches to prevent overwhelming the system
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (batchError) {
          console.error(`❌ Error processing batch ${i + 1}:`, batchError);
          this.errorCount++;
          // Continue with next batch
        }
      }
      
      // Cleanup old alerts and interests
      await this.performCleanup();
      
      const duration = Date.now() - startTime;
      this.lastRun = new Date();
      
      console.log(`✅ Availability monitor job completed in ${duration}ms`);
      console.log(`📊 Results: ${totalChanges} changes detected, ${totalAlerts} alerts generated`);
      
    } catch (error) {
      console.error('❌ Availability monitor job failed:', error);
      this.errorCount++;
      
      // If too many errors, increase interval temporarily
      if (this.errorCount > 5) {
        console.log('⚠️ Too many errors, temporarily increasing monitoring interval');
        this.adjustInterval(this.config.intervalMs * 2);
      }
    }
  }

  // Get products that need monitoring
  async getProductsToMonitor() {
    try {
      // Get products that users are interested in
      const interestsSnapshot = await db.collection('product_interests')
        .where('active', '==', true)
        .get();
      
      const productIds = new Set();
      
      // Collect product IDs from user interests
      interestsSnapshot.forEach(doc => {
        const interest = doc.data();
        if (interest.unavailableProducts) {
          interest.unavailableProducts.forEach(product => {
            productIds.add(product.itemId);
          });
        }
      });
      
      // Also monitor recently added products (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentProductsSnapshot = await db.collection('items')
        .where('createdAt', '>', yesterday)
        .get();
      
      recentProductsSnapshot.forEach(doc => {
        productIds.add(doc.id);
      });
      
      // Convert Set to Array
      return Array.from(productIds);
    } catch (error) {
      console.error('❌ Error getting products to monitor:', error);
      return [];
    }
  }

  // Create batches from product list
  createBatches(products, batchSize) {
    const batches = [];
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }
    return batches;
  }

  // Process a batch of products
  async processBatch(productIds) {
    try {
      // Monitor availability changes
      const availabilityChanges = await personalizedShoppingService.monitorProductAvailability(productIds);
      
      let alertsGenerated = [];
      
      if (availabilityChanges.length > 0) {
        console.log(`📈 Found ${availabilityChanges.length} availability changes in batch`);
        
        // Process alerts for availability changes
        alertsGenerated = await personalizedShoppingService.processAvailabilityAlerts(availabilityChanges);
      }
      
      return {
        changes: availabilityChanges.length,
        alerts: alertsGenerated.length
      };
    } catch (error) {
      console.error('❌ Error processing batch:', error);
      throw error;
    }
  }

  // Perform cleanup of old data with enhanced error handling
  async performCleanup() {
    try {
      // Run cleanup every 10th job run to avoid overhead
      if (this.runCount % 10 === 0) {
        console.log('🧹 Performing cleanup of old alerts and interests...');
        
        const retentionDays = parseInt(process.env.CLEANUP_OLD_ALERTS_DAYS) || 30;
        const cleanupResults = await personalizedShoppingService.cleanupOldAlerts(retentionDays);
        
        console.log(`🧹 Cleanup results: ${cleanupResults.alertsDeleted} alerts, ${cleanupResults.interestsDeleted} interests deleted`);
        
        // Also cleanup old availability states
        await this.cleanupOldAvailabilityStates();
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      // Don't throw - cleanup failure shouldn't stop the job
      
      // Log cleanup failure for monitoring
      try {
        await db.collection('system_logs').add({
          type: 'cleanup_failure',
          error: error.message,
          timestamp: new Date(),
          jobRun: this.runCount
        });
      } catch (logError) {
        console.error('❌ Failed to log cleanup error:', logError);
      }
    }
  }

  // Cleanup old availability states
  async cleanupOldAvailabilityStates() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days of history
      
      const oldStatesSnapshot = await db.collection('product_availability_states')
        .where('lastUpdated', '<', cutoffDate)
        .get();
      
      if (oldStatesSnapshot.size > 0) {
        const batch = db.batch();
        oldStatesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`🧹 Cleaned up ${oldStatesSnapshot.size} old availability states`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up availability states:', error);
    }
  }

  // Adjust monitoring interval
  adjustInterval(newIntervalMs) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.config.intervalMs = newIntervalMs;
      
      this.intervalId = setInterval(() => {
        this.runJob();
      }, this.config.intervalMs);
      
      console.log(`⚙️ Adjusted monitoring interval to ${newIntervalMs}ms`);
    }
  }

  // Reset error count (can be called externally)
  resetErrorCount() {
    this.errorCount = 0;
    console.log('🔄 Reset error count for availability monitor');
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.config.intervalMs,
      runCount: this.runCount,
      errorCount: this.errorCount,
      lastRun: this.lastRun,
      nextRun: this.isRunning && this.lastRun ? 
        new Date(this.lastRun.getTime() + this.config.intervalMs) : null
    };
  }

  // Get comprehensive job statistics
  async getStatistics() {
    try {
      // Get counts from database with additional metrics
      const [alertsSnapshot, interestsSnapshot, statesSnapshot, recentAlertsSnapshot] = await Promise.all([
        db.collection('product_alerts').where('delivered', '==', false).get(),
        db.collection('product_interests').where('active', '==', true).get(),
        db.collection('product_availability_states').get(),
        db.collection('product_alerts')
          .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
          .get()
      ]);
      
      // Calculate success rate
      const successRate = this.runCount > 0 ? ((this.runCount - this.errorCount) / this.runCount) * 100 : 100;
      
      return {
        pendingAlerts: alertsSnapshot.size,
        activeInterests: interestsSnapshot.size,
        monitoredProducts: statesSnapshot.size,
        alertsLast24h: recentAlertsSnapshot.size,
        jobStatus: this.getStatus(),
        performance: {
          successRate: Math.round(successRate * 100) / 100,
          totalRuns: this.runCount,
          totalErrors: this.errorCount,
          avgInterval: this.config.intervalMs
        },
        health: this.getHealthStatus()
      };
    } catch (error) {
      console.error('❌ Error getting job statistics:', error);
      return {
        pendingAlerts: 0,
        activeInterests: 0,
        monitoredProducts: 0,
        alertsLast24h: 0,
        jobStatus: this.getStatus(),
        performance: {
          successRate: 0,
          totalRuns: this.runCount,
          totalErrors: this.errorCount,
          avgInterval: this.config.intervalMs
        },
        error: error.message
      };
    }
  }

  // Get health status of the job
  getHealthStatus() {
    const successRate = this.runCount > 0 ? ((this.runCount - this.errorCount) / this.runCount) * 100 : 100;
    
    let status = 'healthy';
    if (!this.isRunning) {
      status = 'stopped';
    } else if (this.errorCount > 5) {
      status = 'unhealthy';
    } else if (successRate < 80) {
      status = 'degraded';
    }
    
    return {
      status,
      isRunning: this.isRunning,
      successRate: Math.round(successRate * 100) / 100,
      lastRun: this.lastRun,
      errorCount: this.errorCount,
      uptime: this.isRunning && this.lastRun ? Date.now() - this.lastRun.getTime() : 0
    };
  }
}

module.exports = new AvailabilityMonitorJob();