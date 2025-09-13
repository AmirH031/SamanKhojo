const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const cacheMiddleware = require('../middleware/cache');

// In-memory cache for search data (consider Redis for production)
let searchCache = {
  items: [],
  shops: [],
  menuItems: [],
  lastUpdated: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Preload search data with comprehensive menu items loading
const loadSearchData = async () => {
  if (searchCache.lastUpdated && Date.now() - searchCache.lastUpdated < CACHE_DURATION) {
    return searchCache;
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

    searchCache = {
      items,
      shops,
      menuItems,
      lastUpdated: Date.now()
    };

    if (process.env.NODE_ENV !== 'production') {
    }
    return searchCache;
  } catch (error) {
    console.error('Error loading search data:', error);
    return { items: [], shops: [], menuItems: [], lastUpdated: Date.now() };
  }
};

// Search suggestions endpoint with caching
router.get('/suggestions', cacheMiddleware(30000), async (req, res) => { // 30 second cache for faster updates
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const data = await loadSearchData();
    const suggestions = [];
    const queryLower = query.toLowerCase();

    const itemSuggestions = new Set();
    
    // Process items with comprehensive matching
    data.items.forEach(item => {
      if (item.name && calculateMatchScore(item.name, queryLower) > 0.3) {
        itemSuggestions.add(item.name);
      }
      if (item.hindi_name && calculateMatchScore(item.hindi_name, queryLower) > 0.3) {
        itemSuggestions.add(item.hindi_name);
      }
      if (item.category && calculateMatchScore(item.category, queryLower) > 0.3) {
        itemSuggestions.add(item.category);
      }
      if (item.brand_name && calculateMatchScore(item.brand_name, queryLower) > 0.3) {
        itemSuggestions.add(item.brand_name);
      }
    });

    // Process menu items with comprehensive matching
    data.menuItems.forEach(menuItem => {
      if (menuItem.name && calculateMatchScore(menuItem.name, queryLower) > 0.3) {
        itemSuggestions.add(menuItem.name);
      }
      if (menuItem.hindi_name && calculateMatchScore(menuItem.hindi_name, queryLower) > 0.3) {
        itemSuggestions.add(menuItem.hindi_name);
      }
      if (menuItem.category && calculateMatchScore(menuItem.category, queryLower) > 0.3) {
        itemSuggestions.add(menuItem.category);
      }
    });
    
    // Process shops
    const shopSuggestions = new Set();
    data.shops.forEach(shop => {
      if (shop.shopName && calculateMatchScore(shop.shopName, queryLower) > 0.3) {
        shopSuggestions.add(shop.shopName);
      }
      if (shop.address && calculateMatchScore(shop.address, queryLower) > 0.3) {
        const addressParts = shop.address.split(',');
        addressParts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed.length > 2 && calculateMatchScore(trimmed, queryLower) > 0.3) {
            shopSuggestions.add(trimmed);
          }
        });
      }
    });

    // Add item suggestions
    Array.from(itemSuggestions).slice(0, 4).forEach(item => {
      suggestions.push({ text: item, type: 'item' });
    });
    
    // Add shop suggestions
    Array.from(shopSuggestions).slice(0, 2).forEach(shop => {
      suggestions.push({ text: shop, type: 'shop' });
    });

    res.json(suggestions.slice(0, 6));
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Universal search endpoint with caching
router.get('/universal', cacheMiddleware(120000), async (req, res) => { // 2 minute cache
  try {
    const { q: query, lat, lng } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const data = await loadSearchData();
    const results = [];
    const queryLower = query.toLowerCase();

    // Create shops map for reference
    const shopsMap = new Map();
    data.shops.forEach(shop => {
      shopsMap.set(shop.id, shop);
    });

    // Process items with enhanced matching
    const itemResults = [];
    data.items.forEach(item => {
      const shop = shopsMap.get(item.shopId);
      if (!shop) return;
      
      const matchScore = Math.max(
        item.name ? calculateMatchScore(item.name, queryLower) : 0,
        item.hindi_name ? calculateMatchScore(item.hindi_name, queryLower) : 0,
        item.category ? calculateMatchScore(item.category, queryLower) : 0,
        item.category_hindi ? calculateMatchScore(item.category_hindi, queryLower) : 0,
        item.type ? calculateMatchScore(item.type, queryLower) : 0,
        item.variety ? calculateMatchScore(item.variety, queryLower) : 0,
        item.brand_name ? calculateMatchScore(item.brand_name, queryLower) : 0
      );
      
      if (matchScore > 0.5) {
        // Filter out unavailable items
        const isAvailable = item.type === 'product' 
          ? (item.inStock === undefined || item.inStock > 0)
          : (item.availability !== false && item.isAvailable !== false);
          
        if (!isAvailable) return; // Skip unavailable items
        
        let distance;
        if (lat && lng && shop.location) {
          distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            shop.location.lat, shop.location.lng
          );
        }
        
        itemResults.push({
          id: item.id,
          type: 'item',
          name: item.name || item.hindi_name || 'Unknown Item',
          hindi_name: item.hindi_name,
          brand_name: item.brand_name,
          description: `${item.category || 'Item'} at ${shop.shopName}`,
          shopId: item.shopId,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          category: item.category,
          price: item.price,
          inStock: item.inStock,
          availability: item.availability,
          isAvailable: item.isAvailable,
          distance,
          location: shop.location,
          imageUrl: item.imageUrl,
          matchScore
        });
      }
    });

    // Add item results sorted by match score
    itemResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .forEach(({ matchScore, ...result }) => results.push(result));

    // Search in shops with enhanced matching
    const shopResults = [];
    data.shops.forEach(shop => {
      const matchScore = Math.max(
        shop.shopName ? calculateMatchScore(shop.shopName, queryLower) : 0,
        shop.ownerName ? calculateMatchScore(shop.ownerName, queryLower) : 0,
        shop.address ? calculateMatchScore(shop.address, queryLower) : 0,
        shop.type ? calculateMatchScore(shop.type, queryLower) : 0
      );
      
      if (matchScore > 0.5) {
        let distance;
        if (lat && lng && shop.location) {
          distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            shop.location.lat, shop.location.lng
          );
        }
        
        shopResults.push({
          id: shop.id,
          type: 'shop',
          name: shop.shopName,
          description: `${shop.type || 'Shop'} • ${shop.address}`,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          distance,
          location: shop.location,
          imageUrl: shop.imageUrl,
          matchScore
        });
      }
    });

    // Add shop results sorted by match score
    shopResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .forEach(({ matchScore, ...result }) => results.push(result));

    // Search in menu items
    const menuResults = [];
    data.menuItems.forEach(menuItem => {
      const shop = shopsMap.get(menuItem.shopId);
      if (!shop) return; // Skip if shop not found
      
      const matchScore = Math.max(
        menuItem.name ? calculateMatchScore(menuItem.name, queryLower) : 0,
        menuItem.hindi_name ? calculateMatchScore(menuItem.hindi_name, queryLower) : 0,
        menuItem.description ? calculateMatchScore(menuItem.description, queryLower) : 0,
        menuItem.category ? calculateMatchScore(menuItem.category, queryLower) : 0
      );
      
      if (matchScore > 0.5) {
        // Filter out unavailable menu items
        const isAvailable = menuItem.availability !== false && menuItem.isAvailable !== false;
        if (!isAvailable) return; // Skip unavailable menu items
        
        let distance;
        if (lat && lng && shop.location) {
          distance = calculateDistance(
            parseFloat(lat), parseFloat(lng),
            shop.location.lat, shop.location.lng
          );
        }
        
        menuResults.push({
          id: menuItem.id,
          type: 'menu',
          name: menuItem.name || 'Menu Item',
          hindi_name: menuItem.hindi_name,
          brand_name: menuItem.brand_name,
          description: `${menuItem.category || 'Food'} at ${shop.shopName}`,
          shopId: menuItem.shopId,
          shopName: shop.shopName,
          shopAddress: shop.address,
          shopPhone: shop.phone,
          category: menuItem.category,
          price: menuItem.price,
          availability: menuItem.availability,
          isAvailable: menuItem.isAvailable,
          distance,
          location: shop.location,
          imageUrl: menuItem.imageUrl,
          matchScore
        });
      }
    });

    // Add menu results sorted by match score
    menuResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .forEach(({ matchScore, ...result }) => results.push(result));

    // Final sorting by relevance and distance
    results.sort((a, b) => {
      // Calculate relevance scores
      const aRelevance = calculateMatchScore(a.name, queryLower);
      const bRelevance = calculateMatchScore(b.name, queryLower);
      
      // Exact matches first
      if (aRelevance >= 10 && bRelevance < 10) return -1;
      if (bRelevance >= 10 && aRelevance < 10) return 1;
      
      // Then by relevance score
      if (aRelevance !== bRelevance) return bRelevance - aRelevance;
      
      // Then by distance if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      // Finally by type (items first, then shops)
      if (a.type !== b.type) {
        return a.type === 'item' ? -1 : 1;
      }
      
      return 0;
    });

    const finalResults = results.slice(0, 50); // Limit results for performance
    res.json(finalResults);
  } catch (error) {
    console.error('Universal search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Get "Did you mean" suggestions for no results
router.get('/did-you-mean', cacheMiddleware(300000), async (req, res) => { // 5 minute cache
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const queryLower = query.toLowerCase();
    const suggestions = new Set();
    const data = await loadSearchData();
    
    data.items.forEach(item => {
      // Check for partial matches or similar words
      if (item.name) {
        const score = calculateMatchScore(item.name, queryLower);
        if (score > 0.3) { // Lower threshold for "did you mean"
          suggestions.add(item.name);
        }
      }
      
      if (item.hindi_name) {
        const score = calculateMatchScore(item.hindi_name, queryLower);
        if (score > 0.3) {
          suggestions.add(item.hindi_name);
        }
      }
      
      if (item.category) {
        const score = calculateMatchScore(item.category, queryLower);
        if (score > 0.3) {
          suggestions.add(item.category);
        }
      }
    });
    
    // Also check menu items
    data.menuItems.forEach(menuItem => {
      if (menuItem.name) {
        const score = calculateMatchScore(menuItem.name, queryLower);
        if (score > 0.3) {
          suggestions.add(menuItem.name);
        }
      }
      
      if (menuItem.category) {
        const score = calculateMatchScore(menuItem.category, queryLower);
        if (score > 0.3) {
          suggestions.add(menuItem.category);
        }
      }
    });
    
    res.json(Array.from(suggestions).slice(0, 5));
  } catch (error) {
    console.error('Did you mean suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Enhanced search matching with multiple strategies (like original)
const calculateMatchScore = (text, query) => {
  if (!text || !query) return 0;
  
  const textLower = text.toLowerCase().trim();
  const queryLower = query.toLowerCase().trim();
  
  // Exact match gets highest score
  if (textLower === queryLower) return 10;
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 8;
  
  // Contains exact query gets good score
  if (textLower.includes(queryLower)) return 6;
  
  // Word boundary matches
  const textWords = textLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  
  let wordMatches = 0;
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      if (textWord === queryWord) {
        wordMatches += 3;
      } else if (textWord.startsWith(queryWord)) {
        wordMatches += 2;
      } else if (textWord.includes(queryWord)) {
        wordMatches += 1;
      }
    }
  }
  
  if (wordMatches > 0) return Math.min(wordMatches, 5);
  
  // Basic fuzzy matching for typos
  const distance = levenshteinDistance(textLower, queryLower);
  const maxLength = Math.max(textLower.length, queryLower.length);
  const similarity = 1 - (distance / maxLength);
  
  if (similarity > 0.7) return similarity * 3;
  
  return 0;
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

module.exports = router;