// server/routes/search.js
const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { createCacheMiddleware } = require('../middleware/cache');
const NodeCache = require('node-cache');

// Optimized search cache with better performance settings
const searchCache = new NodeCache({ 
  stdTTL: 180, // 3 minutes cache for better performance
  checkperiod: 60,
  useClones: false,
  maxKeys: 10000
});

const cacheMiddleware = (ttl) => createCacheMiddleware(
  searchCache, 
  (req) => `search:${req.path}:${JSON.stringify(req.query)}:${JSON.stringify(req.body)}`, 
  ttl
);

// In-memory cache for search data (consider Redis for production)
let searchData = {
  items: [],
  shops: [],
  menuItems: [],
  lastUpdated: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Preload search data with comprehensive menu items loading
const loadSearchData = async () => {
  if (searchData.lastUpdated && Date.now() - searchData.lastUpdated < CACHE_DURATION) {
    return searchData;
  }

  try {
    // Load all data in parallel (NEW STRUCTURE)
    const [shopsSnapshot, allItemsSnapshot] = await Promise.all([
      db.collection('shops').get(),
      db.collectionGroup('items').get() // Use collection group to get all items from all shops
    ]);

    const shops = shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get all items from shop subcollections
    const items = allItemsSnapshot.docs.map(doc => {
      // Extract shopId from document path: shops/{shopId}/items/{itemId}
      const pathParts = doc.ref.path.split('/');
      const shopId = pathParts[1];
      
      return {
        id: doc.id,
        shopId,
        ...doc.data()
      };
    });

    // Separate items by type for backward compatibility
    const menuItems = items.filter(item => item.type === 'menu');

    searchData = {
      items,
      shops,
      menuItems,
      lastUpdated: Date.now()
    };

    return searchData;
  } catch (error) {
    console.error('Error loading search data:', error);
    return { items: [], shops: [], menuItems: [], lastUpdated: Date.now() };
  }
};

// Enhanced search suggestions endpoint with better autocomplete
router.get('/suggestions', cacheMiddleware(30000), async (req, res) => { // 30 second cache for faster updates
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 1) {
      return res.json([]);
    }

    const data = await loadSearchData();
    const queryLower = query.toLowerCase().trim();
    const suggestionMap = new Map(); // Use Map to avoid duplicates and store metadata
    
    // Helper function to add suggestions with scoring
    const addSuggestion = (text, type, category = null, shopName = null) => {
      if (!text || text.length < 2) return;
      
      const score = calculateUniversalMatchScore(text, queryLower);
      if (score > 0.2) { // Lower threshold for suggestions
        const key = text.toLowerCase();
        if (!suggestionMap.has(key) || suggestionMap.get(key).score < score) {
          suggestionMap.set(key, {
            text: text.trim(),
            type,
            category,
            shopName,
            score
          });
        }
      }
    };
    
    // Process items with enhanced matching
    data.items.forEach(item => {
      const shop = data.shops.find(s => s.id === item.shopId);
      const shopName = shop ? shop.shopName : null;
      
      addSuggestion(item.name, 'item', item.category, shopName);
      if (item.hindi_name) addSuggestion(item.hindi_name, 'item', item.category, shopName);
      if (item.category) addSuggestion(item.category, 'category');
      if (item.brand_name) addSuggestion(item.brand_name, 'brand');
      if (item.variety) addSuggestion(item.variety, 'variety');
    });

    // Process menu items
    data.menuItems.forEach(menuItem => {
      const shop = data.shops.find(s => s.id === menuItem.shopId);
      const shopName = shop ? shop.shopName : null;
      
      addSuggestion(menuItem.name, 'menu', menuItem.category, shopName);
      if (menuItem.hindi_name) addSuggestion(menuItem.hindi_name, 'menu', menuItem.category, shopName);
      if (menuItem.category) addSuggestion(menuItem.category, 'category');
    });
    
    // Process shops, services, and offices
    data.shops.forEach(shop => {
      const suggestionType = shop.shopType === 'office' ? 'office' : 'shop';
      addSuggestion(shop.shopName, suggestionType, shop.type);
      if (shop.type) addSuggestion(shop.type, 'category');
      if (shop.ownerName) addSuggestion(shop.ownerName, suggestionType);
      if (shop.address) addSuggestion(shop.address, 'location');
      if (shop.description) addSuggestion(shop.description, suggestionType);
      
      // Add service suggestions
      if (shop.serviceDetails && Array.isArray(shop.serviceDetails)) {
        shop.serviceDetails.forEach(service => {
          addSuggestion(service.name, 'service', service.category, shop.shopName);
          if (service.description) addSuggestion(service.description, 'service', service.category, shop.shopName);
        });
      }
      
      // Add office suggestions
      if (shop.shopType === 'office' && shop.officeDetails) {
        if (shop.officeDetails.department) addSuggestion(shop.officeDetails.department, 'office', shop.officeDetails.facilityType, shop.shopName);
        if (shop.officeDetails.contactPerson) addSuggestion(shop.officeDetails.contactPerson, 'office', shop.officeDetails.facilityType, shop.shopName);
        if (shop.officeDetails.services) {
          shop.officeDetails.services.forEach(service => {
            addSuggestion(service, 'office', shop.officeDetails.facilityType, shop.shopName);
          });
        }
      }
    });
    
    // Add popular search terms and multilingual suggestions
    const popularTerms = [
      { text: 'rice चावल', type: 'item', category: 'Grocery' },
      { text: 'oil तेल', type: 'item', category: 'Grocery' },
      { text: 'milk दूध', type: 'item', category: 'Dairy' },
      { text: 'bread रोटी', type: 'item', category: 'Bakery' },
      { text: 'vegetables सब्जी', type: 'item', category: 'Fresh' },
      { text: 'fruits फल', type: 'item', category: 'Fresh' },
      { text: 'medicine दवा', type: 'item', category: 'Health' },
      { text: 'mobile repair', type: 'service', category: 'Electronics' },
      { text: 'haircut', type: 'service', category: 'Beauty' },
      { text: 'food delivery', type: 'menu', category: 'Food' },
      { text: 'grocery store', type: 'shop', category: 'Shopping' },
      { text: 'restaurant', type: 'shop', category: 'Food' },
      { text: 'pharmacy', type: 'shop', category: 'Health' },
      { text: 'government office सरकारी दफ्तर', type: 'office', category: 'Government' },
      { text: 'private office प्राइवेट दफ्तर', type: 'office', category: 'Private' },
      { text: 'bank बैंक', type: 'office', category: 'Financial' },
      { text: 'post office डाकघर', type: 'office', category: 'Government' },
      { text: 'near me', type: 'location' },
      // Reference ID examples for user guidance
      { text: 'PRD-MAN-001 (Product Reference)', type: 'item', category: 'Reference ID' },
      { text: 'SHP-MAN-001 (Shop Reference)', type: 'shop', category: 'Reference ID' },
      { text: 'SRV-MAN-001 (Service Reference)', type: 'service', category: 'Reference ID' }
    ];

    popularTerms.forEach(term => addSuggestion(term.text, term.type, term.category));

    // Convert to array and sort by score
    const suggestions = Array.from(suggestionMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ text, type, category, shopName }) => ({
        text,
        type,
        category,
        shopName
      }));

    res.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Universal search endpoint - searches across all categories
