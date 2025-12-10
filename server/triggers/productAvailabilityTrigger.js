/**
 * Firestore Trigger for Product Availability Changes
 * Monitors stock changes and triggers availability alerts
 */

const { db } = require('../firebaseAdmin');
const personalizedShoppingService = require('../services/personalizedShoppingService');

class ProductAvailabilityTrigger {
  constructor() {
    this.isProcessing = false;
    this.processingQueue = [];
  }

  // Initialize Firestore listeners for product changes
  initializeListeners() {
    try {
      console.log('🔄 Initializing Firestore listeners for product availability...');
      
      // Listen to items collection changes
      const itemsListener = db.collection('items').onSnapshot(
        (snapshot) => this.handleItemsSnapshot(snapshot),
        (error) => {
          console.error('❌ Items listener error:', error);
          // Retry listener after 30 seconds
          setTimeout(() => this.initializeListeners(), 30000);
        }
      );

      // Listen to shops collection for new shop additions
      const shopsListener = db.collection('shops').onSnapshot(
        (snapshot) => this.handleShopsSnapshot(snapshot),
        (error) => {
          console.error('❌ Shops listener error:', error);
          // Retry listener after 30 seconds
          setTimeout(() => this.initializeListeners(), 30000);
        }
      );

      console.log('✅ Firestore listeners initialized successfully');
      
      return { itemsListener, shopsListener };
    } catch (error) {
      console.error('❌ Failed to initialize Firestore listeners:', error);
      throw error;
    }
  }

  // Handle items collection snapshot changes
  async handleItemsSnapshot(snapshot) {
    try {
      if (snapshot.empty) return;

      const changes = [];
      
      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        const data = change.doc.data();
        
        switch (change.type) {
          case 'added':
            changes.push({
              type: 'new_product',
              productId: docId,
              data: data,
              timestamp: new Date()
            });
            break;
            
          case 'modified':
            changes.push({
              type: 'product_updated',
              productId: docId,
              data: data,
              timestamp: new Date()
            });
            break;
            
          case 'removed':
            changes.push({
              type: 'product_removed',
              productId: docId,
              data: data,
              timestamp: new Date()
            });
            break;
        }
      });

