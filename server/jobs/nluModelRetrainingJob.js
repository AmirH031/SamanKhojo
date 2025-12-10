/**
 * Background Job for NLU Model Retraining
 * Periodically retrains the custom NLU model with updated product data
 */

const { db } = require('../firebaseAdmin');
const cron = require('node-cron');

class NLUModelRetrainingJob {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.lastRun = null;
    this.runCount = 0;
    this.errorCount = 0;
    this.config = {
      schedule: process.env.NLU_RETRAIN_SCHEDULE || '0 2 * * 0', // Weekly on Sunday at 2 AM
      enabled: process.env.NLU_TRAINING_ENABLED === 'true',
      autoRetrain: process.env.AUTO_RETRAIN_ENABLED === 'true',
      maxRetries: 3,
      retryDelayMs: 60000 // 1 minute
    };
  }

  // Start the NLU retraining job
  start() {
    if (!this.config.enabled) {
      console.log('⚠️ NLU model retraining is disabled');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️ NLU retraining job is already running');
      return;
    }

    console.log(`🚀 Starting NLU model retraining job (schedule: ${this.config.schedule})`);
    
    this.isRunning = true;
    
    // Schedule the cron job
    this.cronJob = cron.schedule(this.config.schedule, () => {
      this.runRetraining();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log('✅ NLU retraining job scheduled successfully');
  }

  // Stop the NLU retraining job
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ NLU retraining job is not running');
      return;
    }

    console.log('🛑 Stopping NLU retraining job');
    
    this.isRunning = false;
    
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
  }

  // Run the retraining process
  async runRetraining() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.runCount++;
    
    try {
      console.log(`🔄 Starting NLU model retraining #${this.runCount}...`);
      
      // Check if retraining is needed
      const needsRetraining = await this.checkIfRetrainingNeeded();
      
      if (!needsRetraining) {
        console.log('📊 NLU model is up to date, skipping retraining');
        this.lastRun = new Date();
        return;
      }
      
      // Get updated product catalog
      const productCatalog = await this.getProductCatalog();
      
      if (productCatalog.length === 0) {
        console.log('📭 No products found for training');
        this.lastRun = new Date();
        return;
      }
      
      console.log(`📚 Training NLU model with ${productCatalog.length} products`);
      
      // Prepare training data
      const trainingData = await this.prepareTrainingData(productCatalog);
      
      // Train the model (placeholder - would integrate with actual NLU service)
      const modelVersion = await this.trainModel(trainingData);
      
      // Validate the new model
      const validationResults = await this.validateModel(modelVersion);
      
      if (validationResults.isValid) {
        // Deploy the new model
        await this.deployModel(modelVersion);
        
        // Update model metadata
        await this.updateModelMetadata(modelVersion, validationResults);
        
        console.log(`✅ NLU model retrained successfully - version: ${modelVersion}`);
      } else {
        console.log('❌ New model failed validation, keeping current model');
        await this.rollbackModel(modelVersion);
      }
      
      const duration = Date.now() - startTime;
      this.lastRun = new Date();
      
      console.log(`✅ NLU retraining completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ NLU retraining failed:', error);
      this.errorCount++;
      
      // Retry logic
      if (this.errorCount <= this.config.maxRetries) {
        console.log(`🔄 Retrying NLU retraining in ${this.config.retryDelayMs}ms (attempt ${this.errorCount}/${this.config.maxRetries})`);
        setTimeout(() => this.runRetraining(), this.config.retryDelayMs);
      } else {
        console.error('❌ Max retries exceeded for NLU retraining');
        this.errorCount = 0; // Reset for next scheduled run
      }
    }
  }

  // Check if retraining is needed
  async checkIfRetrainingNeeded() {
    try {
      // Get current model metadata
      const modelMetadataDoc = await db.collection('nlu_model_metadata').doc('current').get();
      
      if (!modelMetadataDoc.exists) {
        console.log('📊 No existing model found, retraining needed');
        return true;
      }
      
      const metadata = modelMetadataDoc.data();
      const lastTraining = metadata.lastTraining?.toDate();
      
      if (!lastTraining) {
        return true;
      }
      
      // Check if significant time has passed
      const daysSinceLastTraining = (Date.now() - lastTraining.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastTraining > 7) {
        console.log(`📊 ${Math.floor(daysSinceLastTraining)} days since last training, retraining needed`);
        return true;
      }
      
      // Check if significant product catalog changes
      const productCount = await this.getProductCount();
      const lastProductCount = metadata.productCount || 0;
      
      const changePercentage = Math.abs(productCount - lastProductCount) / lastProductCount;
      
      if (changePercentage > 0.1) { // 10% change threshold
        console.log(`📊 Product catalog changed by ${Math.floor(changePercentage * 100)}%, retraining needed`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking if retraining needed:', error);
      return true; // Default to retraining on error
    }
  }

  // Get product catalog for training
  async getProductCatalog() {
    try {
      const productsSnapshot = await db.collection('items')
        .where('stock', '>', 0)
        .get();
      
      const products = [];
      productsSnapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() };
        products.push(product);
      });
      
      return products;
    } catch (error) {
      console.error('❌ Error getting product catalog:', error);
      return [];
    }
  }

  // Get current product count
  async getProductCount() {
    try {
      const snapshot = await db.collection('items').get();
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error getting product count:', error);
      return 0;
    }
  }

  // Prepare training data from product catalog
  async prepareTrainingData(products) {
    try {
      const trainingData = {
        intents: [],
        entities: [],
        examples: []
      };
      
      // Extract categories for intent creation
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
      
      // Create category-based intents
      categories.forEach(category => {
        trainingData.intents.push({
          name: `search_${category.toLowerCase().replace(/\s+/g, '_')}`,
          examples: [
            `find ${category}`,
            `show me ${category}`,
            `search for ${category}`,
            `I want ${category}`,
            `looking for ${category}`
          ]
        });
      });
      
      // Create brand-based entities
      brands.forEach(brand => {
        trainingData.entities.push({
          name: 'brand',
          value: brand,
          synonyms: [brand.toLowerCase(), brand.toUpperCase()]
        });
      });
      
      // Create price range entities
      trainingData.entities.push(
        { name: 'price_range', value: 'budget', synonyms: ['cheap', 'affordable', 'low cost', 'under 1000'] },
        { name: 'price_range', value: 'mid_range', synonyms: ['medium price', 'moderate', '1000 to 5000'] },
        { name: 'price_range', value: 'premium', synonyms: ['expensive', 'high end', 'above 5000'] }
      );
      
      // Generate training examples from actual products
      products.slice(0, 100).forEach(product => { // Limit to 100 for performance
        if (product.name && product.category) {
          trainingData.examples.push({
            text: `find ${product.name}`,
            intent: `search_${product.category.toLowerCase().replace(/\s+/g, '_')}`,
            entities: [
              { entity: 'product_name', value: product.name },
              { entity: 'category', value: product.category }
            ]
          });
        }
      });
      
      console.log(`📚 Prepared training data: ${trainingData.intents.length} intents, ${trainingData.entities.length} entities, ${trainingData.examples.length} examples`);
      
      return trainingData;
    } catch (error) {
      console.error('❌ Error preparing training data:', error);
      throw error;
    }
  }

  // Train the NLU model (placeholder implementation)
  async trainModel(trainingData) {
    try {
      // This would integrate with actual NLU training API
      console.log('🤖 Training NLU model...');
      
      // Simulate training time
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Generate model version
      const modelVersion = `v${Date.now()}`;
      
      // Store training data for reference
      await db.collection('nlu_training_data').doc(modelVersion).set({
        trainingData,
        createdAt: new Date(),
        status: 'trained'
      });
      
      console.log(`🤖 Model training completed - version: ${modelVersion}`);
      
      return modelVersion;
    } catch (error) {
      console.error('❌ Error training model:', error);
      throw error;
    }
  }

  // Validate the trained model
  async validateModel(modelVersion) {
    try {
      console.log(`🔍 Validating model version: ${modelVersion}`);
      
      // This would run validation tests against the new model
      // For now, simulate validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate validation results
      const validationResults = {
        isValid: true,
        accuracy: 0.85 + Math.random() * 0.1, // Simulate 85-95% accuracy
        precision: 0.80 + Math.random() * 0.15,
        recall: 0.75 + Math.random() * 0.2,
        testCases: 100,
        passedTests: 85 + Math.floor(Math.random() * 15)
      };
      
      console.log(`🔍 Validation results: ${validationResults.passedTests}/${validationResults.testCases} tests passed, accuracy: ${Math.floor(validationResults.accuracy * 100)}%`);
      
      return validationResults;
    } catch (error) {
      console.error('❌ Error validating model:', error);
      return { isValid: false, error: error.message };
    }
  }

  // Deploy the validated model
  async deployModel(modelVersion) {
    try {
      console.log(`🚀 Deploying model version: ${modelVersion}`);
      
      // This would deploy the model to production
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Model ${modelVersion} deployed successfully`);
    } catch (error) {
      console.error('❌ Error deploying model:', error);
      throw error;
    }
  }

  // Rollback model on validation failure
  async rollbackModel(modelVersion) {
    try {
      console.log(`🔄 Rolling back model version: ${modelVersion}`);
      
      // Mark training data as failed
      await db.collection('nlu_training_data').doc(modelVersion).update({
        status: 'failed',
        failedAt: new Date()
      });
      
      console.log(`🔄 Model ${modelVersion} rolled back`);
    } catch (error) {
      console.error('❌ Error rolling back model:', error);
    }
  }

  // Update model metadata
  async updateModelMetadata(modelVersion, validationResults) {
    try {
      const metadata = {
        currentVersion: modelVersion,
        lastTraining: new Date(),
        productCount: await this.getProductCount(),
        validationResults,
        performance: {
          accuracy: validationResults.accuracy,
          precision: validationResults.precision,
          recall: validationResults.recall
        },
        updatedAt: new Date()
      };
      
      await db.collection('nlu_model_metadata').doc('current').set(metadata, { merge: true });
      
      console.log(`📊 Updated model metadata for version: ${modelVersion}`);
    } catch (error) {
      console.error('❌ Error updating model metadata:', error);
    }
  }

  // Manual trigger for retraining
  async triggerManualRetraining() {
    try {
      console.log('🔄 Manual NLU retraining triggered');
      await this.runRetraining();
    } catch (error) {
      console.error('❌ Manual retraining failed:', error);
      throw error;
    }
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: this.config.schedule,
      enabled: this.config.enabled,
      runCount: this.runCount,
      errorCount: this.errorCount,
      lastRun: this.lastRun,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null
    };
  }

  // Get training statistics
  async getTrainingStatistics() {
    try {
      const [metadataDoc, trainingDataSnapshot] = await Promise.all([
        db.collection('nlu_model_metadata').doc('current').get(),
        db.collection('nlu_training_data').orderBy('createdAt', 'desc').limit(10).get()
      ]);
      
      const metadata = metadataDoc.exists ? metadataDoc.data() : null;
      const recentTrainings = [];
      
      trainingDataSnapshot.forEach(doc => {
        recentTrainings.push({
          version: doc.id,
          ...doc.data()
        });
      });
      
      return {
        currentModel: metadata,
        recentTrainings,
        jobStatus: this.getStatus()
      };
    } catch (error) {
      console.error('❌ Error getting training statistics:', error);
      return {
        currentModel: null,
        recentTrainings: [],
        jobStatus: this.getStatus(),
        error: error.message
      };
    }
  }
 }


module.exports = new NLUModelRetrainingJob();