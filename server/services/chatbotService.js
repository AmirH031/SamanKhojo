/**
 * Saman Khojo AI Chatbot Service
 * Integrates NLU with database to provide real shop and product information
 */

const conversationalAI = require('./conversationalAI');
const { db } = require('../firebaseAdmin');

class ChatbotService {
  constructor() {
    this.searchCache = new Map();
    this.CACHE_TTL = 1000 * 60 * 10; // 10 minutes
  }

  // Simple query understanding without AI dependencies
  understandQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Search intent patterns
    if (/(search|find|look|where|shop|restaurant|service|place)/i.test(lowerMessage)) {
      return { intent: 'search', confidence: 0.8, item: this.extractSearchTerm(message) };
    }
    
    // Price query patterns
    if (/(price|cost|rate|charge|fee|expensive|cheap)/i.test(lowerMessage)) {
      return { intent: 'price_query', confidence: 0.7, item: this.extractSearchTerm(message) };
    }
    
    // Location query patterns
    if (/(location|address|where|near|nearby|direction)/i.test(lowerMessage)) {
      return { intent: 'location_query', confidence: 0.7, item: this.extractSearchTerm(message) };
    }
    
    // Greeting patterns
    if (/(hello|hi|hey|namaste|salam)/i.test(lowerMessage)) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    
    // Help patterns
    if (/(help|assist|support)/i.test(lowerMessage)) {
      return { intent: 'help', confidence: 0.8 };
    }
    
