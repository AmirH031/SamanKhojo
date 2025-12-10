/**
 * Personalized Shopping Service
 * Advanced recommendation algorithms and behavioral pattern learning
 */

const { db } = require('../firebaseAdmin');


class PersonalizedShoppingService {
  constructor() {
    // AI functionality removed for production
  }

  // Record user interaction for learning
  async recordUserInteraction(userId, interaction) {
    try {
      const interactionData = {
        userId,
        type: interaction.type, // 'search', 'view', 'add_to_bag', 'purchase', 'inquiry'
        data: interaction.data,
        context: {
          timestamp: new Date(),
          source: interaction.source || 'web', // web, whatsapp, botpress
          location: interaction.location,
          deviceType: interaction.deviceType || 'unknown'
        },
        sessionId: interaction.sessionId
      };

      await db.collection('user_interactions').add(interactionData);
      
      // Update user profile with latest interaction
      await this.updateUserProfile(userId, interaction);
      
      return interactionData;
    } catch (error) {
      console.error('Failed to record user interaction:', error);
      throw error;
    }
  }

  // Update user profile based on interactions
  async updateUserProfile(userId, interaction) {
    try {
      const userRef = db.collection('user_profiles').doc(userId);
      const userDoc = await userRef.get();
      
      let profile = userDoc.exists ? userDoc.data() : {
        userId,
        preferences: {
          categories: {},
          priceRange: { min: 0, max: 0 },
          brands: {},
          shops: {}
        },
        behavior: {
          searchPatterns: [],
          shoppingTimes: [],
          avgSessionDuration: 0,
          totalInteractions: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update preferences based on interaction
      if (interaction.data.category) {
        const category = interaction.data.category;
        profile.preferences.categories[category] = (profile.preferences.categories[category] || 0) + 1;
      }

      if (interaction.data.price) {
        const price = interaction.data.price;
        if (profile.preferences.priceRange.min === 0 || price < profile.preferences.priceRange.min) {
          profile.preferences.priceRange.min = price;
        }
        if (price > profile.preferences.priceRange.max) {
          profile.preferences.priceRange.max = price;
        }
      }

      if (interaction.data.shopId) {
        const shopId = interaction.data.shopId;
        profile.preferences.shops[shopId] = (profile.preferences.shops[shopId] || 0) + 1;
      }

      // Update behavior patterns
      profile.behavior.totalInteractions++;
      profile.behavior.shoppingTimes.push(new Date().getHours());
      
      if (interaction.data.query) {
        profile.behavior.searchPatterns.push({
          query: interaction.data.query,
          timestamp: new Date()
        });
        
        // Keep only last 50 search patterns
        if (profile.behavior.searchPatterns.length > 50) {
          profile.behavior.searchPatterns = profile.behavior.searchPatterns.slice(-50);
        }
      }

      profile.updatedAt = new Date();

      await userRef.set(profile, { merge: true });
      return profile;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        category = null,
        limit = 10,
        includePromotions = true,
        includeCrossSell = true,
        location = null
      } = options;

      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Get user interaction history
      const recentInteractions = await this.getRecentInteractions(userId, 20);
      
      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(
        userProfile, 
        recentInteractions, 
        { category, location }
      );
      
      // Get collaborative filtering recommendations
      const collaborativeRecommendations = await this.getCollaborativeRecommendations(
        userId, 
        userProfile
      );
      
      // Get trending items in user's preferred categories
      const trendingRecommendations = await this.getTrendingRecommendations(
        userProfile.preferences.categories
      );
      
      // Combine and rank all recommendations
      const combinedRecommendations = this.combineAndRankRecommendations([
        ...aiRecommendations,
        ...collaborativeRecommendations,
        ...trendingRecommendations
      ], userProfile);

      // Add promotions if requested
      let promotions = [];
      if (includePromotions) {
        promotions = await this.getPersonalizedPromotions(userId, userProfile);
      }

      // Add cross-sell recommendations if requested
      let crossSell = [];
      if (includeCrossSell && recentInteractions.length > 0) {
        crossSell = await this.getCrossSellRecommendations(userId, recentInteractions);
      }

      return {
        recommendations: combinedRecommendations.slice(0, limit),
        promotions,
        crossSell,
        reasoning: this.generateRecommendationReasoning(userProfile, combinedRecommendations.slice(0, 3)),
        userProfile: {
          favoriteCategories: Object.keys(userProfile.preferences.categories)
            .sort((a, b) => userProfile.preferences.categories[b] - userProfile.preferences.categories[a])
            .slice(0, 3),
          priceRange: userProfile.preferences.priceRange,
          totalInteractions: userProfile.behavior.totalInteractions
        }
      };
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return {
        recommendations: [],
        promotions: [],
        crossSell: [],
        reasoning: 'Unable to generate personalized recommendations at this time.',
        error: error.message
      };
    }
  }

  // Generate simple rule-based recommendations
  async generateAIRecommendations(userProfile, recentInteractions, context) {
    try {
      // Simple rule-based recommendations without AI
      return [];
      const prompt = this.buildRecommendationPrompt(userProfile, recentInteractions, context);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse AI response to extract item recommendations
      const recommendations = this.parseAIRecommendations(response);
      
      // Fetch actual items from database based on AI suggestions
      const items = await this.fetchRecommendedItems(recommendations);
      
      return items.map(item => ({
        ...item,
        source: 'ai',
        confidence: 0.8,
        reason: 'AI-powered recommendation based on your preferences'
      }));
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return [];
    }
  }

  // Build recommendation prompt for Gemini AI
  buildRecommendationPrompt(userProfile, recentInteractions, context) {
    const favoriteCategories = Object.keys(userProfile.preferences.categories)
      .sort((a, b) => userProfile.preferences.categories[b] - userProfile.preferences.categories[a])
      .slice(0, 3);

    const recentSearches = recentInteractions
      .filter(i => i.type === 'search' && i.data.query)
      .slice(0, 5)
      .map(i => i.data.query);

    return `
You are a personalized shopping assistant. Based on the user's profile and behavior, recommend relevant products.

User Profile:
- Favorite Categories: ${favoriteCategories.join(', ')}
- Price Range: ₹${userProfile.preferences.priceRange.min} - ₹${userProfile.preferences.priceRange.max}
- Total Interactions: ${userProfile.behavior.totalInteractions}

Recent Searches: ${recentSearches.join(', ')}

Context:
- Requested Category: ${context.category || 'Any'}
- Location: ${context.location || 'Not specified'}

Please recommend 5-8 products that would interest this user. For each recommendation, provide:
1. Product category
2. Product type/name
3. Estimated price range
4. Reason for recommendation

Format your response as JSON:
{
  "recommendations": [
    {
      "category": "category_name",
      "productType": "product_name",
      "priceRange": "min-max",
      "reason": "why_recommended"
    }
  ]
}
`;
  }

  // Parse AI recommendations response
  parseAIRecommendations(response) {
    try {
      // Clean the response
      let cleanResponse = response.trim();
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return parsed.recommendations || [];
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
      return [];
    }
  }

  // Fetch actual items based on AI recommendations
  async fetchRecommendedItems(recommendations) {
    try {
      const items = [];
      
      for (const rec of recommendations) {
        // Search for items matching the AI recommendation
        const itemsSnapshot = await db.collection('items')
          .where('category', '==', rec.category)
          .where('stock', '>', 0)
          .limit(2)
          .get();
        
        itemsSnapshot.forEach(doc => {
          const item = { id: doc.id, ...doc.data() };
          item.aiReason = rec.reason;
          items.push(item);
        });
      }
      
      return items;
    } catch (error) {
      console.error('Failed to fetch recommended items:', error);
      return [];
    }
  }

  // Get collaborative filtering recommendations
  async getCollaborativeRecommendations(userId, userProfile) {
    try {
      // Find users with similar preferences
      const similarUsers = await this.findSimilarUsers(userId, userProfile);
      
      // Get items that similar users liked but current user hasn't interacted with
      const recommendations = [];
      
      for (const similarUser of similarUsers.slice(0, 5)) {
        const theirInteractions = await this.getRecentInteractions(similarUser.userId, 10);
        
        for (const interaction of theirInteractions) {
          if (interaction.type === 'add_to_bag' || interaction.type === 'purchase') {
            const itemId = interaction.data.itemId;
            
            // Check if current user has already interacted with this item
            const hasInteracted = await this.hasUserInteractedWithItem(userId, itemId);
            
            if (!hasInteracted) {
              const itemDoc = await db.collection('items').doc(itemId).get();
              if (itemDoc.exists) {
                const item = { id: itemDoc.id, ...itemDoc.data() };
                recommendations.push({
                  ...item,
                  source: 'collaborative',
                  confidence: similarUser.similarity,
                  reason: `Users with similar preferences also liked this`
                });
              }
            }
          }
        }
      }
      
      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('Collaborative filtering failed:', error);
      return [];
    }
  }

  // Find users with similar preferences
  async findSimilarUsers(userId, userProfile) {
    try {
      const allProfilesSnapshot = await db.collection('user_profiles')
        .where('userId', '!=', userId)
        .limit(50)
        .get();
      
      const similarUsers = [];
      
      allProfilesSnapshot.forEach(doc => {
        const otherProfile = doc.data();
        const similarity = this.calculateUserSimilarity(userProfile, otherProfile);
        
        if (similarity > 0.3) { // Minimum similarity threshold
          similarUsers.push({
            userId: otherProfile.userId,
            similarity
          });
        }
      });
      
      return similarUsers.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Failed to find similar users:', error);
      return [];
    }
  }

  // Calculate similarity between two user profiles
  calculateUserSimilarity(profile1, profile2) {
    let similarity = 0;
    let factors = 0;
    
    // Category preferences similarity
    const categories1 = Object.keys(profile1.preferences.categories);
    const categories2 = Object.keys(profile2.preferences.categories);
    const commonCategories = categories1.filter(cat => categories2.includes(cat));
    
    if (categories1.length > 0 && categories2.length > 0) {
      similarity += (commonCategories.length / Math.max(categories1.length, categories2.length)) * 0.4;
      factors += 0.4;
    }
    
    // Price range similarity
    const priceRange1 = profile1.preferences.priceRange;
    const priceRange2 = profile2.preferences.priceRange;
    
    if (priceRange1.max > 0 && priceRange2.max > 0) {
      const overlap = Math.max(0, Math.min(priceRange1.max, priceRange2.max) - Math.max(priceRange1.min, priceRange2.min));
      const union = Math.max(priceRange1.max, priceRange2.max) - Math.min(priceRange1.min, priceRange2.min);
      similarity += (overlap / union) * 0.3;
      factors += 0.3;
    }
    
    // Shopping time similarity
    const times1 = profile1.behavior.shoppingTimes || [];
    const times2 = profile2.behavior.shoppingTimes || [];
    
    if (times1.length > 0 && times2.length > 0) {
      const avgTime1 = times1.reduce((a, b) => a + b, 0) / times1.length;
      const avgTime2 = times2.reduce((a, b) => a + b, 0) / times2.length;
      const timeDiff = Math.abs(avgTime1 - avgTime2);
      similarity += Math.max(0, (12 - timeDiff) / 12) * 0.3;
      factors += 0.3;
    }
    
    return factors > 0 ? similarity / factors : 0;
  }

  // Get trending recommendations
  async getTrendingRecommendations(userCategories) {
    try {
      const trendingItems = [];
      const categories = Object.keys(userCategories).slice(0, 3);
      
      for (const category of categories) {
        // Get items with high interaction count in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const interactionsSnapshot = await db.collection('user_interactions')
          .where('data.category', '==', category)
          .where('context.timestamp', '>', weekAgo)
          .get();
        
        // Count interactions per item
        const itemInteractions = {};
        interactionsSnapshot.forEach(doc => {
          const interaction = doc.data();
          const itemId = interaction.data.itemId;
          if (itemId) {
            itemInteractions[itemId] = (itemInteractions[itemId] || 0) + 1;
          }
        });
        
        // Get top trending items
        const sortedItems = Object.entries(itemInteractions)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        
        for (const [itemId, interactionCount] of sortedItems) {
          const itemDoc = await db.collection('items').doc(itemId).get();
          if (itemDoc.exists) {
            const item = { id: itemDoc.id, ...itemDoc.data() };
            trendingItems.push({
              ...item,
              source: 'trending',
              confidence: Math.min(interactionCount / 10, 1),
              reason: `Trending in ${category} - ${interactionCount} recent interactions`
            });
          }
        }
      }
      
      return trendingItems;
    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
      return [];
    }
  }

  // Combine and rank all recommendations
  combineAndRankRecommendations(recommendations, userProfile) {
    // Remove duplicates
    const uniqueRecommendations = recommendations.filter((item, index, self) => 
      index === self.findIndex(i => i.id === item.id)
    );
    
    // Calculate final score for each recommendation
    uniqueRecommendations.forEach(item => {
      let score = item.confidence || 0.5;
      
      // Boost score based on user preferences
      if (userProfile.preferences.categories[item.category]) {
        score += 0.2;
      }
      
      // Boost score if price is in user's range
      const userPriceRange = userProfile.preferences.priceRange;
      if (item.price >= userPriceRange.min && item.price <= userPriceRange.max) {
        score += 0.1;
      }
      
      // Boost score based on item rating
      if (item.rating) {
        score += (item.rating / 5) * 0.1;
      }
      
      // Boost score if item is in stock
      if (item.stock > 0) {
        score += 0.1;
      }
      
      item.finalScore = Math.min(score, 1);
    });
    
    // Sort by final score
    return uniqueRecommendations.sort((a, b) => b.finalScore - a.finalScore);
  }

  // Generate recommendation reasoning
  generateRecommendationReasoning(userProfile, topRecommendations) {
    const favoriteCategories = Object.keys(userProfile.preferences.categories)
      .sort((a, b) => userProfile.preferences.categories[b] - userProfile.preferences.categories[a])
      .slice(0, 2);
    
    let reasoning = `Based on your shopping history, you seem to prefer ${favoriteCategories.join(' and ')} items. `;
    
    if (topRecommendations.length > 0) {
      const topItem = topRecommendations[0];
      reasoning += `We're recommending ${topItem.name} because ${topItem.reason || 'it matches your preferences'}.`;
    }
    
    return reasoning;
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userDoc = await db.collection('user_profiles').doc(userId).get();
      
      if (userDoc.exists) {
        return userDoc.data();
      } else {
        // Create default profile
        const defaultProfile = {
          userId,
          preferences: {
            categories: {},
            priceRange: { min: 0, max: 10000 },
            brands: {},
            shops: {}
          },
          behavior: {
            searchPatterns: [],
            shoppingTimes: [],
            avgSessionDuration: 0,
            totalInteractions: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('user_profiles').doc(userId).set(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Get recent user interactions
  async getRecentInteractions(userId, limit = 20) {
    try {
      const interactionsSnapshot = await db.collection('user_interactions')
        .where('userId', '==', userId)
        .orderBy('context.timestamp', 'desc')
        .limit(limit)
        .get();
      
      return interactionsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to get recent interactions:', error);
      return [];
    }
  }

  // Check if user has interacted with an item
  async hasUserInteractedWithItem(userId, itemId) {
    try {
      const interactionSnapshot = await db.collection('user_interactions')
        .where('userId', '==', userId)
        .where('data.itemId', '==', itemId)
        .limit(1)
        .get();
      
      return !interactionSnapshot.empty;
    } catch (error) {
      console.error('Failed to check user interaction:', error);
      return false;
    }
  }

  // Get personalized promotions
  async getPersonalizedPromotions(userId, userProfile) {
    try {
      const favoriteCategories = Object.keys(userProfile.preferences.categories).slice(0, 3);
      const promotions = [];
      
      for (const category of favoriteCategories) {
        const promotionsSnapshot = await db.collection('promotions')
          .where('category', '==', category)
          .where('isActive', '==', true)
          .where('validUntil', '>', new Date())
          .limit(2)
          .get();
        
        promotionsSnapshot.forEach(doc => {
          promotions.push({ id: doc.id, ...doc.data() });
        });
      }
      
      return promotions;
    } catch (error) {
      console.error('Failed to get personalized promotions:', error);
      return [];
    }
  }

  // Get cross-sell recommendations
  async getCrossSellRecommendations(userId, recentInteractions) {
    try {
      const crossSellItems = [];
      
      // Get items from recent interactions
      const recentItemIds = recentInteractions
        .filter(i => i.data.itemId)
        .map(i => i.data.itemId)
        .slice(0, 5);
      
      for (const itemId of recentItemIds) {
        // Find items frequently bought together
        const frequentlyBoughtTogether = await this.findFrequentlyBoughtTogether(itemId);
        crossSellItems.push(...frequentlyBoughtTogether);
      }
      
      return crossSellItems.slice(0, 5);
    } catch (error) {
      console.error('Failed to get cross-sell recommendations:', error);
      return [];
    }
  }

  // Find items frequently bought together
  async findFrequentlyBoughtTogether(itemId) {
    try {
      // This would typically analyze purchase history to find items bought together
      // For now, we'll use a simple category-based approach
      
      const itemDoc = await db.collection('items').doc(itemId).get();
      if (!itemDoc.exists) return [];
      
      const item = itemDoc.data();
      
      // Find other items in the same category
      const relatedItemsSnapshot = await db.collection('items')
        .where('category', '==', item.category)
        .where('stock', '>', 0)
        .limit(5)
        .get();
      
      const relatedItems = [];
      relatedItemsSnapshot.forEach(doc => {
        if (doc.id !== itemId) {
          relatedItems.push({
            id: doc.id,
            ...doc.data(),
            source: 'cross_sell',
            confidence: 0.6,
            reason: `Frequently bought with ${item.name}`
          });
        }
      });
      
      return relatedItems;
    } catch (error) {
      console.error('Failed to find frequently bought together items:', error);
      return [];
    }
  }

  // ===== AVAILABILITY MONITORING FUNCTIONS =====

  // Track user interest in unavailable products with retry mechanism
  async trackUnavailableProductInterest(userId, searchQuery, unavailableProducts, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
    
    try {
      const interestData = {
        userId,
        searchQuery,
        unavailableProducts: unavailableProducts.map(product => ({
          itemId: product.id,
          name: product.name,
          category: product.category,
          shopId: product.shopId,
          price: product.price
        })),
        timestamp: new Date(),
        notified: false,
        active: true,
        retryCount
      };

      const docRef = await db.collection('product_interests').add(interestData);
      console.log(`📝 Tracked interest for user ${userId} in ${unavailableProducts.length} unavailable products`);
      
      return docRef.id;
    } catch (error) {
      console.error(`Failed to track unavailable product interest (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.trackUnavailableProductInterest(userId, searchQuery, unavailableProducts, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Monitor product availability changes with error handling and batching
  async monitorProductAvailability(productIds, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 2000 * Math.pow(2, retryCount);
    const batchSize = 50; // Process in smaller batches to avoid timeouts
    
    try {
      const availabilityChanges = [];
      
      // Process products in batches
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        
        try {
          const batchChanges = await this.processBatchAvailability(batch);
          availabilityChanges.push(...batchChanges);
          
          // Small delay between batches to prevent overwhelming Firestore
          if (i + batchSize < productIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (batchError) {
          console.error(`❌ Error processing batch ${i / batchSize + 1}:`, batchError);
          
          // Continue with next batch instead of failing completely
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying batch in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            const retryBatchChanges = await this.processBatchAvailability(batch);
            availabilityChanges.push(...retryBatchChanges);
          }
        }
      }
      
      return availabilityChanges;
    } catch (error) {
      console.error(`Failed to monitor product availability (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying availability monitoring in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.monitorProductAvailability(productIds, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Process a batch of products for availability changes
  async processBatchAvailability(productIds) {
    const availabilityChanges = [];
    
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(
      productIds.map(async (productId) => {
        const currentDoc = await db.collection('items').doc(productId).get();
        
        if (currentDoc.exists) {
          const currentData = currentDoc.data();
          
          // Get previous availability state
          const previousStateDoc = await db.collection('product_availability_states')
            .doc(productId)
            .get();
          
          let previousState = null;
          if (previousStateDoc.exists) {
            previousState = previousStateDoc.data();
          }
          
          // Check for availability changes
          const change = this.detectAvailabilityChange(productId, previousState, currentData);
          
          if (change) {
            // Update availability state
            await db.collection('product_availability_states').doc(productId).set({
              stock: currentData.stock,
              isAvailable: currentData.stock > 0,
              price: currentData.price,
              lastUpdated: new Date(),
              shopId: currentData.shopId
            });
            
            return change;
          }
        }
        
        return null;
      })
    );
    
    // Collect successful results and log failures
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        availabilityChanges.push(result.value);
      } else if (result.status === 'rejected') {
        console.error(`❌ Failed to process product ${productIds[index]}:`, result.reason);
      }
    });
    
    return availabilityChanges;
  }

  // Detect availability changes
  detectAvailabilityChange(productId, previousState, currentData) {
    if (!previousState) {
      // First time tracking this product
      return null;
    }
    
    const wasAvailable = previousState.isAvailable;
    const isNowAvailable = currentData.stock > 0;
    
    // Product became available
    if (!wasAvailable && isNowAvailable) {
      return {
        productId,
        changeType: 'back_in_stock',
        previousStock: previousState.stock,
        currentStock: currentData.stock,
        timestamp: new Date(),
        shopId: currentData.shopId
      };
    }
    
    // Stock increased significantly (restocked)
    if (wasAvailable && isNowAvailable && currentData.stock > previousState.stock + 5) {
      return {
        productId,
        changeType: 'restocked',
        previousStock: previousState.stock,
        currentStock: currentData.stock,
        timestamp: new Date(),
        shopId: currentData.shopId
      };
    }
    
    // Price changed
    if (previousState.price !== currentData.price) {
      return {
        productId,
        changeType: 'price_change',
        previousPrice: previousState.price,
        currentPrice: currentData.price,
        timestamp: new Date(),
        shopId: currentData.shopId
      };
    }
    
    return null;
  }

  // Process availability alerts for users with error handling and retry
  async processAvailabilityAlerts(availabilityChanges, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1500 * Math.pow(2, retryCount);
    
    try {
      const alertsGenerated = [];
      const failedAlerts = [];
      
      for (const change of availabilityChanges) {
        if (change.changeType === 'back_in_stock' || change.changeType === 'restocked') {
          try {
            // Find users interested in this product with better query
            const interestedUsersSnapshot = await db.collection('product_interests')
              .where('active', '==', true)
              .get();
            
            // Filter in memory for more complex matching
            const matchingInterests = [];
            interestedUsersSnapshot.forEach(doc => {
              const interest = doc.data();
              if (interest.unavailableProducts) {
                const hasMatchingProduct = interest.unavailableProducts.some(
                  product => product.itemId === change.productId
                );
                if (hasMatchingProduct) {
                  matchingInterests.push({ doc, interest });
                }
              }
            });
            
            // Process alerts for matching users
            const alertPromises = matchingInterests.map(async ({ doc, interest }) => {
              try {
                // Create alert for user
                const alert = await this.createProductAlert(interest.userId, change, interest.searchQuery);
                
                // Mark interest as notified
                await doc.ref.update({ 
                  notified: true, 
                  notifiedAt: new Date(),
                  alertId: alert.id
                });
                
                return alert;
              } catch (alertError) {
                console.error(`❌ Failed to create alert for user ${interest.userId}:`, alertError);
                failedAlerts.push({ userId: interest.userId, error: alertError.message });
                return null;
              }
            });
            
            const alerts = await Promise.allSettled(alertPromises);
            alerts.forEach(result => {
              if (result.status === 'fulfilled' && result.value) {
                alertsGenerated.push(result.value);
              }
            });
            
          } catch (changeError) {
            console.error(`❌ Failed to process change for product ${change.productId}:`, changeError);
            failedAlerts.push({ productId: change.productId, error: changeError.message });
          }
        }
      }
      
      console.log(`🔔 Generated ${alertsGenerated.length} availability alerts`);
      if (failedAlerts.length > 0) {
        console.warn(`⚠️ ${failedAlerts.length} alerts failed to process`);
      }
      
      return alertsGenerated;
    } catch (error) {
      console.error(`Failed to process availability alerts (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying alert processing in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.processAvailabilityAlerts(availabilityChanges, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Create product alert for user
  async createProductAlert(userId, availabilityChange, originalSearchQuery) {
    try {
      const productDoc = await db.collection('items').doc(availabilityChange.productId).get();
      
      if (!productDoc.exists) {
        throw new Error(`Product ${availabilityChange.productId} not found`);
      }
      
      const product = productDoc.data();
      
      const alertData = {
        userId,
        productId: availabilityChange.productId,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        shopId: product.shopId,
        alertType: availabilityChange.changeType,
        originalSearchQuery,
        message: this.generateAlertMessage(product, availabilityChange),
        createdAt: new Date(),
        delivered: false,
        read: false,
        priority: this.calculateAlertPriority(availabilityChange, originalSearchQuery)
      };
      
      const alertRef = await db.collection('product_alerts').add(alertData);
      
      console.log(`🔔 Created alert ${alertRef.id} for user ${userId} - ${product.name} is back in stock`);
      
      return { id: alertRef.id, ...alertData };
    } catch (error) {
      console.error('Failed to create product alert:', error);
      throw error;
    }
  }

  // Generate alert message
  generateAlertMessage(product, availabilityChange) {
    switch (availabilityChange.changeType) {
      case 'back_in_stock':
        return `Good news! "${product.name}" is back in stock. Don't miss out this time!`;
      case 'restocked':
        return `"${product.name}" has been restocked with more inventory!`;
      case 'price_change':
        const priceDirection = availabilityChange.currentPrice < availabilityChange.previousPrice ? 'dropped' : 'increased';
        return `Price ${priceDirection} for "${product.name}" - now ₹${availabilityChange.currentPrice}`;
      case 'new_product_match':
        return `New product found matching your search: "${product.name}"`;
      default:
        return `Update available for "${product.name}"`;
    }
  }

  // Calculate alert priority
  calculateAlertPriority(availabilityChange, originalSearchQuery) {
    let priority = 'medium';
    
    // High priority for back in stock
    if (availabilityChange.changeType === 'back_in_stock') {
      priority = 'high';
    }
    
    // High priority for significant price drops
    if (availabilityChange.changeType === 'price_change' && 
        availabilityChange.currentPrice < availabilityChange.previousPrice * 0.8) {
      priority = 'high';
    }
    
    // Medium priority for restocks
    if (availabilityChange.changeType === 'restocked') {
      priority = 'medium';
    }
    
    // Low priority for small price increases
    if (availabilityChange.changeType === 'price_change' && 
        availabilityChange.currentPrice > availabilityChange.previousPrice) {
      priority = 'low';
    }
    
    return priority;
  }

  // Cleanup old alerts
  async cleanupOldAlerts(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Cleanup old delivered alerts
      const oldAlertsSnapshot = await db.collection('product_alerts')
        .where('delivered', '==', true)
        .where('createdAt', '<', cutoffDate)
        .get();
      
      if (oldAlertsSnapshot.size > 0) {
        const batch = db.batch();
        oldAlertsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`🧹 Cleaned up ${oldAlertsSnapshot.size} old alerts`);
      }
      
      // Cleanup old inactive interests
      const oldInterestsSnapshot = await db.collection('product_interests')
        .where('active', '==', false)
        .where('timestamp', '<', cutoffDate)
        .get();
      
      if (oldInterestsSnapshot.size > 0) {
        const batch = db.batch();
        oldInterestsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`🧹 Cleaned up ${oldInterestsSnapshot.size} old interests`);
      }
      
      return {
        alertsDeleted: oldAlertsSnapshot.size,
        interestsDeleted: oldInterestsSnapshot.size
      };
    } catch (error) {
      console.error('Failed to cleanup old alerts:', error);
      throw error;
    }
  }

  // Get user alerts for homepage feed
  async getUserAlerts(userId, limit = 10) {
    try {
      const alertsSnapshot = await db.collection('product_alerts')
        .where('userId', '==', userId)
        .where('delivered', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const alerts = [];
      alertsSnapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() });
      });
      
      return alerts;
    } catch (error) {
      console.error('Failed to get user alerts:', error);
      return [];
    }
  }

  // Mark alert as delivered
  async markAlertAsDelivered(alertId) {
    try {
      await db.collection('product_alerts').doc(alertId).update({
        delivered: true,
        deliveredAt: new Date()
      });
      
      console.log(`✅ Marked alert ${alertId} as delivered`);
    } catch (error) {
      console.error('Failed to mark alert as delivered:', error);
      throw error;
    }
  }

  // Mark alert as read
  async markAlertAsRead(alertId) {
    try {
      await db.collection('product_alerts').doc(alertId).update({
        read: true,
        readAt: new Date()
      });
      
      console.log(`👁️ Marked alert ${alertId} as read`);
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      throw error;
    }
  }

  // Get availability monitoring statistics
  async getAvailabilityStats() {
    try {
      const [alertsSnapshot, interestsSnapshot, statesSnapshot] = await Promise.all([
        db.collection('product_alerts').get(),
        db.collection('product_interests').where('active', '==', true).get(),
        db.collection('product_availability_states').get()
      ]);
      
      // Count alerts by type
      const alertsByType = {};
      alertsSnapshot.forEach(doc => {
        const alert = doc.data();
        alertsByType[alert.alertType] = (alertsByType[alert.alertType] || 0) + 1;
      });
      
      return {
        totalAlerts: alertsSnapshot.size,
        activeInterests: interestsSnapshot.size,
        monitoredProducts: statesSnapshot.size,
        alertsByType,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get availability stats:', error);
      return {
        totalAlerts: 0,
        activeInterests: 0,
        monitoredProducts: 0,
        alertsByType: {},
        error: error.message
      };
    }
  }

  // Calculate alert priority
  calculateAlertPriority(availabilityChange, originalSearchQuery) {
    let priority = 'medium';
    
    // High priority for back in stock
    if (availabilityChange.changeType === 'back_in_stock') {
      priority = 'high';
    }
    
    // High priority for price drops
    if (availabilityChange.changeType === 'price_change' && 
        availabilityChange.currentPrice < availabilityChange.previousPrice) {
      priority = 'high';
    }
    
    // Medium priority for restocks
    if (availabilityChange.changeType === 'restocked') {
      priority = 'medium';
    }
    
    return priority;
  }

  // Get user alerts for homepage feed
  async getUserAlerts(userId, limit = 5) {
    try {
      const alertsSnapshot = await db.collection('product_alerts')
        .where('userId', '==', userId)
        .where('delivered', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const alerts = [];
      alertsSnapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() });
      });
      
      return alerts;
    } catch (error) {
      console.error('Failed to get user alerts:', error);
      return [];
    }
  }

  // Mark alert as delivered
  async markAlertAsDelivered(alertId) {
    try {
      await db.collection('product_alerts').doc(alertId).update({
        delivered: true,
        deliveredAt: new Date()
      });
      
      console.log(`✅ Marked alert ${alertId} as delivered`);
    } catch (error) {
      console.error('Failed to mark alert as delivered:', error);
      throw error;
    }
  }

  // Clean up old alerts and interests
  async cleanupOldAlerts(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Clean up old delivered alerts
      const oldAlertsSnapshot = await db.collection('product_alerts')
        .where('delivered', '==', true)
        .where('deliveredAt', '<', cutoffDate)
        .get();
      
      const batch = db.batch();
      oldAlertsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Clean up old notified interests
      const oldInterestsSnapshot = await db.collection('product_interests')
        .where('notified', '==', true)
        .where('notifiedAt', '<', cutoffDate)
        .get();
      
      oldInterestsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`🧹 Cleaned up ${oldAlertsSnapshot.size} old alerts and ${oldInterestsSnapshot.size} old interests`);
    } catch (error) {
      console.error('Failed to cleanup old alerts:', error);
      throw error;
    }
  }
}

module.exports = new PersonalizedShoppingService();