router.get('/universal', cacheMiddleware(60000), async (req, res) => { // 1 minute cache for search results
  try {
    const { q: query, lat, lng } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return res.json([]);
    }

    const queryLower = query.trim().toLowerCase();
    const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    
    const data = await loadSearchData();
    let results = []; // Fixed: Removed TypeScript syntax
    
    // Helper to add result with deduplication check
    const addResult = (result) => {
      // Simple dedup by id + type
      const key = `${result.type}-${result.id}`;
      if (!results.some(r => `${r.type}-${r.id}` === key)) {
        results.push(result);
      }
    };

    // Search Items & Products
    data.items.forEach(item => {
      let score = 0;
      
      // Check for reference ID match first (highest priority)
      if (item.referenceId && item.referenceId.toLowerCase().includes(queryLower)) {
        score = item.referenceId.toLowerCase() === queryLower ? 10 : 9;
      } else {
        // Regular text matching
        const searchableFields = [
          item.name, item.hindi_name, item.category, item.brand_name,
          item.variety, item.description, item.tags ? item.tags.join(' ') : ''
        ].filter(Boolean).join(' ').toLowerCase();
        
        score = calculateUniversalMatchScore(searchableFields, queryLower);
      }
      
      if (score > 0.2) { // Lowered threshold for more comprehensive results
        const shop = data.shops.find(s => s.id === item.shopId);
        if (shop) {
          addResult({
            id: item.id,
            referenceId: item.referenceId,
            type: item.type || 'item',
            name: item.name,
            hindi_name: item.hindi_name,
            description: item.description,
            shopId: item.shopId,
            shopName: shop.shopName,
            shopAddress: shop.address,
            shopPhone: shop.phone,
            price: item.price,
            matchScore: score,
            category: item.category,
            availability: item.availability !== false,
            inStock: item.inStock,
            imageUrl: item.imageUrl,
            location: shop.location,
            brand_name: item.brand_name,
            variety: item.variety,
            distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
          });
        }
      }
    });

    // Search Menu Items (Food)
    data.menuItems.forEach(menuItem => {
      const searchableFields = [
        menuItem.name, menuItem.hindi_name, menuItem.description,
        menuItem.category, menuItem.tags ? menuItem.tags.join(' ') : ''
      ].filter(Boolean).join(' ').toLowerCase();
      
      const score = calculateUniversalMatchScore(searchableFields, queryLower);
      if (score > 0.2) {
        const shop = data.shops.find(s => s.id === menuItem.shopId);
        if (shop) {
          addResult({
            id: menuItem.id,
            type: 'menu',
            name: menuItem.name,
            hindi_name: menuItem.hindi_name,
            description: menuItem.description,
            shopId: menuItem.shopId,
            shopName: shop.shopName,
            shopAddress: shop.address,
            shopPhone: shop.phone,
            price: menuItem.price,
            matchScore: score,
            category: menuItem.category,
            availability: menuItem.availability !== false,
            inStock: menuItem.inStock,
            imageUrl: menuItem.imageUrl,
            location: shop.location,
            distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
          });
        }
      }
    });

    // Search Service Items (from service-type shops)
    data.items.forEach(item => {
      if (item.type === 'service') {
        const searchableFields = [
          item.name, item.hindi_name, item.description,
          item.category, item.tags ? item.tags.join(' ') : '',
          item.highlights ? item.highlights.join(' ') : ''
        ].filter(Boolean).join(' ').toLowerCase();
        
        const score = calculateUniversalMatchScore(searchableFields, queryLower);
        if (score > 0.2) {
          const shop = data.shops.find(s => s.id === item.shopId);
          if (shop && shop.shopType === 'service') {
            addResult({
              id: item.id,
              type: 'service',
              name: item.name || 'Service',
              hindi_name: item.hindi_name,
              description: item.description,
              shopId: item.shopId,
              shopName: shop.shopName,
              shopAddress: shop.address,
              shopPhone: shop.phone,
              price: item.price,
              matchScore: score,
              category: item.category,
              availability: item.availability !== false,
              imageUrl: item.imageUrl || shop.imageUrl,
              location: shop.location,
              brand_name: item.brand_name,
              variety: item.variety,
              highlights: item.highlights,
              distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
            });
          }
        }
      }
    });

    // Search Shops
    data.shops.forEach(shop => {
      let score = 0;
      
      // Check for reference ID match first (highest priority)
      if (shop.referenceId && shop.referenceId.toLowerCase().includes(queryLower)) {
        score = shop.referenceId.toLowerCase() === queryLower ? 10 : 9;
      } else {
        // Regular text matching
        const serviceNames = shop.shopType === 'service' && shop.serviceDetails ? 
          (Array.isArray(shop.serviceDetails) ? 
            shop.serviceDetails.map(s => s.serviceName || s.name).join(' ') : 
            shop.serviceDetails.serviceName || '') : '';
        
        const officeNames = shop.shopType === 'office' && shop.officeDetails ? 
          [
            shop.officeDetails.department,
            shop.officeDetails.facilityType,
            shop.officeDetails.contactPerson,
            shop.officeDetails.description,
            shop.officeDetails.services ? shop.officeDetails.services.join(' ') : ''
          ].filter(Boolean).join(' ') : '';
        
        const searchableFields = [
          shop.shopName, shop.ownerName, shop.type, shop.address,
          shop.description, serviceNames, officeNames
        ].filter(Boolean).join(' ').toLowerCase();
        
        score = calculateUniversalMatchScore(searchableFields, queryLower);
      }
      
      if (score > 0.2) {
        const resultType = shop.shopType === 'office' ? 'office' : 'shop';
        addResult({
          id: shop.id,
          referenceId: shop.referenceId,
          type: resultType,
          name: shop.shopName,
          description: shop.description,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          matchScore: score,
          category: shop.type,
          shopType: shop.shopType,
          imageUrl: shop.imageUrl,
          location: shop.location,
          distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
        });
      }
    });

    // Sort results: exact match first (score 10), then relevance, then distance
    results.sort((a, b) => {
      // Exact match priority
      const aExact = (a.matchScore || 0) === 10;
      const bExact = (b.matchScore || 0) === 10;
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      
      // Relevance score
      if ((a.matchScore || 0) !== (b.matchScore || 0)) {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      
      // Distance (closer first)
      return (a.distance || Infinity) - (b.distance || Infinity);
    });

    // Limit to top 50 results
    const finalResults = results.slice(0, 50);
    
    res.json(finalResults);
  } catch (error) {
    console.error('Error performing universal search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// POST endpoint for search (used by load tests and frontend)
router.post('/', cacheMiddleware(180000), async (req, res) => { // 3 minute cache
  try {
    const { query, filters = {} } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return res.json([]);
    }

    // Use the same logic as universal search but with POST body
    const queryLower = query.trim().toLowerCase();
    const data = await loadSearchData();
    let results = [];
    
    // Helper to add result with deduplication check
    const addResult = (result) => {
      const key = `${result.type}-${result.id}`;
      if (!results.some(r => `${r.type}-${r.id}` === key)) {
        results.push(result);
      }
    };

    // Search Items & Products
    data.items.forEach(item => {
      // Apply filters if provided
      if (filters.category && item.category !== filters.category) return;
      if (filters.shopType && data.shops.find(s => s.id === item.shopId)?.shopType !== filters.shopType) return;
      
      const searchableFields = [
        item.name, item.hindi_name, item.category, item.brand_name,
        item.variety, item.description, item.tags ? item.tags.join(' ') : ''
      ].filter(Boolean).join(' ').toLowerCase();
      
      const score = calculateUniversalMatchScore(searchableFields, queryLower);
      if (score > 0.2) {
        const shop = data.shops.find(s => s.id === item.shopId);
        if (shop) {
          addResult({
            id: item.id,
            type: 'item',
            name: item.name,
            hindi_name: item.hindi_name,
            description: item.description,
            shopId: item.shopId,
            shopName: shop.shopName,
            shopAddress: shop.address,
            shopPhone: shop.phone,
            price: item.price,
            matchScore: score,
            category: item.category,
            availability: item.availability !== false,
            inStock: item.inStock,
            imageUrl: item.imageUrl,
            location: shop.location,
            brand_name: item.brand_name,
            variety: item.variety
          });
        }
      }
    });

    // Search Shops
    data.shops.forEach(shop => {
      // Apply filters if provided
      if (filters.shopType && shop.shopType !== filters.shopType) return;
      if (filters.category && shop.type !== filters.category) return;
      
      const officeNames = shop.shopType === 'office' && shop.officeDetails ? 
        [
          shop.officeDetails.department,
          shop.officeDetails.facilityType,
          shop.officeDetails.contactPerson,
          shop.officeDetails.description,
          shop.officeDetails.services ? shop.officeDetails.services.join(' ') : ''
        ].filter(Boolean).join(' ') : '';
      
      const searchableFields = [
        shop.shopName, shop.ownerName, shop.type, shop.address,
        shop.description, officeNames
      ].filter(Boolean).join(' ').toLowerCase();
      
      const score = calculateUniversalMatchScore(searchableFields, queryLower);
      if (score > 0.2) {
        const resultType = shop.shopType === 'office' ? 'office' : 'shop';
        addResult({
          id: shop.id,
          type: resultType,
          name: shop.shopName,
          description: shop.description,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          matchScore: score,
          category: shop.type,
          shopType: shop.shopType,
          imageUrl: shop.imageUrl,
          location: shop.location
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    
    // Limit results
    const finalResults = results.slice(0, 50);
    
    res.json(finalResults);
  } catch (error) {
    console.error('Error performing POST search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Reference ID direct lookup endpoint
router.get('/reference/:referenceId', cacheMiddleware(600000), async (req, res) => { // 10 minute cache for reference lookups
  try {
    const { referenceId } = req.params;
    const { lat, lng } = req.query;
    
    if (!referenceId || !isValidReferenceId(referenceId)) {
      return res.status(400).json({ error: 'Invalid reference ID format' });
    }

    const userLocation = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    const data = await loadSearchData();
    
    // Search across all data types for the reference ID
    let result = null;
    
    // Search items first
    const item = data.items.find(item => item.referenceId === referenceId);
    if (item) {
      const shop = data.shops.find(s => s.id === item.shopId);
      if (shop) {
        result = {
          id: item.id,
          referenceId: item.referenceId,
          type: item.type || 'item',
          name: item.name,
          hindi_name: item.hindi_name,
          description: item.description,
          shopId: item.shopId,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          price: item.price,
          matchScore: 10, // Perfect match for reference ID
          category: item.category,
          availability: item.availability !== false,
          inStock: item.inStock,
          imageUrl: item.imageUrl,
          location: shop.location,
          brand_name: item.brand_name,
          variety: item.variety,
          distance: userLocation && shop.location ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
        };
      }
    }
    
    // Search shops if not found in items
    if (!result) {
      const shop = data.shops.find(shop => shop.referenceId === referenceId);
      if (shop) {
        result = {
          id: shop.id,
          referenceId: shop.referenceId,
          type: shop.shopType === 'office' ? 'office' : 'shop',
          name: shop.shopName,
          description: shop.description,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          matchScore: 10,
          category: shop.type,
          shopType: shop.shopType,
          imageUrl: shop.imageUrl,
          location: shop.location,
          distance: userLocation && shop.location ? calculateDistance(userLocation.lat, userLocation.lng, shop.location.lat, shop.location.lng) : undefined
        };
      }
    }
    
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: 'Reference ID not found' });
    }
  } catch (error) {
    console.error('Error in reference ID lookup:', error);
    res.status(500).json({ error: 'Failed to lookup reference ID' });
  }
});

// Helper function to validate reference ID format
const isValidReferenceId = (referenceId) => {
  return /^(SHP|PRD|MNU|SRV|OFF)-[A-Z]{3}-\d{3}$/.test(referenceId);
};

// "Did you mean" suggestions for no results
router.get('/did-you-mean', cacheMiddleware(300000), async (req, res) => { // 5 minute cache
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const data = await loadSearchData();
    const queryLower = query.toLowerCase().trim();
    let suggestions = []; // Fixed: Removed TypeScript syntax
    const seen = new Set();

    // Generate corrections using fuzzy matching on popular terms
    const allTerms = [
      ...data.items.map(item => [item.name, item.hindi_name, item.category, item.brand_name].filter(Boolean)),
      ...data.shops.map(shop => [shop.shopName, shop.type, shop.address ? shop.address.split(',')[0] : ''].filter(Boolean)),
      ...data.menuItems.map(item => [item.name, item.hindi_name, item.category].filter(Boolean))
    ].flat();

    allTerms.forEach(term => {
      if (!term || seen.has(term.toLowerCase())) return;
      seen.add(term.toLowerCase());
      
      const distance = levenshteinDistance(term.toLowerCase(), queryLower);
      const maxLen = Math.max(term.length, queryLower.length);
      const similarity = 1 - (distance / maxLen);
      
      if (similarity > 0.6 && suggestions.length < 5) { // High similarity for corrections
        suggestions.push(term.trim());
      }
    });

    // Add popular terms if no good matches
    if (suggestions.length === 0) {
      const popular = ['rice', 'pizza', 'haircut', 'grocery', 'restaurant', 'medicine'];
      suggestions.push(...popular.slice(0, 3));
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Error generating did you mean suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Enhanced universal match scoring function (0-10 normalized)
const calculateUniversalMatchScore = (text, query) => {
  if (!text || !query) return 0;
  const textLower = text.toLowerCase().trim();
  const queryLower = query.toLowerCase().trim();
  
  // Exact match gets highest score (10)
  if (textLower === queryLower) {
    return 10;
  }
  
  // Starts-with match gets very high score (8-9)
  if (textLower.startsWith(queryLower)) {
    return queryLower.length >= textLower.length * 0.7 ? 9 : 8;
  }
  
  // Contains query gets good score (6-7)
  if (textLower.includes(queryLower)) {
    // Boost score if query is a significant portion of the text
    const ratio = queryLower.length / textLower.length;
    return ratio > 0.5 ? 7 : 6;
  }
  
  // Word-based matching with enhanced scoring
  const textWords = textLower.split(/[\s\-_.,]+/).filter(w => w.length > 0);
  const queryWords = queryLower.split(/[\s\-_.,]+/).filter(w => w.length > 0);
  
  let totalScore = 0;
  let matchedWords = 0;
  
  for (const queryWord of queryWords) {
    let bestWordScore = 0;
    
    for (const textWord of textWords) {
      let wordScore = 0;
      
      if (textWord === queryWord) {
        wordScore = 5; // Exact word match
      } else if (textWord.startsWith(queryWord)) {
        wordScore = 4; // Word starts with query
      } else if (textWord.includes(queryWord)) {
        wordScore = 3; // Word contains query
      } else if (queryWord.startsWith(textWord)) {
        wordScore = 2; // Query starts with word (partial typing)
      } else {
        // Fuzzy matching for individual words
        const wordDistance = levenshteinDistance(textWord, queryWord);
        const maxLen = Math.max(textWord.length, queryWord.length);
        const similarity = 1 - (wordDistance / maxLen);
        
        if (similarity > 0.7) {
          wordScore = similarity * 2; // Fuzzy match
        }
      }
      
      bestWordScore = Math.max(bestWordScore, wordScore);
    }
    
    if (bestWordScore > 0) {
      matchedWords++;
      totalScore += bestWordScore;
    }
  }
  
  if (matchedWords > 0) {
    // Calculate final score based on word matches
    const wordMatchRatio = matchedWords / queryWords.length;
    const avgWordScore = totalScore / matchedWords;
    return Math.min(wordMatchRatio * avgWordScore, 8);
  }
  
  // Fuzzy matching for entire text (typo tolerance)
  const distance = levenshteinDistance(textLower, queryLower);
  const maxLength = Math.max(textLower.length, queryLower.length);
  const similarity = 1 - (distance / maxLength);
  
  // More lenient fuzzy matching threshold
  if (similarity > 0.5) {
    return similarity * 4;
  }
  
  // Partial character sequence matching (for very short queries)
  if (queryLower.length <= 3) {
    let charMatches = 0;
    for (let i = 0; i < queryLower.length; i++) {
      if (textLower.includes(queryLower[i])) {
        charMatches++;
      }
    }
    if (charMatches >= queryLower.length * 0.7) {
      return (charMatches / queryLower.length) * 2;
    }
  }
  
  return 0;
};

// Enhanced search matching with multiple strategies (kept for backward compatibility)
const calculateMatchScore = (text, query) => {
  return calculateUniversalMatchScore(text, query);
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
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
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// NLU Search endpoint - Enhanced AI-like processing
router.post('/nlu', cacheMiddleware(120000), async (req, res) => { // 2 minute cache
  try {
    const { query, context } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return res.json({
        success: false,
        message: 'Query is required'
      });
    }

    const startTime = Date.now();
    const queryLower = query.trim().toLowerCase();
    const data = await loadSearchData();
    
    // Simulate NLU processing with enhanced analysis
    const nluResults = {
      query: query.trim(),
      processedQuery: query.trim().toLowerCase(),
      detectedIntents: [],
      extractedEntities: [],
      semanticMatches: [],
      exactMatches: [],
      suggestions: [],
      confidence: 0.8,
      language: detectLanguage(query),
      processingTime: 0
    };

    // Intent Detection (simulate AI understanding)
    const intents = detectIntents(queryLower);
    nluResults.detectedIntents = intents;

    // Entity Extraction (simulate NER)
    const entities = extractEntities(queryLower, data);
    nluResults.extractedEntities = entities;

    // Perform enhanced search with NLU insights
    let allResults = [];
    
    // Helper to add result with deduplication
    const addResult = (result) => {
      const key = `${result.type}-${result.id}`;
      if (!allResults.some(r => `${r.type}-${r.id}` === key)) {
        allResults.push(result);
      }
    };

    // Search with entity-aware matching
    const enhancedQuery = [queryLower, ...entities.map(e => e.value)].join(' ');
    
    // Search Items & Products
    data.items.forEach(item => {
      const searchableFields = [
        item.name, item.hindi_name, item.category, item.brand_name,
        item.variety, item.description, item.tags ? item.tags.join(' ') : ''
      ].filter(Boolean).join(' ').toLowerCase();
      
      const score = calculateUniversalMatchScore(searchableFields, enhancedQuery);
      if (score > 0.3) {
        const shop = data.shops.find(s => s.id === item.shopId);
        if (shop) {
          addResult({
            id: item.id,
            type: 'item',
            name: item.name,
            hindi_name: item.hindi_name,
            description: item.description,
            shopId: item.shopId,
            shopName: shop.shopName,
            shopAddress: shop.address,
            shopPhone: shop.phone,
            price: item.price,
            matchScore: score,
            category: item.category,
            availability: item.availability !== false,
            inStock: item.inStock,
            imageUrl: item.imageUrl,
            location: shop.location,
            brand_name: item.brand_name,
            variety: item.variety
          });
        }
      }
    });

    // Search Shops (including offices)
    data.shops.forEach(shop => {
      const officeNames = shop.shopType === 'office' && shop.officeDetails ? 
        [
          shop.officeDetails.department,
          shop.officeDetails.facilityType,
          shop.officeDetails.contactPerson,
          shop.officeDetails.description,
          shop.officeDetails.services ? shop.officeDetails.services.join(' ') : ''
        ].filter(Boolean).join(' ') : '';
      
      const searchableFields = [
        shop.shopName, shop.ownerName, shop.type, shop.address,
        shop.description, officeNames
      ].filter(Boolean).join(' ').toLowerCase();
      
      const score = calculateUniversalMatchScore(searchableFields, enhancedQuery);
      if (score > 0.3) {
        const resultType = shop.shopType === 'office' ? 'office' : 'shop';
        addResult({
          id: shop.id,
          type: resultType,
          name: shop.shopName,
          description: shop.description,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          matchScore: score,
          category: shop.type,
          shopType: shop.shopType,
          imageUrl: shop.imageUrl,
          location: shop.location
        });
      }
    });

    // Separate exact and semantic matches
    allResults.forEach(result => {
      if (result.matchScore >= 8) {
        nluResults.exactMatches.push(result);
      } else {
        nluResults.semanticMatches.push(result);
      }
    });

    // Generate AI-like suggestions
    nluResults.suggestions = generateSmartSuggestions(queryLower, entities, data);

    // Calculate overall confidence
    const totalMatches = nluResults.exactMatches.length + nluResults.semanticMatches.length;
    nluResults.confidence = Math.min(0.95, 0.5 + (totalMatches * 0.1) + (entities.length * 0.1));

    nluResults.processingTime = Date.now() - startTime;

    res.json({
      success: true,
      nluResults
    });

  } catch (error) {
    console.error('Error in NLU search:', error);
    res.status(500).json({
      success: false,
      message: 'NLU processing failed',
      error: error.message
    });
  }
});

// Helper functions for NLU simulation

const detectLanguage = (query) => {
  // Simple language detection based on character patterns
  const hindiPattern = /[\u0900-\u097F]/;
  if (hindiPattern.test(query)) {
    return 'hi'; // Hindi
  }
  return 'en'; // English
};

const detectIntents = (query) => {
  const intents = [];
  
  // Search intent patterns
  const searchPatterns = [
    { pattern: /find|search|look|where/, name: 'search', confidence: 0.9 },
    { pattern: /buy|purchase|get|need/, name: 'purchase', confidence: 0.8 },
    { pattern: /near|nearby|close/, name: 'location_search', confidence: 0.85 },
    { pattern: /open|hours|time/, name: 'hours_inquiry', confidence: 0.8 },
    { pattern: /price|cost|rate/, name: 'price_inquiry', confidence: 0.8 },
    { pattern: /book|appointment|reserve/, name: 'booking', confidence: 0.9 },
    { pattern: /office|government|सरकारी/, name: 'office_search', confidence: 0.85 }
  ];

  searchPatterns.forEach(({ pattern, name, confidence }) => {
    if (pattern.test(query)) {
      intents.push({
        name,
        confidence,
        entities: []
      });
    }
  });

  // Default search intent if no specific intent detected
  if (intents.length === 0) {
    intents.push({
      name: 'general_search',
      confidence: 0.7,
      entities: []
    });
  }

  return intents;
};

const extractEntities = (query, data) => {
  const entities = [];
  
  // Extract categories
  const categories = [...new Set([
    ...data.items.map(i => i.category),
    ...data.shops.map(s => s.type),
    ...data.menuItems.map(m => m.category)
  ])].filter(Boolean);

  categories.forEach(category => {
    if (query.includes(category.toLowerCase())) {
      entities.push({
        name: 'category',
        value: category,
        type: 'category',
        confidence: 0.9
      });
    }
  });

  // Extract brands
  const brands = [...new Set(data.items.map(i => i.brand_name))].filter(Boolean);
  brands.forEach(brand => {
    if (query.includes(brand.toLowerCase())) {
      entities.push({
        name: 'brand',
        value: brand,
        type: 'brand',
        confidence: 0.85
      });
    }
  });

  // Extract locations/districts
  const locations = ['mandsaur', 'bhanpura', 'garoth', 'malhargarh', 'sitamau', 'shamgarh'];
  locations.forEach(location => {
    if (query.includes(location)) {
      entities.push({
        name: 'location',
        value: location,
        type: 'location',
        confidence: 0.9
      });
    }
  });

  // Extract price ranges
  const pricePattern = /(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:rupee|rs|₹)?/i;
  const priceMatch = query.match(pricePattern);
  if (priceMatch) {
    entities.push({
      name: 'price_range',
      value: priceMatch[0],
      type: 'price_range',
      confidence: 0.8
    });
  }

  return entities;
};

const generateSmartSuggestions = (query, entities, data) => {
  const suggestions = [];
  
  // Category-based suggestions
  if (entities.some(e => e.type === 'category')) {
    const category = entities.find(e => e.type === 'category').value;
    suggestions.push(`${category} near me`);
    suggestions.push(`best ${category} shops`);
  }

  // Popular search suggestions
  const popularSuggestions = [
    'grocery stores near me',
    'restaurants with home delivery',
    'medical stores open now',
    'government offices',
    'mobile repair services',
    'beauty salons',
    'banks and ATMs'
  ];

  // Add relevant popular suggestions
  popularSuggestions.forEach(suggestion => {
    if (suggestion.toLowerCase().includes(query.substring(0, 3)) && suggestions.length < 5) {
      suggestions.push(suggestion);
    }
  });

  return suggestions.slice(0, 3);
};

module.exports = router;
