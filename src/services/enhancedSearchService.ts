import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Item } from '../types/Item';
import { Shop } from './firestoreService';
import { getItems } from './itemService';
import { getShops } from './firestoreService';

export interface SearchResult {
  item: Item;
  shop: Shop;
  matchScore: number;
  matchType: 'name' | 'category' | 'description' | 'brand' | 'tags';
  displayPrice?: string;
  priceInfo?: {
    current: number;
    original?: number;
    discount?: number;
    hasDiscount: boolean;
  };
  attractiveFeatures: string[];
}

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  shopType?: string;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity' | 'distance';
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
}

export const searchItemsWithShops = async (
  searchQuery: string,
  filters: SearchFilters = {},
  maxResults: number = 50
): Promise<SearchResult[]> => {
  try {
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return results;

    // Get all shops first
    const shops = await getShops();
    
    // Filter shops based on filters
    let filteredShops = shops.filter(shop => {
      if (filters.shopType && shop.type !== filters.shopType) return false;
      if (filters.location) {
        const distance = calculateDistance(
          filters.location.lat,
          filters.location.lng,
          shop.location.lat,
          shop.location.lng
        );
        if (distance > filters.location.radius) return false;
      }
      return true;
    });

    // Search items in each shop
    for (const shop of filteredShops) {
      try {
        const items = await getItems(shop.id, undefined, true);
        
        for (const item of items) {
          const matchResult = calculateItemMatch(item, query);
          
          if (matchResult.score > 0) {
            // Apply filters
            if (filters.category && item.category !== filters.category) continue;
            if (filters.availability !== undefined && item.availability !== filters.availability) continue;
            if (filters.priceRange && item.price) {
              if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) continue;
            }

            const searchResult: SearchResult = {
              item,
              shop,
              matchScore: matchResult.score,
              matchType: matchResult.type,
              priceInfo: calculatePriceInfo(item),
              attractiveFeatures: generateAttractiveFeatures(item, shop)
            };

            results.push(searchResult);
          }
        }
      } catch (error) {
        console.error(`Error searching items in shop ${shop.id}:`, error);
      }
    }

    // Sort results
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return (a.item.price || 0) - (b.item.price || 0);
        case 'price_high':
          return (b.item.price || 0) - (a.item.price || 0);
        case 'rating':
          return (b.item.rating || 0) - (a.item.rating || 0);
        case 'popularity':
          return (b.item.reviewCount || 0) - (a.item.reviewCount || 0);
        case 'distance':
          if (filters.location) {
            const distanceA = calculateDistance(
              filters.location.lat,
              filters.location.lng,
              a.shop.location.lat,
              a.shop.location.lng
            );
            const distanceB = calculateDistance(
              filters.location.lat,
              filters.location.lng,
              b.shop.location.lat,
              b.shop.location.lng
            );
            return distanceA - distanceB;
          }
          return b.matchScore - a.matchScore;
        default: // relevance
          return b.matchScore - a.matchScore;
      }
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error in enhanced search:', error);
    return [];
  }
};

const calculateItemMatch = (item: Item, query: string): { score: number; type: 'name' | 'category' | 'description' | 'brand' | 'tags' } => {
  let score = 0;
  let matchType: 'name' | 'category' | 'description' | 'brand' | 'tags' = 'name';

  // Handle items with names
  if (item.name) {
    // Exact name match (highest score)
    if (item.name.toLowerCase() === query) {
      return { score: 100, type: 'name' };
    }

    // Name starts with query
    if (item.name.toLowerCase().startsWith(query)) {
      score = 90;
      matchType = 'name';
    }
    // Name contains query
    else if (item.name.toLowerCase().includes(query)) {
      score = 80;
      matchType = 'name';
    }
  }
  // If no name match, try other fields
  if (score === 0) {
    // Hindi name match
    if (item.hindi_name && item.hindi_name.toLowerCase().includes(query)) {
      score = 75;
      matchType = 'name';
    }
    // Highlights match (for services)
    else if (item.highlights && item.highlights.some(highlight => highlight.toLowerCase().includes(query))) {
      score = 70;
      matchType = 'description';
    }
    // Brand name match
    else if (item.brand_name && item.brand_name.toLowerCase().includes(query)) {
      score = 65;
      matchType = 'brand';
    }
    // Category match
    else if (item.category && item.category.toLowerCase().includes(query)) {
      score = 60;
      matchType = 'category';
    }
    // Tags match
    else if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) {
      score = 50;
      matchType = 'tags';
    }
    // Description match
    else if (item.description && item.description.toLowerCase().includes(query)) {
      score = 40;
      matchType = 'description';
    }
    // Variety match
    else if (item.variety && item.variety.toLowerCase().includes(query)) {
      score = 35;
      matchType = 'description';
    }
  }

  // Boost score for popular/featured items
  if (item.isPopular) score += 10;
  if (item.isFeatured) score += 15;
  if (item.rating && item.rating >= 4) score += 5;

  return { score, type: matchType };
};

