/**
 * Conversational AI for Saman Khojo
 * Features: Context awareness, User tracking, Product alerts
 */

const { db } = require('../firebaseAdmin');
const cacheService = require('./cacheService');
const performanceMonitor = require('./performanceMonitorService');
const errorHandler = require('./errorHandlingService');
require('dotenv').config();

class ConversationalAI {
  constructor() {
    this.conversationCache = new Map();
    this.learningDatabase = new Map(); // In-memory learning storage
    this.contextWindow = 5; // Remember last 5 messages
  }

  // Main conversation handler with enhanced context awareness
  async handleConversation(message, userId = 'anonymous', context = {}) {
    return await errorHandler.withErrorHandling(async () => {
      // Get conversation history
      const history = this.getConversationHistory(userId);
      
      // Enhanced context processing
      const enhancedContext = await this.processContextualMessage(message, history, context, userId);
      
      // Generate simple response without AI
      const response = this.generateSimpleResponse(message, history, enhancedContext);

      // Store conversation for learning
      this.storeConversation(userId, message, response);

      return response;
    }, {
      service: 'conversational_ai',
      operation: 'handleConversation',
      userId,
      message: message.substring(0, 100)
    });
  }

  // Generate simple response without AI
  generateSimpleResponse(message, history, context) {
    const intent = this.detectIntent(message);
    const language = this.detectLanguage(message);
    
    let responseMessage = '';
    
    // Simple rule-based responses
    if (intent === 'greeting') {
      responseMessage = language === 'hindi' ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?' :
                       language === 'hinglish' ? 'Hello! Main aapki kaise help kar sakta hun?' :
                       'Hello! How can I help you today?';
    } else if (intent === 'search') {
      responseMessage = language === 'hindi' ? 'मैं आपके लिए खोज रहा हूं...' :
                       language === 'hinglish' ? 'Main aapke liye search kar raha hun...' :
                       'I\'m searching for you...';
    } else {
      responseMessage = language === 'hindi' ? 'मैं आपकी मदद करने की कोशिश कर रहा हूं।' :
                       language === 'hinglish' ? 'Main aapki help karne ki koshish kar raha hun.' :
                       'I\'m here to help you with your shopping needs.';
    }
    
    return {
      type: 'text',
      message: responseMessage,
      intent: intent,
      confidence: 0.7,
      suggestions: this.generateSuggestions(message),
      context: { topic: this.extractTopic(message) }
    };
  }

  // Detect language from user message
  detectLanguage(message) {
    const msg = message.toLowerCase().trim();
    
    // Pure Hindi (Devanagari script) - check first
    if (/[\u0900-\u097F]/.test(message)) {
      return 'hindi';
    }
    
    // Check for pure English phrases first
    const englishPhrases = [
      'who are you', 'what can you do', 'how are you', 'what is', 'where is',
      'can you help', 'i need', 'i want', 'tell me', 'show me', 'find me',
      'hello', 'hi', 'hey', 'thanks', 'thank you'
    ];
    
    if (englishPhrases.some(phrase => msg.includes(phrase))) {
      return 'english';
    }
    
    // Hindi/Hinglish patterns - only if not pure English
    const hinglishWords = ['kya', 'kaise', 'kaun', 'kahan', 'tum', 'aap', 
                          'kar sakte', 'batao', 'chahiye', 'milega', 'ho', 'haal',
                          'mujhe', 'mere', 'tera', 'tumhara', 'hamara', 'main'];
    
    const hinglishCount = hinglishWords.filter(word => msg.includes(word)).length;
    
    // If 2 or more Hinglish words, consider it Hinglish
    if (hinglishCount >= 2) {
      return 'hinglish';
    }
    
    // Single Hinglish word mixed with English might still be Hinglish
    if (hinglishCount === 1 && msg.split(' ').length > 2) {
      return 'hinglish';
    }
    
    // Default to English
    return 'english';
  }



