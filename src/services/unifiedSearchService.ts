// Unified search service that uses backend APIs and reduces frontend complexity
import { getOptimizedShops, universalSearch } from './optimizedSearchService';
import { searchItemsWithShops, SearchFilters, SearchResult } from './enhancedSearchService';
import { searchShops, Shop } from './firestoreService';

export interface UnifiedSearchResult {
  items: SearchResult[];
  shops: Shop[];
  totalResults: number;
  searchTime: number;
}

export interface UnifiedSearchOptions {
  query: string;
  type?: 'all' | 'items' | 'shops';
  filters?: SearchFilters;
  location?: { lat: number; lng: number };
  limit?: number;
}

// Main unified search function that uses backend when possible
export const performUnifiedSearch = async (options: UnifiedSearchOptions): Promise<UnifiedSearchResult> => {
  const startTime = Date.now();
  const { query, type = 'all', filters = {}, location, limit = 50 } = options;

  try {
    // Try backend universal search first
    const backendResults = await universalSearch(query, location);
    
    if (backendResults && backendResults.length > 0) {
      // Process backend results
      const items: SearchResult[] = [];
      const shops: Shop[] = [];

      backendResults.forEach(result => {
        if (result.type === 'item' || result.type === 'menu') {
          // Convert to SearchResult format
          const searchResult: SearchResult = {
            item: {
              id: result.id,
              shopId: result.shopId,
              type: result.type === 'menu' ? 'menu' : 'product',
              name: result.name,
              description: result.description,
              price: result.price,
              availability: true
            },
            shop: {
              id: result.shopId,
              shopName: result.shopName,
              address: result.shopAddress,
              distance: result.distance
            } as Shop,
            matchScore: result.matchScore || 0,
            matchType: 'name',
            attractiveFeatures: []
          };
          items.push(searchResult);
        } else if (result.type === 'shop') {
          const shop: Shop = {
            id: result.id,
            shopName: result.name,
            address: result.shopAddress,
            distance: result.distance
          } as Shop;
          shops.push(shop);
        }
      });

      return {
        items: type === 'shops' ? [] : items.slice(0, limit),
        shops: type === 'items' ? [] : shops.slice(0, limit),
        totalResults: items.length + shops.length,
        searchTime: Date.now() - startTime
      };
    }
  } catch (backendError) {
    console.warn('Backend search failed, using fallback:', backendError);
  }

  // Fallback to frontend search
  return performFallbackSearch(options, startTime);
};

// Fallback search using existing frontend services
const performFallbackSearch = async (options: UnifiedSearchOptions, startTime: number): Promise<UnifiedSearchResult> => {
  const { query, type = 'all', filters = {}, location, limit = 50 } = options;
  
  const promises: Promise<any>[] = [];

  // Search items if needed
  if (type === 'all' || type === 'items') {
    promises.push(searchItemsWithShops(query, filters, limit).catch(() => []));
  } else {
    promises.push(Promise.resolve([]));
  }

  // Search shops if needed
  if (type === 'all' || type === 'shops') {
    if (location) {
      // Try optimized shops with location
      promises.push(
        getOptimizedShops({
          location: { latitude: location.lat, longitude: location.lng },
          search: query,
          sortBy: 'distance'
        }).catch(() => searchShops(query).catch(() => []))
      );
    } else {
      promises.push(searchShops(query).catch(() => []));
    }
  } else {
    promises.push(Promise.resolve([]));
  }

  const [itemResults, shopResults] = await Promise.all(promises);

  return {
    items: itemResults || [],
    shops: shopResults || [],
    totalResults: (itemResults?.length || 0) + (shopResults?.length || 0),
    searchTime: Date.now() - startTime
  };
};

// Simplified suggestion service
export const getQuickSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) return [];

  try {
    // Try backend suggestions first
    const { getSearchSuggestions } = await import('./optimizedSearchService');
    const suggestions = await getSearchSuggestions(query);
    return suggestions.map(s => s.text).slice(0, 6);
  } catch (error) {
    // Fallback to static suggestions
    const staticSuggestions = [
      'rice', 'flour', 'oil', 'vegetables', 'fruits', 'milk', 'bread',
      'biryani', 'pizza', 'burger', 'dal rice', 'dosa',
      'haircut', 'massage', 'repair', 'cleaning',
      'grocery store', 'restaurant', 'pharmacy', 'salon'
    ];
    
    return staticSuggestions
      .filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  }
};

// Location-based quick searches
export const getLocationBasedSuggestions = (location?: { lat: number; lng: number }): string[] => {
  if (!location) return [];
  
  return [
    'restaurants near me',
    'grocery stores nearby',
    'pharmacies near me',
    'salons nearby',
    'electronics shops near me',
    'cafes nearby'
  ];
};

// Recent searches management (simplified)
export const getRecentSearches = (): string[] => {
  try {
    const recent = localStorage.getItem('recentSearches');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (query: string): void => {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent search:', error);
  }
};

export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem('recentSearches');
  } catch (error) {
    console.error('Failed to clear recent searches:', error);
  }
};