const { db } = require('../firebaseAdmin');

// Search shops and items in Firestore
async function searchShopsAndItems(keywords, options = {}) {
  try {
    const { limit = 10, category = null, location = null } = options;
    const results = [];
    
    // Search in shops collection
    const shopsRef = db.collection('shops');
    const shopsSnapshot = await shopsRef.get();
    
    const shopResults = [];
    shopsSnapshot.forEach(doc => {
      const shop = { id: doc.id, ...doc.data() };
      const relevanceScore = calculateRelevance(shop, keywords, 'shop');
      
      if (relevanceScore > 0.3) {
        shopResults.push({
          ...shop,
          type: 'shop',
          relevanceScore,
          distance: calculateDistance(location, shop.location)
        });
      }
    });
    
    // Search in items collection
    const itemsRef = db.collection('items');
    const itemsSnapshot = await itemsRef.get();
    
    const itemResults = [];
    itemsSnapshot.forEach(doc => {
      const item = { id: doc.id, ...doc.data() };
      const relevanceScore = calculateRelevance(item, keywords, 'item');
      
      if (relevanceScore > 0.3) {
        // Get shop details for this item
        const shop = shopResults.find(s => s.id === item.shopId);
        if (shop) {
          itemResults.push({
            ...item,
            type: 'item',
            shopName: shop.shopName,
            shopAddress: shop.address,
            shopPhone: shop.phone,
            relevanceScore,
            distance: shop.distance
          });
        }
      }
    });
    
    // Search in menu items (for restaurants) - using new structure
    try {
      const menuRef = db.collectionGroup('items').where('type', '==', 'menu');
      const menuSnapshot = await menuRef.get();
      
      const menuResults = [];
      menuSnapshot.forEach(doc => {
        const menuItem = { id: doc.id, ...doc.data() };
        const relevanceScore = calculateRelevance(menuItem, keywords, 'menu');
        
        if (relevanceScore > 0.3) {
          const shop = shopResults.find(s => s.id === menuItem.shopId);
          if (shop && ['restaurant', 'cafe', 'hotel'].includes(shop.type)) {
            menuResults.push({
              ...menuItem,
              type: 'menu',
              shopName: shop.shopName,
              shopAddress: shop.address,
              shopPhone: shop.phone,
              relevanceScore,
              distance: shop.distance
            });
          }
        }
      });
      
      results.push(...menuResults);
    } catch (menuError) {
      // Menu items collection not found, skipping menu search
    }
    
    // Combine and sort results
    results.push(...shopResults, ...itemResults);
    
    // Sort by relevance and distance
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
    
    const finalResults = results.slice(0, limit);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Firestore search error:', error);
    return [];
  }
}

// Calculate relevance score for search results
function calculateRelevance(item, keywords, type) {
  let score = 0;
  const keywordStr = keywords.join(' ').toLowerCase();
  
  // Define searchable fields based on type
  let searchFields = [];
  
  switch (type) {
    case 'shop':
      searchFields = [
        { field: 'shopName', weight: 3 },
        { field: 'type', weight: 2 },
        { field: 'address', weight: 1 },
        { field: 'items', weight: 2, isArray: true }
      ];
      break;
      
    case 'item':
      searchFields = [
        { field: 'name', weight: 3 },
        { field: 'hindi_name', weight: 3 },
        { field: 'category', weight: 2 },
        { field: 'type', weight: 2 },
        { field: 'variety', weight: 1 }
      ];
      break;
      
    case 'menu':
      searchFields = [
        { field: 'name', weight: 3 },
        { field: 'hindi_name', weight: 3 },
        { field: 'description', weight: 2 },
        { field: 'category', weight: 2 }
      ];
      break;
  }
  
  // Calculate score based on field matches
  searchFields.forEach(({ field, weight, isArray }) => {
    const fieldValue = item[field];
    if (!fieldValue) return;
    
    if (isArray && Array.isArray(fieldValue)) {
      fieldValue.forEach(arrayItem => {
        if (arrayItem.toLowerCase().includes(keywordStr)) {
          score += weight;
        }
      });
    } else if (typeof fieldValue === 'string') {
      const fieldLower = fieldValue.toLowerCase();
      
      // Exact match bonus
      if (fieldLower === keywordStr) {
        score += weight * 2;
      }
      // Contains match
      else if (fieldLower.includes(keywordStr)) {
        score += weight;
      }
      // Fuzzy match for individual keywords
      else {
        keywords.forEach(keyword => {
          if (fieldLower.includes(keyword.toLowerCase())) {
            score += weight * 0.5;
          }
        });
      }
    }
  });
  
  // Normalize score (0-1 range)
  const maxPossibleScore = searchFields.reduce((sum, field) => sum + field.weight * 2, 0);
  return Math.min(score / maxPossibleScore, 1);
}

// Calculate distance between two points (simplified)
function calculateDistance(userLocation, shopLocation) {
  if (!userLocation || !shopLocation) return null;
  
  try {
    const lat1 = userLocation.latitude || userLocation.lat;
    const lng1 = userLocation.longitude || userLocation.lng;
    const lat2 = shopLocation.latitude || shopLocation.lat;
    const lng2 = shopLocation.longitude || shopLocation.lng;
    
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    
    // Haversine formula (simplified)
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
}

// Log user interactions
async function logInteraction(interactionData) {
  try {
    const logsRef = db.collection('logs');
    await logsRef.add({
      ...interactionData,
      timestamp: interactionData.timestamp || new Date(),
      createdAt: new Date()
    });
    
    // Interaction logged successfully
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

// Get popular search terms
async function getPopularSearches(limit = 10) {
  try {
    const logsRef = db.collection('logs');
    const snapshot = await logsRef
      .where('type', '==', 'incoming')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    const searchTerms = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.message) {
        const words = data.message.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) {
            searchTerms[word] = (searchTerms[word] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(searchTerms)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
      
  } catch (error) {
    console.error('❌ Failed to get popular searches:', error);
    return [];
  }
}

module.exports = {
  searchShopsAndItems,
  calculateRelevance,
  calculateDistance,
  logInteraction,
  getPopularSearches
};