const calculatePriceInfo = (item: Item) => {
  if (!item.price) return undefined;

  const current = item.price;
  const original = item.originalPrice || item.price;
  const discount = item.discount || 0;
  const hasDiscount = discount > 0 && original > current;

  return {
    current,
    original: hasDiscount ? original : undefined,
    discount: hasDiscount ? discount : undefined,
    hasDiscount
  };
};

const generateAttractiveFeatures = (item: Item, shop: Shop): string[] => {
  const features: string[] = [];

  // Price-based features
  if (item.discount && item.discount > 0) {
    features.push(`${item.discount}% OFF`);
  }
  if (item.price && item.price < 50) {
    features.push('Budget Friendly');
  }

  // Quality features
  if (item.rating && item.rating >= 4.5) {
    features.push('⭐ Highly Rated');
  }
  if (item.isPopular) {
    features.push('🔥 Popular Choice');
  }
  if (item.isFeatured) {
    features.push('✨ Featured');
  }

  // Availability features
  if (item.type === 'product' && item.inStock && item.inStock > 10) {
    features.push('✅ In Stock');
  }
  if (item.deliveryTime) {
    features.push(`🚚 ${item.deliveryTime}`);
  }

  // Shop features
  if (shop.isVerified) {
    features.push('🛡️ Verified Shop');
  }
  if (shop.isFeatured) {
    features.push('⭐ Premium Store');
  }
  if (shop.averageRating && shop.averageRating >= 4) {
    features.push(`${shop.averageRating}⭐ Shop`);
  }

  // Type-specific features
  if (item.type === 'menu') {
    features.push('🍽️ Fresh Made');
  }
  if (item.type === 'service') {
    features.push('🔧 Service Available');
  }

  return features.slice(0, 3); // Limit to 3 most important features
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getPopularSearchTerms = async (): Promise<string[]> => {
  // This could be enhanced to track actual search analytics
  return [
    // Products
    'rice', 'flour', 'oil', 'sugar', 'tea', 'coffee',
    'milk', 'bread', 'eggs', 'vegetables', 'fruits',
    'soap', 'shampoo', 'toothpaste', 'medicine',
    
    // Menu items
    'biryani', 'pizza', 'burger', 'sandwich', 'pasta',
    'dal rice', 'roti', 'paratha', 'dosa', 'idli',
    
    // Services
    'haircut', 'massage', 'facial', 'manicure', 'repair',
    'cleaning', 'tutoring', 'consultation', 'delivery',
    
    // Shop types and location-based
    'grocery store', 'restaurant', 'pharmacy', 'salon',
    'electronics shop', 'clothing store', 'bakery',
    'near me', 'nearby', 'closest', 'open now'
  ];
};

export const getCategoryFilters = async (): Promise<Array<{ id: string; name: string; count: number }>> => {
  try {
    // Get all shops and their items to build category filters
    const shops = await getShops();
    const categoryMap = new Map<string, number>();

    for (const shop of shops) {
      try {
        const items = await getItems(shop.id);
        items.forEach(item => {
          if (item.category) {
            categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
          }
        });
      } catch (error) {
        console.error(`Error getting items for shop ${shop.id}:`, error);
      }
    }

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting category filters:', error);
    return [];
  }
};