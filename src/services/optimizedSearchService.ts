import { searchApi, shopsApi } from './api';

export interface SearchResult {
  id: string;
  type: 'item' | 'shop' | 'menu';
  name: string;
  description: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  price?: number;
  distance?: number;
  matchScore?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'item' | 'shop' | 'location';
}

// Local fallback suggestions for offline mode
const getLocalSuggestions = (query: string): SearchSuggestion[] => {
  const lowerQuery = query.toLowerCase();
  const allSuggestions = [
    // Food items
    { text: 'चावल rice', type: 'item' as const },
    { text: 'दाल dal', type: 'item' as const },
    { text: 'रोटी bread', type: 'item' as const },
    { text: 'दूध milk', type: 'item' as const },
    { text: 'चाय tea', type: 'item' as const },
    { text: 'कॉफी coffee', type: 'item' as const },
    { text: 'बिरयानी biryani', type: 'item' as const },
    { text: 'पिज्जा pizza', type: 'item' as const },
    { text: 'बर्गर burger', type: 'item' as const },
    { text: 'मोमो momo', type: 'item' as const },
    { text: 'चाट chat', type: 'item' as const },
    { text: 'समोसा samosa', type: 'item' as const },
    
    // Grocery items
    { text: 'आटा flour', type: 'item' as const },
    { text: 'चीनी sugar', type: 'item' as const },
    { text: 'नमक salt', type: 'item' as const },
    { text: 'तेल oil', type: 'item' as const },
    { text: 'घी ghee', type: 'item' as const },
    { text: 'प्याज onion', type: 'item' as const },
    { text: 'आलू potato', type: 'item' as const },
    { text: 'टमाटर tomato', type: 'item' as const },
    
    // Services
    { text: 'बाल काटना haircut', type: 'item' as const },
    { text: 'डॉक्टर doctor', type: 'shop' as const },
    { text: 'दवा medicine', type: 'item' as const },
    { text: 'रिपेयर repair', type: 'shop' as const },
    { text: 'प्लंबर plumber', type: 'shop' as const },
    
    // Shops
    { text: 'किराना grocery', type: 'shop' as const },
    { text: 'कपड़े clothes', type: 'item' as const },
    { text: 'जूते shoes', type: 'item' as const },
    { text: 'मोबाइल mobile', type: 'item' as const },
    { text: 'दुकान shop', type: 'shop' as const },
    { text: 'मार्केट market', type: 'location' as const },
    { text: 'फार्मेसी pharmacy', type: 'shop' as const },
    
    // Location-based
    { text: 'पास में near me', type: 'location' as const },
    { text: 'नजदीक nearby', type: 'location' as const },
    { text: 'रेस्टोरेंट restaurant', type: 'shop' as const },
    { text: 'होटल hotel', type: 'shop' as const },
    { text: 'बैंक bank', type: 'shop' as const },
    { text: 'एटीएम ATM', type: 'shop' as const }
  ];

  return allSuggestions
    .filter(suggestion => 
      suggestion.text.toLowerCase().includes(lowerQuery) ||
      lowerQuery.split(' ').some(word => suggestion.text.toLowerCase().includes(word))
    )
    .slice(0, 8);
};

// Get search suggestions with fallback
export const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (query.length < 1) return [];
  
  try {
    const backendSuggestions = await searchApi.suggestions(query);
    
    // Combine backend and local suggestions
    const localSuggestions = getLocalSuggestions(query);
    
    // Prioritize backend suggestions but add local as fallback
    const combined = backendSuggestions.length > 0 
      ? [...backendSuggestions, ...localSuggestions.slice(0, 3)]
      : localSuggestions;
    
    // Remove duplicates and limit results
    const unique = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.text === item.text)
    );
    
    return unique.slice(0, 6);
  } catch (error) {
    // Silently fall back to local suggestions without logging
    return getLocalSuggestions(query);
  }
};

// Universal search with fallback to Firestore
export const universalSearch = async (
  query: string, 
  userLocation?: { latitude: number; longitude: number }
): Promise<SearchResult[]> => {
  if (query.length < 1) return [];
  
  try {
    return await searchApi.universal(
      query, 
      userLocation?.latitude, 
      userLocation?.longitude
    );
  } catch (error) {
    // Silently fall back to Firestore search without logging
    return await searchFirestore(query, userLocation);
  }
};

// Fallback search using Firestore
const searchFirestore = async (
  query: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<SearchResult[]> => {
  try {
    // Import Firestore service dynamically to avoid circular dependencies
    const { getShops } = await import('./firestoreService');
    const shops = await getShops();
    
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search through shops
    shops.forEach(shop => {
      const shopMatches = 
        shop.shopName.toLowerCase().includes(lowerQuery) ||
        shop.address.toLowerCase().includes(lowerQuery) ||
        shop.type.toLowerCase().includes(lowerQuery) ||
        (shop.items && shop.items.some(item => item.toLowerCase().includes(lowerQuery)));
      
      if (shopMatches) {
        let distance = undefined;
        if (userLocation && shop.location) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            shop.location.lat,
            shop.location.lng
          );
        }
        
        results.push({
          id: shop.id,
          type: 'shop',
          name: shop.shopName,
          description: shop.address,
          shopId: shop.id,
          shopName: shop.shopName,
          shopAddress: shop.address,
          distance,
          matchScore: 1
        });
        
        // Add items from this shop
        if (shop.items) {
          shop.items.forEach((item, index) => {
            if (item.toLowerCase().includes(lowerQuery)) {
              results.push({
                id: `${shop.id}-item-${index}`,
                type: 'item',
                name: item,
                description: `Available at ${shop.shopName}`,
                shopId: shop.id,
                shopName: shop.shopName,
                shopAddress: shop.address,
                distance,
                matchScore: 0.8
              });
            }
          });
        }
      }
    });
    
    // Sort by match score and distance
    return results
      .sort((a, b) => {
        if (a.matchScore !== b.matchScore) {
          return (b.matchScore || 0) - (a.matchScore || 0);
        }
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      })
      .slice(0, 20);
      
  } catch (error) {
    console.error('Firestore search error:', error);
    return [];
  }
};

// Helper function to calculate distance
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get shops with backend processing
export const getOptimizedShops = async (options: {
  location?: { latitude: number; longitude: number };
  radius?: number;
  sortBy?: string;
  search?: string;
} = {}) => {
  try {
    const params: Record<string, string> = {};
    if (options.location) {
      params.lat = options.location.latitude.toString();
      params.lng = options.location.longitude.toString();
    }
    if (options.radius) params.radius = options.radius.toString();
    if (options.sortBy) params.sortBy = options.sortBy;
    if (options.search) params.search = options.search;
    
    return await shopsApi.getAll(params);
  } catch (error) {
    console.error('Error fetching shops:', error);
    return [];
  }
};

// Get shop details with items
export const getOptimizedShopDetails = async (shopId: string) => {
  try {
    return await shopsApi.getById(shopId);
  } catch (error) {
    console.error('Error fetching shop details:', error);
    throw error;
  }
};

// Get "Did you mean" suggestions for no results
export const getDidYouMeanSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) return [];
  
  try {
    return await searchApi.didYouMean(query);
  } catch (error) {
    console.error('Error getting did you mean suggestions:', error);
    return [];
  }
};