  // Simple intent detection
  detectIntent(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('price') || msg.includes('cost') || msg.includes('kitna')) return 'price';
    if (msg.includes('shop') || msg.includes('store') || msg.includes('kahan')) return 'location';
    if (msg.includes('find') || msg.includes('search') || msg.includes('chahiye')) return 'search';
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('namaste')) return 'greeting';
    if (msg.includes('who') || msg.includes('what') || msg.includes('how') || msg.includes('kaun') || msg.includes('kya')) return 'question';
    
    return 'conversation';
  }

  // Extract topic from message
  extractTopic(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('rice') || msg.includes('chawal')) return 'food';
    if (msg.includes('mobile') || msg.includes('phone')) return 'electronics';
    if (msg.includes('shop') || msg.includes('store')) return 'shopping';
    if (msg.includes('repair') || msg.includes('service')) return 'services';
    
    return 'general';
  }



  // Enhanced conversation storage with context tracking
  storeConversation(userId, userMessage, aiResponse) {
    if (!this.conversationCache.has(userId)) {
      this.conversationCache.set(userId, []);
    }

    const conversation = this.conversationCache.get(userId);
    
    // Store with enhanced metadata
    conversation.push(
      { 
        role: 'user', 
        message: userMessage, 
        timestamp: new Date(),
        intent: this.detectIntent(userMessage),
        language: this.detectLanguage(userMessage)
      },
      { 
        role: 'assistant', 
        message: aiResponse.message, 
        timestamp: new Date(),
        intent: aiResponse.intent,
        context: aiResponse.context
      }
    );

    // Keep only last contextWindow * 2 messages (user + AI pairs)
    if (conversation.length > this.contextWindow * 2) {
      conversation.splice(0, conversation.length - (this.contextWindow * 2));
    }

    this.conversationCache.set(userId, conversation);
    
    // Store user context separately for location tracking
    this.updateUserContext(userId, userMessage, aiResponse);
  }

  // Track user context including location
  updateUserContext(userId, userMessage, aiResponse) {
    if (!this.userContextCache) {
      this.userContextCache = new Map();
    }

    let userContext = this.userContextCache.get(userId) || {
      location: null,
      lastSearchQuery: null,
      preferences: {},
      conversationState: 'active'
    };

    // Extract and store location information
    const locationInfo = this.extractLocationFromMessage(userMessage);
    if (locationInfo) {
      userContext.location = locationInfo;
      userContext.locationConfirmed = true;
      console.log(`📍 Location stored for user ${userId}: ${locationInfo}`);
    }

    // Track search queries
    if (aiResponse.intent === 'search' || this.detectIntent(userMessage) === 'search') {
      userContext.lastSearchQuery = userMessage;
      userContext.lastSearchTime = new Date();
    }

    // Update conversation state
    userContext.lastActivity = new Date();
    userContext.messageCount = (userContext.messageCount || 0) + 1;

    this.userContextCache.set(userId, userContext);
  }

  // Get conversation history
  getConversationHistory(userId) {
    return this.conversationCache.get(userId) || [];
  }

  // Get user context including location
  getUserContext(userId) {
    if (!this.userContextCache) {
      this.userContextCache = new Map();
    }
    return this.userContextCache.get(userId) || {
      location: null,
      lastSearchQuery: null,
      preferences: {},
      conversationState: 'active'
    };
  }

  // Process contextual messages with location awareness
  async processContextualMessage(message, history, context, userId) {
    const userContext = this.getUserContext(userId);
    const messageIntent = this.detectIntent(message);
    const isLocationQuery = this.isLocationQuery(message);
    const needsLocation = this.needsLocationContext(message, messageIntent);

    // Enhanced context with user's stored information
    const enhancedContext = {
      ...context,
      userLocation: userContext.location || context.location,
      lastSearchQuery: userContext.lastSearchQuery,
      conversationHistory: history.slice(-4), // Last 4 messages for context
      messageIntent,
      isLocationQuery,
      needsLocation,
      hasLocationStored: !!userContext.location,
      conversationState: userContext.conversationState
    };

    // Handle location-specific logic
    if (isLocationQuery && !userContext.location) {
      enhancedContext.shouldAskLocation = true;
    }

    // Handle follow-up queries that reference previous context
    if (this.isFollowUpQuery(message, history)) {
      enhancedContext.isFollowUp = true;
      enhancedContext.previousContext = this.extractPreviousContext(history);
    }

    return enhancedContext;
  }

  // Extract location from user message
  extractLocationFromMessage(message) {
    const msg = message.toLowerCase().trim();
    
    // Common location patterns
    const locationPatterns = [
      /(?:in|at|near|from)\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+)\s+(?:mein|me|main)/i,
      /^([a-zA-Z\s]+)$/i // Single word/phrase that could be location
    ];

    // Known locations (you can expand this list)
    const knownLocations = [
      'bhanpura', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata',
      'pune', 'hyderabad', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur',
      'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri'
    ];

    // Check if message is just a location name
    if (knownLocations.includes(msg)) {
      return msg;
    }

    // Extract from patterns
    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim().toLowerCase();
        if (knownLocations.includes(location) || location.length > 2) {
          return location;
        }
      }
    }

    return null;
  }

  // Check if message is asking about location
  isLocationQuery(message) {
    const msg = message.toLowerCase();
    const locationKeywords = [
      'where', 'kahan', 'कहाँ', 'near me', 'nearby', 'paas', 'पास',
      'location', 'address', 'directions', 'map'
    ];
    
    return locationKeywords.some(keyword => msg.includes(keyword));
  }

  // Check if query needs location context
  needsLocationContext(message, intent) {
    const msg = message.toLowerCase();
    const locationDependentKeywords = [
      'shop', 'store', 'market', 'restaurant', 'hospital', 'pharmacy',
      'dukan', 'दुकान', 'बाजार', 'अस्पताल'
    ];
    
    return intent === 'search' && locationDependentKeywords.some(keyword => msg.includes(keyword));
  }

  // Check if this is a follow-up query
  isFollowUpQuery(message, history) {
    if (history.length === 0) return false;
    
    const msg = message.toLowerCase().trim();
    const followUpPatterns = [
      /^(yes|no|ok|sure|that one|this one|fine|thanks|thank you)$/i,
      /^(haan|nahi|theek|accha|dhanyawad)$/i,
      /^(और|more|aur|show more|dikhaiye)$/i
    ];

    // Short responses that likely reference previous context
    if (msg.split(' ').length <= 2) {
      return followUpPatterns.some(pattern => pattern.test(msg));
    }

    // References to previous conversation
    const referenceWords = ['that', 'this', 'it', 'woh', 'yeh', 'iska', 'uska'];
    return referenceWords.some(word => msg.includes(word));
  }

  // Extract context from previous conversation
  extractPreviousContext(history) {
    if (history.length === 0) return null;

    const lastAssistantMessage = history.slice().reverse().find(msg => msg.role === 'assistant');
    const lastUserMessage = history.slice().reverse().find(msg => msg.role === 'user');

    return {
      lastQuery: lastUserMessage?.message,
      lastResponse: lastAssistantMessage?.message,
      lastIntent: lastAssistantMessage?.intent,
      lastContext: lastAssistantMessage?.context
    };
  }



  // Generate contextual suggestions
  generateSuggestions(message) {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('price') || messageLower.includes('cost')) {
      return ['Compare prices', 'Find cheapest option', 'Show nearby shops'];
    }
    
    if (messageLower.includes('shop') || messageLower.includes('store')) {
      return ['Get directions', 'Check opening hours', 'See reviews'];
    }
    
    if (messageLower.includes('food') || messageLower.includes('restaurant')) {
      return ['View menu', 'Order online', 'Check ratings'];
    }

    // Default suggestions
    return [
      'Find products near me',
      'Compare prices',
      'Browse categories',
      'Get recommendations'
    ];
  }



  // Get learning statistics
  getLearningStats() {
    return {
      totalInteractions: this.learningDatabase.size,
      activeConversations: this.conversationCache.size,
      recentLearning: Array.from(this.learningDatabase.entries())
        .slice(-10)
        .map(([key, data]) => ({
          query: key,
          learning: data.learning,
          timestamp: data.timestamp
        }))
    };
  }

  // ===== PRODUCT ALERT FUNCTIONALITY =====
  
  /**
   * Track user search interest for unavailable products
   * Requirement 6.1: Track and store search queries and unavailable products
   */
  async trackUserSearchInterest(userId, searchQuery, unavailableProducts = []) {
    return await errorHandler.withErrorHandling(async () => {
      if (!userId || !searchQuery) {
        console.warn('Missing required parameters for tracking user search interest');
        return null;
      }

      const interestData = {
        userId,
        searchQuery: searchQuery.toLowerCase().trim(),
        unavailableProducts: unavailableProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          lastKnownPrice: product.price || 0,
          shopId: product.shopId || null
        })),
        timestamp: new Date(),
        isActive: true,
        notificationSent: false,
        searchContext: {
          language: this.detectLanguage(searchQuery),
          intent: this.detectIntent(searchQuery),
          topic: this.extractTopic(searchQuery)
        }
      };

      // Store in user_search_interests collection
      const docRef = await db.collection('user_search_interests').add(interestData);
      
      console.log(`📝 Tracked search interest for user ${userId}: "${searchQuery}" with ${unavailableProducts.length} unavailable products`);
      
      return {
        id: docRef.id,
        ...interestData
      };
    }, {
      service: 'alerts',
      operation: 'trackUserSearchInterest',
      userId,
      searchQuery: searchQuery.substring(0, 50)
    });
  }

  /**
   * Check product availability changes
   * Requirement 6.2: Detect when products become available
   */
  async checkProductAvailability(productIds = []) {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        console.warn('No product IDs provided for availability check');
        return [];
      }

      const availabilityChanges = [];
      
      // Check each product's current availability
      for (const productId of productIds) {
        try {
          const productDoc = await db.collection('items').doc(productId).get();
          
          if (productDoc.exists) {
            const product = { id: productDoc.id, ...productDoc.data() };
            
            // Check if product is now available (stock > 0)
            const isAvailable = product.stock > 0;
            
            if (isAvailable) {
              // Get previous availability status from tracking
              const previousStatus = await this.getPreviousAvailabilityStatus(productId);
              
              if (!previousStatus || !previousStatus.wasAvailable) {
                availabilityChanges.push({
                  productId,
                  product,
                  changeType: 'back_in_stock',
                  previousStock: previousStatus?.stock || 0,
                  currentStock: product.stock,
                  timestamp: new Date(),
                  shopId: product.shopId,
                  shopName: product.shopName
                });
                
                // Update availability tracking
                await this.updateAvailabilityTracking(productId, {
                  wasAvailable: true,
                  stock: product.stock,
                  lastChecked: new Date()
                });
              }
            } else {
              // Update tracking for unavailable product
              await this.updateAvailabilityTracking(productId, {
                wasAvailable: false,
                stock: 0,
                lastChecked: new Date()
              });
            }
          }
        } catch (productError) {
          console.error(`Error checking availability for product ${productId}:`, productError);
        }
      }
      
      console.log(`🔍 Checked availability for ${productIds.length} products, found ${availabilityChanges.length} changes`);
      return availabilityChanges;
    } catch (error) {
      console.error('Failed to check product availability:', error);
      throw error;
    }
  }

  /**
   * Generate availability alerts for users
   * Requirement 6.3: Push "back in stock" notifications to homepage feed
   */
  async generateAvailabilityAlerts(availabilityChanges = []) {
    const timer = performanceMonitor.startAlertTimer();
    
    return await errorHandler.withErrorHandling(async () => {
      if (!Array.isArray(availabilityChanges) || availabilityChanges.length === 0) {
        console.log('No availability changes to process for alerts');
        timer.end(true, 0);
        return [];
      }

      const generatedAlerts = [];
      
      for (const change of availabilityChanges) {
        try {
          // Find users who were interested in this product
          const interestedUsersSnapshot = await db.collection('user_search_interests')
            .where('unavailableProducts', 'array-contains-any', [
              { id: change.productId },
              change.productId // Handle both object and string formats
            ])
            .where('isActive', '==', true)
            .where('notificationSent', '==', false)
            .get();

          for (const userDoc of interestedUsersSnapshot.docs) {
            const userInterest = { id: userDoc.id, ...userDoc.data() };
            
            // Check if this specific product was in their unavailable list
            const wasInterestedInProduct = userInterest.unavailableProducts.some(
              p => (typeof p === 'object' ? p.id : p) === change.productId
            );
            
            if (wasInterestedInProduct) {
              const alert = {
                userId: userInterest.userId,
                productId: change.productId,
                product: change.product,
                alertType: 'back_in_stock',
                originalSearchQuery: userInterest.searchQuery,
                message: this.generateAlertMessage(change.product, userInterest.searchQuery),
                priority: this.calculateAlertPriority(userInterest, change),
                createdAt: new Date(),
                delivered: false,
                shopId: change.shopId,
                shopName: change.shopName,
                availabilityChange: {
                  changeType: change.changeType,
                  previousStock: change.previousStock,
                  currentStock: change.currentStock
                }
              };

              // Store alert in database
              const alertRef = await db.collection('product_alerts').add(alert);
              alert.id = alertRef.id;
              
              // Mark the search interest as notified
              await db.collection('user_search_interests').doc(userDoc.id).update({
                notificationSent: true,
                notifiedAt: new Date()
              });
              
              generatedAlerts.push(alert);
              
              console.log(`🔔 Generated alert for user ${userInterest.userId} about product ${change.product.name}`);
            }
          }
        } catch (changeError) {
          console.error(`Error processing availability change for product ${change.productId}:`, changeError);
        }
      }
      
      console.log(`✅ Generated ${generatedAlerts.length} availability alerts`);
      timer.end(true, generatedAlerts.length);
      return generatedAlerts;
    }, {
      service: 'alerts',
      operation: 'generateAvailabilityAlerts',
      changesCount: availabilityChanges.length
    });
  }

  /**
   * Deliver alerts to homepage feed
   * Requirement 6.4: Show "back in stock for you" banner on homepage
   */
  async deliverAlertsToHomepageFeed(userId, limit = 5) {
    try {
      if (!userId) {
        console.warn('No user ID provided for homepage feed delivery');
        return [];
      }

      // Get undelivered alerts for the user
      const alertsSnapshot = await db.collection('product_alerts')
        .where('userId', '==', userId)
        .where('delivered', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const alerts = [];
      const batch = db.batch();

      alertsSnapshot.forEach(doc => {
        const alert = { id: doc.id, ...doc.data() };
        alerts.push(alert);
        
        // Mark alert as delivered
        batch.update(doc.ref, { 
          delivered: true, 
          deliveredAt: new Date() 
        });
      });

      // Commit the batch update
      if (alerts.length > 0) {
        await batch.commit();
        console.log(`📬 Delivered ${alerts.length} alerts to homepage feed for user ${userId}`);
      }

      // Format alerts for homepage display
      const homepageAlerts = alerts.map(alert => ({
        id: alert.id,
        type: 'back_in_stock',
        title: 'Back in Stock for You! 🎉',
        message: alert.message,
        product: {
          id: alert.productId,
          name: alert.product.name,
          price: alert.product.price,
          image: alert.product.image,
          category: alert.product.category,
          shopName: alert.shopName
        },
        originalQuery: alert.originalSearchQuery,
        priority: alert.priority,
        timestamp: alert.createdAt,
        actionUrl: `/product/${alert.productId}`,
        actionText: 'View Product'
      }));

      return homepageAlerts;
    } catch (error) {
      console.error('Failed to deliver alerts to homepage feed:', error);
      throw error;
    }
  }

  /**
   * Get all active alerts for a user (for homepage banner display)
   * Requirement 6.4: Show prominent "back in stock for you" banner
   */
  async getUserActiveAlerts(userId) {
    try {
      if (!userId) {
        return [];
      }

      const alertsSnapshot = await db.collection('product_alerts')
        .where('userId', '==', userId)
        .where('delivered', '==', false)
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const alerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return alerts;
    } catch (error) {
      console.error('Failed to get user active alerts:', error);
      return [];
    }
  }

  /**
   * Process search results to identify unavailable products for tracking
   */
  async processSearchForUnavailableProducts(userId, searchQuery, searchResults = []) {
    try {
      if (!userId || !searchQuery) {
        return null;
      }

      // Identify unavailable products from search results
      const unavailableProducts = searchResults.filter(product => 
        !product.stock || product.stock <= 0
      );

      if (unavailableProducts.length > 0) {
        // Track user interest in these unavailable products
        await this.trackUserSearchInterest(userId, searchQuery, unavailableProducts);
        
        console.log(`🔍 Found ${unavailableProducts.length} unavailable products for query: "${searchQuery}"`);
      }

      return unavailableProducts;
    } catch (error) {
      console.error('Failed to process search for unavailable products:', error);
      return [];
    }
  }

  // ===== HELPER METHODS FOR PRODUCT ALERTS =====

  /**
   * Get previous availability status for a product
   */
  async getPreviousAvailabilityStatus(productId) {
    try {
      const statusDoc = await db.collection('product_availability_tracking')
        .doc(productId)
        .get();
      
      return statusDoc.exists ? statusDoc.data() : null;
    } catch (error) {
      console.error('Failed to get previous availability status:', error);
      return null;
    }
  }

  /**
   * Update availability tracking for a product
   */
  async updateAvailabilityTracking(productId, status) {
    try {
      await db.collection('product_availability_tracking')
        .doc(productId)
        .set({
          productId,
          ...status,
          updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
      console.error('Failed to update availability tracking:', error);
    }
  }

  /**
   * Generate alert message for back in stock notification
   */
  generateAlertMessage(product, originalQuery) {
    const messages = [
      `Great news! "${product.name}" is back in stock! You searched for "${originalQuery}" earlier.`,
      `🎉 "${product.name}" is available again! Remember when you looked for "${originalQuery}"?`,
      `Back in stock: "${product.name}"! This matches your search for "${originalQuery}".`,
      `Good news! "${product.name}" is now available. You were looking for "${originalQuery}".`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Calculate alert priority based on user interest and product availability
   */
  calculateAlertPriority(userInterest, availabilityChange) {
    let priority = 'medium';
    
    // High priority if user searched recently (within 7 days)
    const daysSinceSearch = (new Date() - userInterest.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceSearch <= 7) {
      priority = 'high';
    }
    
    // High priority if it's a popular product category
    const popularCategories = ['electronics', 'mobile', 'fashion', 'food'];
    if (popularCategories.includes(availabilityChange.product.category?.toLowerCase())) {
      priority = 'high';
    }
    
    // Low priority if user searched long ago (more than 30 days)
    if (daysSinceSearch > 30) {
      priority = 'low';
    }
    
    return priority;
  }

  /**
   * Clean up old search interests and alerts (maintenance function)
   */
  async cleanupOldAlertData(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Clean up old search interests
      const oldInterestsSnapshot = await db.collection('user_search_interests')
        .where('timestamp', '<', cutoffDate)
        .get();
      
      const batch = db.batch();
      oldInterestsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Clean up old delivered alerts
      const oldAlertsSnapshot = await db.collection('product_alerts')
        .where('delivered', '==', true)
        .where('deliveredAt', '<', cutoffDate)
        .get();
      
      oldAlertsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`🧹 Cleaned up ${oldInterestsSnapshot.size} old search interests and ${oldAlertsSnapshot.size} old alerts`);
      
      return {
        deletedInterests: oldInterestsSnapshot.size,
        deletedAlerts: oldAlertsSnapshot.size
      };
    } catch (error) {
      console.error('Failed to cleanup old alert data:', error);
      throw error;
    }
  }
  /**
   * Get user's product alerts
   * Requirements 6.4, 6.5: Fetch user's product alerts for display
   */
  async getUserProductAlerts(userId, options = {}) {
    try {
      if (!userId) {
        console.warn('User ID is required to get product alerts');
        return [];
      }

      const { limit = 20, status = 'active' } = options;
      
      // Query user search interests that have unavailable products
      let query = db.collection('user_search_interests')
        .where('userId', '==', userId)
        .where('isActive', '==', status === 'active')
        .orderBy('timestamp', 'desc')
        .limit(limit);

      const interestsSnapshot = await query.get();
      const alerts = [];

      for (const doc of interestsSnapshot.docs) {
        const interest = { id: doc.id, ...doc.data() };
        
        // Check current availability of tracked products
        for (const trackedProduct of interest.unavailableProducts || []) {
          try {
            const productDoc = await db.collection('items').doc(trackedProduct.id).get();
            
            if (productDoc.exists) {
              const currentProduct = { id: productDoc.id, ...productDoc.data() };
              const isNowAvailable = currentProduct.stock > 0;
              
              // Create alert if product is now available and wasn't before
              if (isNowAvailable && !interest.notificationSent) {
                alerts.push({
                  id: `${interest.id}_${trackedProduct.id}`,
                  userId,
                  productId: trackedProduct.id,
                  productName: currentProduct.name,
                  originalSearchQuery: interest.searchQuery,
                  alertType: 'back_in_stock',
                  product: {
                    id: currentProduct.id,
                    name: currentProduct.name,
                    category: currentProduct.category,
                    price: currentProduct.price,
                    stock: currentProduct.stock,
                    shopId: currentProduct.shopId,
                    shopName: currentProduct.shopName,
                    image: currentProduct.image
                  },
                  createdAt: interest.timestamp,
                  availableAt: new Date(),
                  priority: this.calculateAlertPriority(interest, currentProduct),
                  message: `"${currentProduct.name}" is now back in stock! You searched for "${interest.searchQuery}".`,
                  actionUrl: `/product/${currentProduct.id}`,
                  delivered: false,
                  searchContext: interest.searchContext
                });
              }
            }
          } catch (productError) {
            console.error(`Error checking product ${trackedProduct.id}:`, productError);
          }
        }
      }

      // Sort alerts by priority and date
      alerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.availableAt) - new Date(a.availableAt);
      });

      console.log(`📬 Retrieved ${alerts.length} product alerts for user ${userId}`);
      return alerts;
    } catch (error) {
      console.error('Failed to get user product alerts:', error);
      throw error;
    }
  }

  /**
   * Calculate alert priority based on user interest and product characteristics
   */
  calculateAlertPriority(interest, product) {
    let priority = 'medium';
    
    // High priority if user searched recently (within 7 days)
    const daysSinceSearch = (Date.now() - interest.timestamp.toDate().getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSearch <= 7) {
      priority = 'high';
    }
    
    // High priority for expensive items (over 1000)
    if (product.price > 1000) {
      priority = 'high';
    }
    
    // Low priority for very old searches (over 30 days)
    if (daysSinceSearch > 30) {
      priority = 'low';
    }
    
    return priority;
  }

  /**
   * Mark alert as delivered to avoid duplicate notifications
   */
  async markAlertAsDelivered(userId, productId, searchInterestId) {
    try {
      await db.collection('user_search_interests').doc(searchInterestId).update({
        notificationSent: true,
        notificationSentAt: new Date()
      });
      
      console.log(`✅ Marked alert as delivered for user ${userId}, product ${productId}`);
      return true;
    } catch (error) {
      console.error('Failed to mark alert as delivered:', error);
      return false;
    }
  }
}

module.exports = new ConversationalAI();