    return { intent: 'general', confidence: 0.5, item: this.extractSearchTerm(message) };
  }

  // Extract search term from message
  extractSearchTerm(message) {
    // Remove common words and extract the main search term
    const commonWords = ['find', 'search', 'look', 'for', 'where', 'is', 'are', 'the', 'a', 'an', 'i', 'want', 'need'];
    const words = message.toLowerCase().split(' ').filter(word => !commonWords.includes(word));
    return words.join(' ').trim() || message.trim();
  }

  // Main chatbot handler with intelligent conversation
  async handleMessage(message, userLocation = null, userId = 'anonymous') {
    try {
      // Step 1: Check for simple greetings first (fast response)
      const simpleResponse = this.handleSimpleQueries(message);
      if (simpleResponse) {
        return {
          ...simpleResponse,
          timestamp: new Date().toISOString(),
          messageId: this.generateMessageId()
        };
      }

      // Step 2: Check if it's a product/shop search query first
      const understanding = this.understandQuery(message);
      
      if (understanding && (understanding.intent === 'search' || understanding.intent === 'price_query' || understanding.intent === 'location_query')) {
        // This is a shopping query - prioritize database results
        const databaseResponse = await this.handleDatabaseSearch(understanding, userLocation, message);
        if (databaseResponse) {
          return databaseResponse;
        }
      }

      // Step 3: If no database results or not a shopping query, use conversational AI
      const context = {
        location: userLocation,
        timestamp: new Date().toISOString()
      };

      const aiResponse = await conversationalAI.handleConversation(message, userId, context);

      // Step 4: Return AI response with metadata
      return {
        type: aiResponse.type,
        message: aiResponse.message,
        intent: aiResponse.intent,
        suggestions: aiResponse.suggestions || [],
        confidence: aiResponse.confidence,
        learning: aiResponse.learning,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };

    } catch (error) {
      console.error('Chatbot error:', error);
      return this.createErrorResponse();
    }
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
      'can you help', 'i need', 'i want', 'tell me', 'show me', 'find me'
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

  // Get multilingual responses
  getMultilingualResponse(key, language) {
    const responses = {
      greeting: {
        english: 'Hello! I\'m Saman Khojo AI, your shopping assistant. How can I help you today? 🛒',
        hinglish: 'Namaste! Main Saman Khojo AI hun, aapka shopping assistant. Aaj main aapki kya madad kar sakta hun? 🛒',
        hindi: 'नमस्ते! मैं सामान खोजो AI हूँ, आपका शॉपिंग असिस्टेंट। आज मैं आपकी क्या मदद कर सकता हूँ? 🛒'
      },
      status: {
        english: 'I\'m doing great! Ready to help you find the best products and shops. What are you looking for? 😊',
        hinglish: 'Main bilkul theek hun! Aapke liye best products aur shops dhundne ke liye ready hun. Aap kya dhund rahe hain? 😊',
        hindi: 'मैं बिल्कुल ठीक हूँ! आपके लिए बेस्ट प्रोडक्ट्स और शॉप्स ढूंढने के लिए तैयार हूँ। आप क्या ढूंढ रहे हैं? 😊'
      },
      introduction: {
        english: 'I\'m Saman Khojo AI! 🤖 I help you find products, shops, prices, and services in your area. I understand English, Hindi, and Hinglish. What would you like to search for?',
        hinglish: 'Main Saman Khojo AI hun! 🤖 Main aapko products, shops, prices, aur services dhundne mein madad karta hun. Main English, Hindi, aur Hinglish samajh sakta hun. Aap kya search karna chahte hain?',
        hindi: 'मैं सामान खोजो AI हूँ! 🤖 मैं आपको प्रोडक्ट्स, शॉप्स, प्राइसेस, और सर्विसेस ढूंढने में मदद करता हूँ। मैं अंग्रेजी, हिंदी, और हिंग्लिश समझ सकता हूँ। आप क्या सर्च करना चाहते हैं?'
      },
      capabilities: {
        english: 'I can help you with:\n🛒 Find products and shops\n💰 Check prices and compare\n📍 Locate nearby stores\n🔍 Search by category\n💬 Chat in English, Hindi, or Hinglish\n\nWhat would you like to try?',
        hinglish: 'Main aapki ye madad kar sakta hun:\n🛒 Products aur shops dhundna\n💰 Prices check karna aur compare karna\n📍 Nearby stores locate karna\n🔍 Category ke hisab se search karna\n💬 English, Hindi, ya Hinglish mein baat karna\n\nAap kya try karna chahenge?',
        hindi: 'मैं आपकी ये मदद कर सकता हूँ:\n🛒 प्रोडक्ट्स और शॉप्स ढूंढना\n💰 प्राइसेस चेक करना और कम्पेयर करना\n📍 नजदीकी स्टोर्स लोकेट करना\n🔍 कैटेगरी के हिसाब से सर्च करना\n💬 अंग्रेजी, हिंदी, या हिंग्लिश में बात करना\n\nआप क्या ट्राई करना चाहेंगे?'
      }
    };

    return responses[key] ? responses[key][language] : responses[key]['english'];
  }

  // Get multilingual suggestions
  getMultilingualSuggestions(type, language) {
    const suggestions = {
      greeting: {
        english: ['Find products', 'Search shops', 'Check prices', 'Browse categories'],
        hinglish: ['Products dhundo', 'Shops search karo', 'Prices check karo', 'Categories browse karo'],
        hindi: ['प्रोडक्ट्स ढूंढें', 'शॉप्स सर्च करें', 'प्राइसेस चेक करें', 'कैटेगरीज ब्राउज़ करें']
      },
      status: {
        english: ['Find rice shops', 'Mobile repair', 'Pizza delivery', 'Grocery stores'],
        hinglish: ['Rice ki shops dhundo', 'Mobile repair', 'Pizza delivery', 'Grocery stores'],
        hindi: ['चावल की दुकानें', 'मोबाइल रिपेयर', 'पिज़्ज़ा डिलीवरी', 'किराना स्टोर']
      },
      introduction: {
        english: ['Find nearby shops', 'Search products', 'Compare prices', 'Get directions'],
        hinglish: ['Nearby shops dhundo', 'Products search karo', 'Prices compare karo', 'Directions lo'],
        hindi: ['नजदीकी दुकानें ढूंढें', 'प्रोडक्ट्स सर्च करें', 'प्राइसेस कम्पेयर करें', 'दिशा लें']
      },
      capabilities: {
        english: ['Find rice shops', 'Pizza price', 'Mobile repair near me', 'Browse categories'],
        hinglish: ['Rice shops dhundo', 'Pizza ka price', 'Mobile repair near me', 'Categories browse karo'],
        hindi: ['चावल की दुकानें', 'पिज़्ज़ा का प्राइस', 'मोबाइल रिपेयर नियर मी', 'कैटेगरीज ब्राउज़ करें']
      }
    };

    return suggestions[type] ? suggestions[type][language] : suggestions[type]['english'];
  }

  // Handle simple queries locally for fast response
  handleSimpleQueries(message) {
    const msg = message.toLowerCase().trim();
    const language = this.detectLanguage(message);
    
    // Greetings
    if (['hi', 'hello', 'hey', 'hii', 'hyy', 'namaste'].includes(msg)) {
      return {
        type: 'text',
        message: this.getMultilingualResponse('greeting', language),
        intent: 'greeting',
        suggestions: this.getMultilingualSuggestions('greeting', language)
      };
    }

    // Status questions
    if (msg.includes('how are you') || msg.includes('kaise ho') || msg.includes('kya haal')) {
      return {
        type: 'text',
        message: this.getMultilingualResponse('status', language),
        intent: 'greeting',
        suggestions: this.getMultilingualSuggestions('status', language)
      };
    }

    // Who are you
    if (msg.includes('who are you') || msg.includes('tum kaun ho') || msg.includes('tum kon ho')) {
      return {
        type: 'text',
        message: this.getMultilingualResponse('introduction', language),
        intent: 'introduction',
        suggestions: this.getMultilingualSuggestions('introduction', language)
      };
    }

    // What can you do
    if (msg.includes('what can you do') || msg.includes('kya kar sakte ho') || msg.includes('kya kya kar sakte ho')) {
      return {
        type: 'text',
        message: this.getMultilingualResponse('capabilities', language),
        intent: 'capabilities',
        suggestions: this.getMultilingualSuggestions('capabilities', language)
      };
    }

    // Check if it's a simple product search
    if (this.isSimpleProductQuery(message)) {
      return null; // Let it go to AI + database processing
    }

    return null; // Not a simple query, needs AI processing
  }

  // Check if message is a simple product query
  isSimpleProductQuery(message) {
    const msg = message.toLowerCase().trim();
    const productKeywords = [
      'rice', 'chawal', 'mobile', 'phone', 'pizza', 'food', 'medicine', 'dawa',
      'grocery', 'vegetables', 'sabzi', 'fruits', 'phal', 'bread', 'roti',
      'milk', 'doodh', 'oil', 'tel', 'sugar', 'cheeni', 'salt', 'namak'
    ];
    
    // If message is just a product name or contains product keywords
    return productKeywords.some(keyword => 
      msg === keyword || 
      msg.includes(keyword) && msg.split(' ').length <= 3
    );
  }

  // Enhance AI response with real database results
  async enhanceWithDatabaseResults(aiResponse, understanding, userLocation) {
    try {
      const { item, category, location } = understanding;
      
      // Search for real data
      const [items, shops] = await Promise.all([
        this.searchItems(item, category),
        this.searchShops(item, category)
      ]);

      // Create structured, attractive response with real data
      if (items.length > 0 || shops.length > 0) {
        return this.createStructuredResponse(aiResponse, items, shops, item, userLocation);
      } else {
        // No results found - provide helpful alternatives
        return this.createNoResultsResponse(item, category);
      }

    } catch (error) {
      console.error('Database enhancement error:', error);
      return aiResponse; // Return AI response without enhancement
    }
  }

  // Create structured, attractive response with real database data
  createStructuredResponse(aiResponse, items, shops, searchItem, userLocation) {
    const hasItems = items.length > 0;
    const hasShops = shops.length > 0;
    
    // Sort items by relevance and availability
    const sortedItems = items
      .filter(item => item.availability !== false)
      .sort((a, b) => {
        // Prioritize items with prices
        if (a.price && !b.price) return -1;
        if (!a.price && b.price) return 1;
        // Then by stock availability
        if (a.inStock > 0 && b.inStock <= 0) return -1;
        if (a.inStock <= 0 && b.inStock > 0) return 1;
        return 0;
      });

    // Sort shops by distance if location available
    let sortedShops = shops;
    if (userLocation) {
      sortedShops = shops
        .map(shop => ({
          ...shop,
          distance: shop.location ? this.calculateDistance(
            userLocation.lat, userLocation.lng,
            shop.location.lat, shop.location.lng
          ) : null
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Create attractive structured message
    let structuredMessage = `🎯 **Found Results for "${searchItem}"**\n\n`;

    if (hasItems && hasShops) {
      structuredMessage += `📦 **${sortedItems.length} Products Available** | 🏪 **${sortedShops.length} Shops Found**\n\n`;
      
      return {
        type: 'structured_mixed',
        message: structuredMessage,
        intent: aiResponse.intent,
        data: {
          summary: {
            searchTerm: searchItem,
            totalItems: sortedItems.length,
            totalShops: sortedShops.length,
            hasLocation: !!userLocation
          },
          items: sortedItems.slice(0, 6).map(this.formatItemStructured),
          shops: sortedShops.slice(0, 4).map(this.formatShopStructured),
          categories: this.groupItemsByCategory(sortedItems)
        },
        suggestions: [
          'Show more products',
          'Find nearest shops',
          'Compare prices',
          'Filter by brand'
        ],
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };
    } else if (hasItems) {
      const avgPrice = this.calculateAveragePrice(sortedItems);
      const priceRange = this.calculatePriceRange(sortedItems);
      
      structuredMessage += `📦 **${sortedItems.length} Products Found**\n`;
      if (priceRange.min && priceRange.max) {
        structuredMessage += `💰 **Price Range:** ₹${priceRange.min} - ₹${priceRange.max}\n\n`;
      }

      return {
        type: 'structured_items',
        message: structuredMessage,
        intent: aiResponse.intent,
        data: {
          summary: {
            searchTerm: searchItem,
            totalItems: sortedItems.length,
            priceRange: priceRange,
            averagePrice: avgPrice
          },
          items: sortedItems.slice(0, 8).map(this.formatItemStructured),
          categories: this.groupItemsByCategory(sortedItems),
          priceAnalysis: {
            cheapest: sortedItems.find(item => item.price),
            mostExpensive: sortedItems.reduce((max, item) => 
              (item.price > (max.price || 0)) ? item : max, {})
          }
        },
        suggestions: [
          'Show cheapest options',
          'Find premium brands',
          'Check availability',
          'Get shop locations'
        ],
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };
    } else if (hasShops) {
      structuredMessage += `🏪 **${sortedShops.length} Shops Found**\n`;
      if (userLocation) {
        const nearestShop = sortedShops[0];
        if (nearestShop.distance) {
          structuredMessage += `📍 **Nearest Shop:** ${nearestShop.distance.toFixed(1)} km away\n\n`;
        }
      }

      return {
        type: 'structured_shops',
        message: structuredMessage,
        intent: aiResponse.intent,
        data: {
          summary: {
            searchTerm: searchItem,
            totalShops: sortedShops.length,
            hasLocation: !!userLocation,
            nearestDistance: userLocation && sortedShops[0]?.distance
          },
          shops: sortedShops.slice(0, 6).map(this.formatShopStructured),
          shopTypes: this.groupShopsByType(sortedShops)
        },
        suggestions: [
          'Get directions',
          'Call shop',
          'Check shop items',
          'See shop hours'
        ],
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };
    }
  }

  // Create attractive no results response
  createNoResultsResponse(searchItem, category) {
    return {
      type: 'no_results',
      message: `🔍 **No Results Found for "${searchItem}"**\n\nDon't worry! Let me help you find alternatives:`,
      intent: 'search',
      data: {
        searchTerm: searchItem,
        category: category,
        alternatives: this.getSimilarItems(searchItem),
        popularItems: [
          'Basmati Rice', 'Mobile Phones', 'Pizza', 'Grocery Items', 
          'Medicine', 'Vegetables', 'Fruits', 'Bread'
        ]
      },
      suggestions: [
        'Try different spelling',
        'Browse categories',
        'Search similar items',
        'Find all shops'
      ],
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };
  }

  // Format item with structured data
  formatItemStructured = (item) => ({
    id: item.id,
    name: item.name,
    hindi_name: item.hindi_name,
    description: item.description,
    price: item.price,
    priceRange: item.priceRange,
    category: item.category,
    brand_name: item.brand_name,
    variety: item.variety,
    inStock: item.inStock,
    availability: item.availability !== false,
    imageUrl: item.imageUrl,
    rating: item.rating || 0,
    shop: {
      id: item.shopId,
      name: item.shop?.shopName,
      address: item.shop?.address,
      phone: item.shop?.phone,
      location: item.shop?.location,
      distance: item.shop?.distance
    },
    badges: this.generateItemBadges(item)
  });

  // Format shop with structured data
  formatShopStructured = (shop) => ({
    id: shop.id,
    name: shop.shopName,
    type: shop.type,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    location: shop.location,
    imageUrl: shop.imageUrl,
    averageRating: shop.averageRating || 0,
    distance: shop.distance,
    isOpen: this.checkShopOpenStatus(shop),
    badges: this.generateShopBadges(shop),
    specialties: shop.specialties || []
  });

  // Generate item badges (New, Sale, Popular, etc.)
  generateItemBadges(item) {
    const badges = [];
    
    if (item.inStock > 0) badges.push({ text: 'In Stock', color: 'green' });
    if (item.price && item.priceRange && item.price <= item.priceRange[0] * 1.1) {
      badges.push({ text: 'Best Price', color: 'orange' });
    }
    if (item.rating >= 4) badges.push({ text: 'Highly Rated', color: 'blue' });
    if (item.brand_name) badges.push({ text: 'Branded', color: 'purple' });
    
    return badges;
  }

  // Generate shop badges
  generateShopBadges(shop) {
    const badges = [];
    
    if (shop.averageRating >= 4) badges.push({ text: 'Top Rated', color: 'gold' });
    if (shop.distance && shop.distance <= 1) badges.push({ text: 'Nearby', color: 'green' });
    if (shop.type === 'grocery') badges.push({ text: 'Grocery', color: 'blue' });
    if (shop.phone) badges.push({ text: 'Call Available', color: 'teal' });
    
    return badges;
  }

  // Group items by category
  groupItemsByCategory(items) {
    const grouped = items.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return Object.keys(grouped).map(category => ({
      name: category,
      count: grouped[category].length,
      items: grouped[category].slice(0, 3) // Show top 3 per category
    }));
  }

  // Group shops by type
  groupShopsByType(shops) {
    const grouped = shops.reduce((acc, shop) => {
      const type = shop.type || 'General';
      if (!acc[type]) acc[type] = [];
      acc[type].push(shop);
      return acc;
    }, {});

    return Object.keys(grouped).map(type => ({
      name: type,
      count: grouped[type].length,
      shops: grouped[type].slice(0, 2)
    }));
  }

  // Calculate price range
  calculatePriceRange(items) {
    const prices = items
      .map(item => item.priceRange ? item.priceRange[0] : item.price)
      .filter(price => price && price > 0);
    
    if (prices.length === 0) return { min: null, max: null };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  // Calculate average price
  calculateAveragePrice(items) {
    const prices = items
      .map(item => item.priceRange ? item.priceRange[0] : item.price)
      .filter(price => price && price > 0);
    
    if (prices.length === 0) return null;
    
    return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  }

  // Get similar items for suggestions
  getSimilarItems(searchItem) {
    const similarities = {
      'rice': ['Basmati Rice', 'Brown Rice', 'Jasmine Rice', 'Sona Masuri'],
      'mobile': ['Smartphones', 'Phone Accessories', 'Mobile Covers', 'Chargers'],
      'pizza': ['Fast Food', 'Italian Food', 'Restaurants', 'Food Delivery'],
      'medicine': ['Pharmacy', 'Health Products', 'First Aid', 'Supplements']
    };

    const key = Object.keys(similarities).find(k => 
      searchItem.toLowerCase().includes(k)
    );
    
    return similarities[key] || ['Popular Items', 'Trending Products', 'Best Sellers'];
  }

  // Handle database search with priority over AI responses
  async handleDatabaseSearch(understanding, userLocation, originalMessage) {
    try {
      const { item, category, intent } = understanding;
      
      // Enhanced search with multiple strategies - PRIORITIZE REAL RESULTS
      let searchResults = [];
      
      // Strategy 1: Direct item name search
      const directResults = await this.searchItems(item, category);
      searchResults = [...searchResults, ...directResults];
      
      // Strategy 2: Shop search - ALWAYS include shops for any product query
      const shopResults = await this.searchShops(item, category);
      searchResults = [...searchResults, ...shopResults];
      
      // Strategy 3: Fuzzy search for partial matches
      if (searchResults.length < 3) {
        const fuzzyResults = await this.fuzzySearchItems(item);
        searchResults = [...searchResults, ...fuzzyResults];
      }
      
      // Strategy 4: Category-based search if still no results
      if (searchResults.length === 0 && category) {
        const categoryResults = await this.searchByCategory(category);
        searchResults = [...searchResults, ...categoryResults];
      }

      // If we found real data, create structured response immediately
      if (directResults.length > 0 || shopResults.length > 0) {
        return this.createDirectSearchResponse(directResults, shopResults, item, userLocation, intent);
      }

      return null; // No database results found
    } catch (error) {
      console.error('Database search error:', error);
      return null;
    }
  }

  // Create direct search response (integrated items with shop info)
  createDirectSearchResponse(items, shops, searchItem, userLocation, intent) {
    const hasItems = items.length > 0;
    const hasShops = shops.length > 0;
    
    // Detect search category
    const searchCategory = this.detectSearchCategory(searchItem);
    
    // Sort items by relevance and availability
    const sortedItems = items
      .filter(item => item.availability !== false)
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase().includes(searchItem.toLowerCase());
        const bExact = b.name.toLowerCase().includes(searchItem.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by stock and price availability
        if (a.inStock > 0 && b.inStock <= 0) return -1;
        if (a.inStock <= 0 && b.inStock > 0) return 1;
        if (a.price && !b.price) return -1;
        if (!a.price && b.price) return 1;
        return 0;
      });

    // Sort shops by distance and relevance
    let sortedShops = shops;
    if (userLocation) {
      sortedShops = shops
        .map(shop => ({
          ...shop,
          distance: shop.location ? this.calculateDistance(
            userLocation.lat, userLocation.lng,
            shop.location.lat, shop.location.lng
          ) : null
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Create integrated response based on search category
    let message = '';
    let responseType = '';
    let responseData = {};

    if (hasItems) {
      // Always show items with integrated shop info - no separate shop section
      const priceRange = this.calculatePriceRange(sortedItems);
      message = this.getCategoryMessage(searchCategory, searchItem, sortedItems.length);
      
      responseType = 'integrated_results';
      responseData = {
        query: searchItem,
        category: searchCategory,
        totalItems: sortedItems.length,
        priceRange: priceRange,
        items: sortedItems.slice(0, 6).map(this.formatItemIntegrated), // Integrated format with shop info
        showMoreLink: sortedItems.length > 6
      };
    } else if (hasShops) {
      // Only shops found
      message = this.getCategoryMessage(searchCategory, searchItem, 0, sortedShops.length);
      responseType = 'shops_only_results';
      responseData = {
        query: searchItem,
        category: searchCategory,
        totalShops: sortedShops.length,
        shops: sortedShops.slice(0, 4).map(this.formatShopIntegrated),
        showMoreLink: sortedShops.length > 4
      };
    }

    return {
      type: responseType,
      message: message,
      intent: 'search_results',
      data: responseData,
      suggestions: this.generateCategorySuggestions(searchCategory, searchItem),
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };
  }

  // Detect what category user is searching for
  detectSearchCategory(searchItem) {
    const item = searchItem.toLowerCase();
    
    // Food items
    if (item.includes('rice') || item.includes('chawal') || item.includes('pizza') || 
        item.includes('food') || item.includes('restaurant') || item.includes('cafe') ||
        item.includes('bread') || item.includes('milk') || item.includes('vegetables') ||
        item.includes('fruits') || item.includes('grocery')) {
      return 'food';
    }
    
    // Products/Electronics
    if (item.includes('mobile') || item.includes('phone') || item.includes('laptop') ||
        item.includes('electronics') || item.includes('gadget') || item.includes('computer')) {
      return 'product';
    }
    
    // Services
    if (item.includes('repair') || item.includes('service') || item.includes('doctor') ||
        item.includes('clinic') || item.includes('hospital') || item.includes('salon') ||
        item.includes('spa') || item.includes('cleaning')) {
      return 'service';
    }
    
    // Offices/Professional
    if (item.includes('office') || item.includes('bank') || item.includes('atm') ||
        item.includes('lawyer') || item.includes('consultant') || item.includes('agency')) {
      return 'office';
    }
    
    // Shops/Stores
    if (item.includes('shop') || item.includes('store') || item.includes('market') ||
        item.includes('mall') || item.includes('showroom')) {
      return 'shop';
    }
    
    // Default to product for general searches
    return 'product';
  }

  // Get category-specific message
  getCategoryMessage(category, searchItem, itemCount, shopCount = 0) {
    const categoryEmojis = {
      food: '🍽️',
      product: '🛍️', 
      service: '🔧',
      office: '🏢',
      shop: '🏪'
    };
    
    const emoji = categoryEmojis[category] || '🔍';
    
    if (itemCount > 0) {
      return `${emoji} **${itemCount} ${category === 'food' ? 'Food Items' : 
                                      category === 'product' ? 'Products' :
                                      category === 'service' ? 'Services' :
                                      category === 'office' ? 'Offices' : 'Items'} Found**`;
    } else if (shopCount > 0) {
      return `${emoji} **${shopCount} ${category === 'food' ? 'Restaurants/Food Shops' :
                                       category === 'service' ? 'Service Providers' :
                                       category === 'office' ? 'Offices' : 'Shops'} Found**`;
    }
    
    return `${emoji} **Search Results for "${searchItem}"**`;
  }

  // Format item with integrated shop information (no separate shop section)
  formatItemIntegrated = (item) => ({
    id: item.id,
    name: item.name,
    hindi_name: item.hindi_name,
    description: item.description ? item.description.substring(0, 80) + '...' : null, // Partial description
    price: item.price,
    priceRange: item.priceRange,
    category: item.category,
    brand_name: item.brand_name,
    inStock: item.inStock,
    availability: item.availability !== false,
    imageUrl: item.imageUrl,
    // Integrated shop info (no phone numbers)
    shopInfo: {
      name: item.shop?.shopName || 'Shop Name',
      address: item.shop?.address || 'Address not available',
      location: item.shop?.location,
      distance: item.shop?.distance,
      type: item.shop?.type
    },
    badges: this.generateItemBadges(item),
    showMoreInfo: true // Flag to show "Visit Site" link
  });

  // Format shop with partial info to encourage site visits
  formatShopIntegrated = (shop) => ({
    id: shop.id,
    name: shop.shopName,
    type: shop.type,
    address: shop.address,
    location: shop.location,
    distance: shop.distance,
    averageRating: shop.averageRating || 0,
    // Partial description to encourage site visit
    description: shop.description ? shop.description.substring(0, 60) + '...' : null,
    badges: this.generateShopBadges(shop),
    showMoreInfo: true
  });

  // Generate category-specific suggestions
  generateCategorySuggestions(category, searchItem) {
    const suggestions = {
      food: ['View menu', 'Check prices', 'Get directions', 'See more restaurants'],
      product: ['Compare prices', 'Check availability', 'View details', 'Find more products'],
      service: ['Get contact info', 'Check reviews', 'Book appointment', 'Find more services'],
      office: ['Get directions', 'Check timings', 'Contact info', 'Find nearby offices'],
      shop: ['View products', 'Get directions', 'Check timings', 'Find similar shops']
    };
    
    return suggestions[category] || ['View details', 'Get directions', 'Check prices', 'Find more'];
  }

  // Format item for search results (more detailed)
  formatItemForSearch = (item) => ({
    id: item.id,
    name: item.name,
    hindi_name: item.hindi_name,
    description: item.description,
    price: item.price,
    priceRange: item.priceRange,
    category: item.category,
    brand_name: item.brand_name,
    variety: item.variety,
    inStock: item.inStock,
    availability: item.availability !== false,
    imageUrl: item.imageUrl,
    shop: {
      id: item.shopId,
      name: item.shop?.shopName,
      address: item.shop?.address,
      phone: item.shop?.phone,
      location: item.shop?.location,
      type: item.shop?.type
    },
    badges: this.generateItemBadges(item),
    relevanceScore: this.calculateItemRelevance(item)
  });

  // Format shop for search results (more detailed)
  formatShopForSearch = (shop) => ({
    id: shop.id,
    name: shop.shopName,
    type: shop.type,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    location: shop.location,
    imageUrl: shop.imageUrl,
    averageRating: shop.averageRating || 0,
    distance: shop.distance,
    isOpen: this.checkShopOpenStatus(shop),
    badges: this.generateShopBadges(shop),
    specialties: shop.specialties || [],
    itemCount: shop.itemCount || 0
  });

  // Generate search-specific suggestions
  generateSearchSuggestions(searchItem, hasItems, hasShops) {
    const suggestions = [];
    
    if (hasItems) {
      suggestions.push('Show more products', 'Compare prices', 'Filter by brand');
    }
    
    if (hasShops) {
      suggestions.push('Get directions', 'Call shops', 'Check shop hours');
    }
    
    // Add related search suggestions
    const relatedSearches = this.getRelatedSearches(searchItem);
    suggestions.push(...relatedSearches.slice(0, 2));
    
    return suggestions;
  }

  // Get related search suggestions
  getRelatedSearches(searchItem) {
    const item = searchItem.toLowerCase();
    
    if (item.includes('rice') || item.includes('basmati')) {
      return ['Brown rice', 'Jasmine rice', 'Rice cookers', 'Grocery stores'];
    }
    
    if (item.includes('mobile') || item.includes('phone')) {
      return ['Mobile accessories', 'Phone covers', 'Mobile repair', 'Electronics stores'];
    }
    
    if (item.includes('pizza')) {
      return ['Italian restaurants', 'Fast food', 'Food delivery', 'Restaurants near me'];
    }
    
    return ['Popular products', 'Nearby shops', 'Best deals', 'Top rated'];
  }

  // Calculate item relevance score
  calculateItemRelevance(item) {
    let score = 0;
    
    // Base score for availability
    if (item.availability !== false) score += 10;
    if (item.inStock > 0) score += 10;
    
    // Price availability
    if (item.price || item.priceRange) score += 5;
    
    // Brand recognition
    if (item.brand_name) score += 3;
    
    // Shop quality
    if (item.shop?.averageRating >= 4) score += 5;
    
    return score;
  }

  // Check if shop is currently open (placeholder)
  checkShopOpenStatus(shop) {
    // This would check against shop hours if available
    // For now, return true as placeholder
    return true;
  }

  // Handle small talk
  handleSmallTalk(understanding) {
    return {
      type: 'text',
      message: understanding.reply,
      intent: 'small_talk'
    };
  }

  // Handle search queries
  async handleSearch(understanding, userLocation) {
    const { item, category, location } = understanding;
    
    try {
      // Search for items and shops
      const [items, shops] = await Promise.all([
        this.searchItems(item, category),
        this.searchShops(item, category)
      ]);

      // Filter by location if specified
      let filteredResults = { items, shops };
      if (location && location !== 'near user' && userLocation) {
        filteredResults = this.filterByLocation([...items, ...shops], userLocation);
      }

      // Determine what type of results to show
      if (items.length > 0 && shops.length > 0) {
        return this.createMixedResults(understanding, items, shops);
      } else if (items.length > 0) {
        return this.createItemResults(understanding, items);
      } else if (shops.length > 0) {
        return this.createShopResults(understanding, shops);
      } else {
        return this.createNoResults(understanding);
      }
    } catch (error) {
      console.error('Search error:', error);
      return this.createErrorResponse();
    }
  }

  // Handle price queries
  async handlePriceQuery(understanding, userLocation) {
    const { item, category } = understanding;
    
    try {
      const items = await this.searchItems(item, category);
      
      if (items.length > 0) {
        return this.createPriceResults(understanding, items);
      } else {
        return {
          type: 'text',
          message: `Sorry, I couldn't find price information for "${item}". Try searching for similar products or check nearby shops.`,
          intent: 'price_query',
          suggestions: ['Search shops', 'Browse categories', 'Try different item']
        };
      }
    } catch (error) {
      console.error('Price query error:', error);
      return this.createErrorResponse();
    }
  }

  // Handle location queries
  async handleLocationQuery(understanding, userLocation) {
    const { item, category } = understanding;
    
    try {
      const shops = await this.searchShops(item, category);
      
      if (shops.length > 0) {
        return this.createLocationResults(understanding, shops, userLocation);
      } else {
        return {
          type: 'text',
          message: `I couldn't find shops for "${item}" in your area. Try browsing all shops or searching for similar items.`,
          intent: 'location_query',
          suggestions: ['Browse all shops', 'Search similar items', 'Try different location']
        };
      }
    } catch (error) {
      console.error('Location query error:', error);
      return this.createErrorResponse();
    }
  }

  // Handle unknown queries
  handleUnknown(understanding) {
    return {
      type: 'text',
      message: understanding.reply || "Sorry, I didn't understand that. Try asking about products, shops, or prices!",
      intent: 'unknown',
      suggestions: [
        'Find rice shops',
        'Mobile repair near me',
        'Pizza price',
        'Browse categories'
      ]
    };
  }

  // Search items in database with enhanced matching
  async searchItems(query, category = null) {
    try {
      // First try direct collection, fallback to collection group
      let itemsQuery;
      try {
        itemsQuery = db.collection('items');
      } catch (error) {
        console.log('Trying collection group for items...');
        itemsQuery = db.collectionGroup('items');
      }
      
      if (category) {
        itemsQuery = itemsQuery.where('category', '==', category);
      }

      const snapshot = await itemsQuery.get();
      const allItems = snapshot.docs.map(doc => {
        const pathParts = doc.ref.path.split('/');
        const shopId = pathParts[1];
        
        return {
          id: doc.id,
          shopId,
          ...doc.data()
        };
      });

      // Enhanced filtering with fuzzy matching
      const queryLower = query.toLowerCase();
      const filteredItems = allItems.filter(item => {
        // Exact matches get priority
        if (item.name && item.name.toLowerCase() === queryLower) return true;
        if (item.hindi_name && item.hindi_name.toLowerCase() === queryLower) return true;
        
        // Partial matches
        return (
          (item.name && item.name.toLowerCase().includes(queryLower)) ||
          (item.hindi_name && item.hindi_name.toLowerCase().includes(queryLower)) ||
          (item.description && item.description.toLowerCase().includes(queryLower)) ||
          (item.category && item.category.toLowerCase().includes(queryLower)) ||
          (item.brand_name && item.brand_name.toLowerCase().includes(queryLower)) ||
          (item.variety && Array.isArray(item.variety) && 
           item.variety.some(v => v.toLowerCase().includes(queryLower))) ||
          (item.variety && typeof item.variety === 'string' && 
           item.variety.toLowerCase().includes(queryLower)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower))) ||
          (item.packs && Array.isArray(item.packs) && 
           item.packs.some(pack => pack.toLowerCase().includes(queryLower)))
        );
      });

      // Sort by relevance (exact matches first, then by availability)
      const sortedItems = filteredItems.sort((a, b) => {
        // Exact name match gets highest priority
        const aExact = a.name && a.name.toLowerCase() === queryLower;
        const bExact = b.name && b.name.toLowerCase() === queryLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by availability
        const aAvailable = a.availability !== false && a.inStock > 0;
        const bAvailable = b.availability !== false && b.inStock > 0;
        if (aAvailable && !bAvailable) return -1;
        if (!aAvailable && bAvailable) return 1;
        
        // Then by having price
        if (a.price && !b.price) return -1;
        if (!a.price && b.price) return 1;
        
        return 0;
      });

      // Get shop details for each item (limit to top 15 for performance)
      const itemsWithShops = await Promise.all(
        sortedItems.slice(0, 15).map(async (item) => {
          try {
            const shopDoc = await db.collection('shops').doc(item.shopId).get();
            const shop = shopDoc.exists ? shopDoc.data() : null;
            return { ...item, shop };
          } catch (error) {
            console.error('Error fetching shop for item:', error);
            return { ...item, shop: null };
          }
        })
      );

      return itemsWithShops.filter(item => item.shop); // Only return items with valid shops
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  }

  // Search shops in database with enhanced matching
  async searchShops(query, category = null) {
    try {
      const shopsSnapshot = await db.collection('shops').get();
      let shops = shopsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Enhanced filtering
      const queryLower = query.toLowerCase();
      const filteredShops = shops.filter(shop => {
        // Direct matches
        if (shop.shopName && shop.shopName.toLowerCase().includes(queryLower)) return true;
        if (shop.type && shop.type.toLowerCase().includes(queryLower)) return true;
        if (shop.description && shop.description.toLowerCase().includes(queryLower)) return true;
        if (shop.address && shop.address.toLowerCase().includes(queryLower)) return true;
        
        // Category-based matching
        if (category && shop.type && shop.type.toLowerCase().includes(category.toLowerCase())) return true;
        
        // Product-specific shop matching
        if (queryLower.includes('rice') || queryLower.includes('chawal')) {
          return shop.type && (
            shop.type.toLowerCase().includes('grocery') ||
            shop.type.toLowerCase().includes('kirana') ||
            shop.type.toLowerCase().includes('food')
          );
        }
        
        if (queryLower.includes('mobile') || queryLower.includes('phone')) {
          return shop.type && (
            shop.type.toLowerCase().includes('electronics') ||
            shop.type.toLowerCase().includes('mobile') ||
            shop.type.toLowerCase().includes('repair')
          );
        }
        
        if (queryLower.includes('medicine') || queryLower.includes('dawa')) {
          return shop.type && (
            shop.type.toLowerCase().includes('pharmacy') ||
            shop.type.toLowerCase().includes('medical') ||
            shop.type.toLowerCase().includes('health')
          );
        }
        
        if (queryLower.includes('pizza') || queryLower.includes('food')) {
          return shop.type && (
            shop.type.toLowerCase().includes('restaurant') ||
            shop.type.toLowerCase().includes('food') ||
            shop.type.toLowerCase().includes('cafe')
          );
        }
        
        return false;
      });

      // Sort by relevance
      const sortedShops = filteredShops.sort((a, b) => {
        // Exact shop name match gets priority
        const aNameMatch = a.shopName && a.shopName.toLowerCase().includes(queryLower);
        const bNameMatch = b.shopName && b.shopName.toLowerCase().includes(queryLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then by rating
        const aRating = a.averageRating || 0;
        const bRating = b.averageRating || 0;
        return bRating - aRating;
      });

      return sortedShops.slice(0, 12);
    } catch (error) {
      console.error('Error searching shops:', error);
      return [];
    }
  }

  // Fuzzy search for items with partial matching
  async fuzzySearchItems(itemName) {
    if (!itemName) return [];
    
    try {
      // Try direct collection first, fallback to collection group
      let itemsQuery;
      try {
        itemsQuery = db.collection('items');
      } catch (error) {
        console.log('Using collection group for fuzzy search...');
        itemsQuery = db.collectionGroup('items');
      }
      
      const snapshot = await itemsQuery.limit(200).get();
      
      const searchTerm = itemName.toLowerCase();
      const allItems = snapshot.docs.map(doc => {
        const pathParts = doc.ref.path.split('/');
        const shopId = pathParts[1];
        return {
          id: doc.id,
          shopId,
          ...doc.data()
        };
      });
      
      const results = allItems
        .filter(item => {
          const name = (item.name || '').toLowerCase();
          const hindi = (item.hindi_name || '').toLowerCase();
          const category = (item.category || '').toLowerCase();
          const brand = (item.brand_name || '').toLowerCase();
          
          // Check for partial matches in any field
          return name.includes(searchTerm) || 
                 hindi.includes(searchTerm) ||
                 category.includes(searchTerm) ||
                 brand.includes(searchTerm) ||
                 this.calculateSimilarity(name, searchTerm) > 0.6;
        })
        .sort((a, b) => {
          // Sort by relevance score
          const scoreA = this.calculateRelevanceScore(a, searchTerm);
          const scoreB = this.calculateRelevanceScore(b, searchTerm);
          return scoreB - scoreA;
        });

      return results.slice(0, 10);
    } catch (error) {
      console.error('Error in fuzzy search:', error);
      return [];
    }
  }

  // Search by category
  async searchByCategory(category) {
    if (!category) return [];
    
    try {
      // Try direct collection first
      let itemsQuery;
      try {
        itemsQuery = db.collection('items');
      } catch (error) {
        console.log('Using collection group for category search...');
        itemsQuery = db.collectionGroup('items');
      }
      
      const snapshot = await itemsQuery.get();
      
      const categoryResults = snapshot.docs
        .map(doc => {
          const pathParts = doc.ref.path.split('/');
          const shopId = pathParts[1];
          return {
            id: doc.id,
            shopId,
            ...doc.data()
          };
        })
        .filter(item => 
          (item.category || '').toLowerCase().includes(category.toLowerCase())
        );

      return categoryResults.slice(0, 15);
    } catch (error) {
      console.error('Error searching by category:', error);
      return [];
    }
  }

  // Calculate string similarity (simple Levenshtein-based)
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Simple Levenshtein distance calculation
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate relevance score for search results
  calculateRelevanceScore(item, searchTerm) {
    let score = 0;
    const name = (item.name || '').toLowerCase();
    const hindi = (item.hindi_name || '').toLowerCase();
    
    // Exact match gets highest score
    if (name === searchTerm) score += 100;
    if (hindi === searchTerm) score += 100;
    
    // Starts with search term
    if (name.startsWith(searchTerm)) score += 50;
    if (hindi.startsWith(searchTerm)) score += 50;
    
    // Contains search term
    if (name.includes(searchTerm)) score += 25;
    if (hindi.includes(searchTerm)) score += 25;
    
    // Brand match
    if ((item.brand_name || '').toLowerCase().includes(searchTerm)) score += 15;
    
    // Category match
    if ((item.category || '').toLowerCase().includes(searchTerm)) score += 10;
    
    // Availability bonus
    if (item.inStock > 0) score += 5;
    if (item.price) score += 3;
    
    return score;
  }

  // Create mixed results (items + shops)
  createMixedResults(understanding, items, shops) {
    const { item } = understanding;
    
    return {
      type: 'mixed',
      message: `Found ${items.length} products and ${shops.length} shops for "${item}"`,
      intent: 'search',
      data: {
        items: items.slice(0, 5).map(this.formatItem),
        shops: shops.slice(0, 3).map(this.formatShop)
      },
      suggestions: ['Show more items', 'Show more shops', 'Filter by location']
    };
  }

  // Create item-only results
  createItemResults(understanding, items) {
    const { item } = understanding;
    
    return {
      type: 'items',
      message: `Found ${items.length} products for "${item}"`,
      intent: 'search',
      data: {
        items: items.slice(0, 8).map(this.formatItem)
      },
      suggestions: ['Show prices', 'Find shops', 'Similar items']
    };
  }

  // Create shop-only results
  createShopResults(understanding, shops) {
    const { item } = understanding;
    
    return {
      type: 'shops',
      message: `Found ${shops.length} shops for "${item}"`,
      intent: 'search',
      data: {
        shops: shops.slice(0, 6).map(this.formatShop)
      },
      suggestions: ['Show items', 'Get directions', 'Call shop']
    };
  }

  // Create price results
  createPriceResults(understanding, items) {
    const { item } = understanding;
    const priceItems = items.filter(item => item.price || item.priceRange);
    
    if (priceItems.length === 0) {
      return {
        type: 'text',
        message: `Found products for "${item}" but no price information available. Contact shops directly for pricing.`,
        intent: 'price_query',
        data: { items: items.slice(0, 5).map(this.formatItem) }
      };
    }

    const minPrice = Math.min(...priceItems.map(item => 
      item.priceRange ? item.priceRange[0] : item.price
    ));
    const maxPrice = Math.max(...priceItems.map(item => 
      item.priceRange ? item.priceRange[1] : item.price
    ));

    return {
      type: 'price',
      message: `${item} prices range from ₹${minPrice} to ₹${maxPrice}`,
      intent: 'price_query',
      data: {
        priceRange: { min: minPrice, max: maxPrice },
        items: priceItems.slice(0, 6).map(this.formatItem)
      },
      suggestions: ['Compare prices', 'Find cheapest', 'Show shops']
    };
  }

  // Create location results
  createLocationResults(understanding, shops, userLocation) {
    const { item } = understanding;
    
    // Sort by distance if user location available
    if (userLocation) {
      shops = shops
        .map(shop => ({
          ...shop,
          distance: shop.location ? this.calculateDistance(
            userLocation.lat, userLocation.lng,
            shop.location.lat, shop.location.lng
          ) : null
        }))
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return {
      type: 'location',
      message: `Found ${shops.length} shops for "${item}" near you`,
      intent: 'location_query',
      data: {
        shops: shops.slice(0, 6).map(this.formatShop)
      },
      suggestions: ['Get directions', 'Call shop', 'Show items']
    };
  }

  // Create no results response
  createNoResults(understanding) {
    const { item } = understanding;
    
    return {
      type: 'text',
      message: `Sorry, I couldn't find "${item}" in our database. Try searching for similar items or browse categories.`,
      intent: 'search',
      suggestions: [
        'Browse all shops',
        'Popular items',
        'Search categories',
        'Try different spelling'
      ]
    };
  }

  // Create error response
  createErrorResponse() {
    return {
      type: 'text',
      message: 'I\'m having a small technical issue right now. Please try asking again, or let me help you with something else! 😊',
      intent: 'error',
      suggestions: ['Try again', 'Find products', 'Search shops', 'Browse categories'],
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId()
    };
  }

  // Format item for response
  formatItem = (item) => ({
    id: item.id,
    name: item.name,
    hindi_name: item.hindi_name,
    description: item.description,
    price: item.price,
    priceRange: item.priceRange,
    category: item.category,
    brand_name: item.brand_name,
    variety: item.variety,
    inStock: item.inStock,
    availability: item.availability,
    imageUrl: item.imageUrl,
    shop: {
      id: item.shopId,
      name: item.shop?.shopName,
      address: item.shop?.address,
      phone: item.shop?.phone,
      location: item.shop?.location
    }
  });

  // Format shop for response
  formatShop = (shop) => ({
    id: shop.id,
    name: shop.shopName,
    type: shop.type,
    description: shop.description,
    address: shop.address,
    phone: shop.phone,
    location: shop.location,
    imageUrl: shop.imageUrl,
    averageRating: shop.averageRating,
    distance: shop.distance
  });

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ChatbotService();