      if (changes.length > 0) {
        await this.processProductChanges(changes);
      }
    } catch (error) {
      console.error('❌ Error handling items snapshot:', error);
      // Continue processing other changes
    }
  }

  // Handle shops collection snapshot changes
  async handleShopsSnapshot(snapshot) {
    try {
      if (snapshot.empty) return;

      const newShops = [];
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const shopData = change.doc.data();
          newShops.push({
            shopId: change.doc.id,
            ...shopData,
            timestamp: new Date()
          });
        }
      });

      if (newShops.length > 0) {
        console.log(`🏪 Detected ${newShops.length} new shops added`);
        await this.processNewShops(newShops);
      }
    } catch (error) {
      console.error('❌ Error handling shops snapshot:', error);
    }
  }

  // Process product changes with queue management
  async processProductChanges(changes) {
    try {
      // Add changes to processing queue
      this.processingQueue.push(...changes);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }
    } catch (error) {
      console.error('❌ Error processing product changes:', error);
    }
  }

  // Process the changes queue
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      console.log(`🔄 Processing ${this.processingQueue.length} product changes...`);
      
      // Process changes in batches of 10
      const batchSize = 10;
      
      while (this.processingQueue.length > 0) {
        const batch = this.processingQueue.splice(0, batchSize);
        await this.processBatch(batch);
        
        // Small delay between batches to prevent overwhelming the system
        if (this.processingQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('✅ Finished processing product changes queue');
    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Check if more items were added while processing
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  // Process a batch of changes
  async processBatch(changes) {
    try {
      const productIds = changes.map(change => change.productId);
      
      // Monitor availability changes for these products
      const availabilityChanges = await personalizedShoppingService.monitorProductAvailability(productIds);
      
      if (availabilityChanges.length > 0) {
        console.log(`📊 Detected ${availabilityChanges.length} availability changes`);
        
        // Process alerts for availability changes
        const alerts = await personalizedShoppingService.processAvailabilityAlerts(availabilityChanges);
        
        // Log the results
        if (alerts.length > 0) {
          console.log(`🔔 Generated ${alerts.length} alerts for availability changes`);
          
          // Optionally, trigger real-time notifications here
          await this.triggerRealTimeNotifications(alerts);
        }
      }
      
      // Handle new products separately
      const newProducts = changes.filter(change => change.type === 'new_product');
      if (newProducts.length > 0) {
        await this.processNewProducts(newProducts);
      }
      
    } catch (error) {
      console.error('❌ Error processing batch:', error);
      // Continue with next batch
    }
  }

  // Process new products
  async processNewProducts(newProducts) {
    try {
      console.log(`🆕 Processing ${newProducts.length} new products...`);
      
      for (const product of newProducts) {
        // Initialize availability state for new product
        await db.collection('product_availability_states').doc(product.productId).set({
          stock: product.data.stock || 0,
          isAvailable: (product.data.stock || 0) > 0,
          price: product.data.price || 0,
          lastUpdated: new Date(),
          shopId: product.data.shopId,
          isNewProduct: true
        });
        
        // Check if any users might be interested in this new product
        await this.checkNewProductInterest(product);
      }
    } catch (error) {
      console.error('❌ Error processing new products:', error);
    }
  }

  // Check if users might be interested in new product
  async checkNewProductInterest(product) {
    try {
      const productData = product.data;
      
      // Find users who searched for similar products
      const interestsSnapshot = await db.collection('product_interests')
        .where('active', '==', true)
        .get();
      
      const potentialAlerts = [];
      
      for (const interestDoc of interestsSnapshot.docs) {
        const interest = interestDoc.data();
        
        // Check if this new product matches user's search criteria
        const isMatch = this.checkProductMatchesInterest(productData, interest);
        
        if (isMatch) {
          const alert = await personalizedShoppingService.createProductAlert(
            interest.userId,
            {
              productId: product.productId,
              changeType: 'new_product_match',
              timestamp: new Date(),
              shopId: productData.shopId
            },
            interest.searchQuery
          );
          
          potentialAlerts.push(alert);
          
          // Mark interest as notified for this specific match
          await interestDoc.ref.update({
            [`matchedProducts.${product.productId}`]: {
              matchedAt: new Date(),
              alertId: alert.id
            }
          });
        }
      }
      
      if (potentialAlerts.length > 0) {
        console.log(`🎯 Found ${potentialAlerts.length} users interested in new product: ${productData.name}`);
      }
    } catch (error) {
      console.error('❌ Error checking new product interest:', error);
    }
  }

  // Check if product matches user interest
  checkProductMatchesInterest(productData, interest) {
    try {
      const searchQuery = interest.searchQuery.toLowerCase();
      const productName = (productData.name || '').toLowerCase();
      const productCategory = (productData.category || '').toLowerCase();
      const productDescription = (productData.description || '').toLowerCase();
      
      // Simple keyword matching - can be enhanced with NLU later
      const searchTerms = searchQuery.split(' ').filter(term => term.length > 2);
      
      for (const term of searchTerms) {
        if (productName.includes(term) || 
            productCategory.includes(term) || 
            productDescription.includes(term)) {
          return true;
        }
      }
      
      // Check category match with unavailable products user was interested in
      if (interest.unavailableProducts) {
        for (const unavailableProduct of interest.unavailableProducts) {
          if (unavailableProduct.category === productData.category) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking product match:', error);
      return false;
    }
  }

  // Process new shops
  async processNewShops(newShops) {
    try {
      console.log(`🏪 Processing ${newShops.length} new shops...`);
      
      for (const shop of newShops) {
        // Get all items from this new shop
        const shopItemsSnapshot = await db.collection('items')
          .where('shopId', '==', shop.shopId)
          .get();
        
        if (!shopItemsSnapshot.empty) {
          const newShopProducts = [];
          
          shopItemsSnapshot.forEach(doc => {
            newShopProducts.push({
              type: 'new_product',
              productId: doc.id,
              data: doc.data(),
              timestamp: new Date(),
              fromNewShop: true
            });
          });
          
          if (newShopProducts.length > 0) {
            console.log(`📦 Found ${newShopProducts.length} products from new shop: ${shop.name}`);
            await this.processNewProducts(newShopProducts);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing new shops:', error);
    }
  }

  // Trigger real-time notifications (placeholder for future implementation)
  async triggerRealTimeNotifications(alerts) {
    try {
      // This could integrate with:
      // - WebSocket connections for real-time browser notifications
      // - Push notification services
      // - Email notifications
      // - WhatsApp notifications via existing webhook
      
      console.log(`📱 Would trigger real-time notifications for ${alerts.length} alerts`);
      
      // For now, just log the alerts that would be sent
      for (const alert of alerts) {
        console.log(`🔔 Alert for user ${alert.userId}: ${alert.message}`);
      }
    } catch (error) {
      console.error('❌ Error triggering real-time notifications:', error);
    }
  }

  // Health check for the trigger system
  getHealthStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
      lastProcessed: new Date(),
      status: 'healthy'
    };
  }
}

module.exports = new ProductAvailabilityTrigger();