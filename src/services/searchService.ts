/**
 * Enhanced Unified Search System with Reference ID Support
 * Supports keyword search, related items, cross-entity results
 * Future-proof for Gemini-powered WhatsApp AI search
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  collectionGroup,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { api } from './api';
import { getEntityTypeFromReferenceId, isValidReferenceId } from '../utils/referenceId';

export interface SearchResult {
  id: string;
  referenceId: string; // Now required for all entities
  name: string;
  type: 'shop' | 'product' | 'menu' | 'service' | 'office';
  price?: number;
  distance?: number;
  matchScore?: number;
  category?: string;
  brand?: string;
  subCategory?: string;
  tags?: string[];
  relatedIds?: string[];
  shopRefs?: string[];
  district?: string;
  isFeatured?: boolean;
  availability?: boolean;
  inStock?: number;
  imageUrl?: string;
  location?: { lat: number; lng: number };
  hindi_name?: string;
  description?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'item' | 'shop' | 'location' | 'menu' | 'service' | 'office' | 'category' | 'brand' | 'variety';
  category?: string;
  shopName?: string;
  icon?: string;
}

/**
 * Search by Reference ID - Fast direct lookup
 * @param referenceId The reference ID to search for
 * @returns Single result or null
 */
export const searchByReferenceId = async (referenceId: string): Promise<SearchResult | null> => {
  if (!isValidReferenceId(referenceId)) return null;
  
  const entityType = getEntityTypeFromReferenceId(referenceId);
  if (!entityType) return null;
  
  try {
    // Map entity types to Firestore collections
    const collectionMap: Record<string, string> = {
      'shop': 'shops',
      'product': 'products',
      'menu': 'menuItems', 
      'service': 'services',
      'office': 'offices'
    };
    
    const collectionName = collectionMap[entityType];
    if (!collectionName) return null;
    
    // Query by referenceId field
    const q = query(
      collection(db, collectionName),
      where('referenceId', '==', referenceId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      referenceId: data.referenceId,
      name: data.name || data.shopName || data.serviceName || data.itemName,
      type: entityType as any,
      category: data.category || data.type,
      brand: data.brand,
      tags: data.tags || [],
      district: data.district,
      location: data.location,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured,
      matchScore: 10 // Perfect match for direct ID lookup
    };
  } catch (error) {
    console.error('Error searching by reference ID:', error);
    return null;
  }
};

/**
 * Get search suggestions with Reference ID support
 */
export const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (query.length < 1) return [];
  
  // Check if query looks like a reference ID
  if (isValidReferenceId(query.toUpperCase())) {
    const result = await searchByReferenceId(query.toUpperCase());
    if (result) {
      return [{
        text: `${result.referenceId} - ${result.name}`,
        type: result.type as any,
        category: result.category,
        icon: '🔍'
      }];
    }
  }
  
  try {
    return await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return getLocalSuggestions(query);
  }
};

/**
 * Rank search results by relevance score
 */
export const rankResult = (item: any, searchTerm: string): number => {
  let score = 0;
  const text = searchTerm.toLowerCase();
  const name = (item.name || item.shopName || item.serviceName || '').toLowerCase();
  
  // Reference ID exact match (highest priority)
  if (item.referenceId && item.referenceId.toLowerCase().includes(text)) {
    score += 10;
  }
  
  // Name exact match
  if (name === text) {
    score += 8;
  }
  
  // Name starts with query
  if (name.startsWith(text)) {
    score += 6;
  }
  
  // Name contains query
  if (name.includes(text)) {
    score += 4;
  }
  
  // Brand match
  if (item.brand && item.brand.toLowerCase().includes(text)) {
    score += 3;
  }
  
  // Category match
  if (item.category && item.category.toLowerCase().includes(text)) {
    score += 2;
  }
  
  // Tags match
  if (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(text))) {
    score += 2;
  }
  
  // District match (location relevance)
  if (item.district && item.district.toLowerCase().includes(text)) {
    score += 1;
  }
  
  // Featured items get slight boost
  if (item.isFeatured) {
    score += 0.5;
  }
  
  return score;
};

/**
 * Perform enhanced universal search across all categories
 */
export const performUniversalSearch = async (
  query: string,
  location?: { lat: number; lng: number }
): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  // Check for direct Reference ID lookup first
  if (isValidReferenceId(query.toUpperCase())) {
    const directResult = await searchByReferenceId(query.toUpperCase());
    if (directResult) {
      return [directResult];
    }
  }
  
  try {
    // Try backend search first
    const params = new URLSearchParams({ q: query });
    if (location) {
      params.append('lat', location.lat.toString());
      params.append('lng', location.lng.toString());
    }
    
    return await api.get(`/search/universal?${params.toString()}`);
  } catch (error) {
    console.error('Error performing backend search, falling back to local:', error);
    
    // Fallback to local Firestore search
    return performLocalUniversalSearch(query, location);
  }
};

/**
 * Local Firestore search as fallback
 */
const performLocalUniversalSearch = async (
  query: string,
  location?: { lat: number; lng: number }
): Promise<SearchResult[]> => {
  const searchTerm = query.toLowerCase();
  const results: SearchResult[] = [];
  
  try {
    // Search collections in parallel
    const [shopsSnapshot, productsSnapshot, servicesSnapshot, officesSnapshot] = await Promise.all([
      getDocs(collection(db, 'shops')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'offices'))
    ]);
    
    // Process shops
    shopsSnapshot.forEach(doc => {
      const data = doc.data();
      const score = rankResult(data, searchTerm);
      if (score > 0) {
        results.push({
          id: doc.id,
          referenceId: data.referenceId || `SHP-${doc.id.slice(0, 6).toUpperCase()}`,
          name: data.shopName || data.name,
          type: 'shop',
          category: data.type || data.category,
          district: data.district,
          location: data.location,
          imageUrl: data.imageUrl,
          matchScore: score
        });
      }
    });
    
    // Process products
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      const score = rankResult(data, searchTerm);
      if (score > 0) {
        results.push({
          id: doc.id,
          referenceId: data.referenceId || `PRD-${doc.id.slice(0, 6).toUpperCase()}`,
          name: data.name || data.itemName,
          type: 'product',
          category: data.category,
          brand: data.brand,
          tags: data.tags || [],
          district: data.district,
          price: data.price,
          imageUrl: data.imageUrl,
          matchScore: score
        });
      }
    });
    
    // Process services
    servicesSnapshot.forEach(doc => {
      const data = doc.data();
      const score = rankResult(data, searchTerm);
      if (score > 0) {
        results.push({
          id: doc.id,
          referenceId: data.referenceId || `SRV-${doc.id.slice(0, 6).toUpperCase()}`,
          name: data.serviceName || data.name,
          type: 'service',
          category: data.category,
          district: data.district,
          location: data.location,
          imageUrl: data.imageUrl,
          matchScore: score
        });
      }
    });
    
    // Process offices
    officesSnapshot.forEach(doc => {
      const data = doc.data();
      const score = rankResult(data, searchTerm);
      if (score > 0) {
        results.push({
          id: doc.id,
          referenceId: data.referenceId || `OFF-${doc.id.slice(0, 6).toUpperCase()}`,
          name: data.name || data.facilityName,
          type: 'office',
          category: data.facilityType || data.category,
          district: data.district,
          location: data.location,
          imageUrl: data.imageUrl,
          matchScore: score
        });
      }
    });
    
    // Sort by relevance score
    return results
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 50); // Limit results
      
  } catch (error) {
    console.error('Error in local search:', error);
    return [];
  }
};

/**
 * Get related items based on category, brand, or tags
 */
export const getRelatedItems = async (
  item: SearchResult,
  limit: number = 10
): Promise<SearchResult[]> => {
  try {
    // Try backend first
    const params = new URLSearchParams({
      referenceId: item.referenceId,
      limit: limit.toString()
    });
    
    return await api.get(`/search/related?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching related items from backend, using local:', error);
    return getLocalRelatedItems(item, limit);
  }
};

/**
 * Local related items search
 */
const getLocalRelatedItems = async (
  item: SearchResult,
  limit: number = 10
): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];
  
  try {
    // Determine which collection to search based on item type
    const collectionMap: Record<string, string> = {
      'shop': 'shops',
      'product': 'products',
      'menu': 'menuItems',
      'service': 'services',
      'office': 'offices'
    };
    
    const collectionName = collectionMap[item.type];
    if (!collectionName) return [];
    
    // Build queries for related items
    const queries = [];
    
    // Same category
    if (item.category) {
      queries.push(
        query(
          collection(db, collectionName),
          where('category', '==', item.category),
          where('referenceId', '!=', item.referenceId),
          limit(limit)
        )
      );
    }
    
    // Same brand (for products)
    if (item.brand && item.type === 'product') {
      queries.push(
        query(
          collection(db, collectionName),
          where('brand', '==', item.brand),
          where('referenceId', '!=', item.referenceId),
          limit(limit)
        )
      );
    }
    
    // Same district
    if (item.district) {
      queries.push(
        query(
          collection(db, collectionName),
          where('district', '==', item.district),
          where('referenceId', '!=', item.referenceId),
          limit(limit)
        )
      );
    }
    
    // Execute queries in parallel
    const snapshots = await Promise.all(queries.map(q => getDocs(q)));
    
    // Process results
    const seenIds = new Set([item.referenceId]);
    
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!seenIds.has(data.referenceId)) {
          seenIds.add(data.referenceId);
          results.push({
            id: doc.id,
            referenceId: data.referenceId,
            name: data.name || data.shopName || data.serviceName || data.itemName,
            type: item.type,
            category: data.category || data.type,
            brand: data.brand,
            tags: data.tags || [],
            district: data.district,
            location: data.location,
            imageUrl: data.imageUrl,
            isFeatured: data.isFeatured,
            matchScore: 5 // Related items get medium score
          });
        }
      });
    });
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error getting local related items:', error);
    return [];
  }
};

/**
 * Get "did you mean" suggestions for no results
 */
export const getDidYouMeanSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) return [];
  
  try {
    return await api.get(`/search/did-you-mean?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error('Error getting did you mean suggestions:', error);
    return [];
  }
};

/**
 * Enhanced local fallback suggestions when backend is unavailable
 */
const getLocalSuggestions = (query: string): SearchSuggestion[] => {
  const lowerQuery = query.toLowerCase();
  const allSuggestions: SearchSuggestion[] = [
    // Food items
    { text: 'pizza', type: 'menu', category: 'Italian', icon: '🍕' },
    { text: 'biryani', type: 'menu', category: 'Indian', icon: '🍛' },
    { text: 'burger', type: 'menu', category: 'Fast Food', icon: '🍔' },
    { text: 'dosa', type: 'menu', category: 'South Indian', icon: '🥞' },
    { text: 'pasta', type: 'menu', category: 'Italian', icon: '🍝' },
    { text: 'sandwich', type: 'menu', category: 'Snacks', icon: '🥪' },
    
    // General products
    { text: 'rice चावल', type: 'item', category: 'Grocery', icon: '🌾' },
    { text: 'milk दूध', type: 'item', category: 'Dairy', icon: '🥛' },
    { text: 'bread रोटी', type: 'item', category: 'Bakery', icon: '🍞' },
    { text: 'oil तेल', type: 'item', category: 'Grocery', icon: '🛢️' },
    { text: 'sugar चीनी', type: 'item', category: 'Grocery', icon: '🍯' },
    { text: 'flour आटा', type: 'item', category: 'Grocery', icon: '🌾' },
    { text: 'medicine दवा', type: 'item', category: 'Health', icon: '💊' },
    { text: 'mobile मोबाइल', type: 'item', category: 'Electronics', icon: '📱' },
    
    // Services
    { text: 'haircut', type: 'service', category: 'Beauty', icon: '✂️' },
    { text: 'repair', type: 'service', category: 'Technical', icon: '🔧' },
    { text: 'doctor', type: 'service', category: 'Health', icon: '👨‍⚕️' },
    { text: 'massage', type: 'service', category: 'Wellness', icon: '💆' },
    { text: 'cleaning', type: 'service', category: 'Home', icon: '🧹' },
    
    // Offices
    { text: 'government office', type: 'office', category: 'Government', icon: '🏛️' },
    { text: 'private office', type: 'office', category: 'Private', icon: '🏢' },
    { text: 'bank', type: 'office', category: 'Financial', icon: '🏦' },
    { text: 'post office', type: 'office', category: 'Government', icon: '📮' },
    { text: 'police station', type: 'office', category: 'Government', icon: '🚔' },
    
    // Shops
    { text: 'grocery store', type: 'shop', category: 'Shopping', icon: '🏪' },
    { text: 'restaurant', type: 'shop', category: 'Food', icon: '🍽️' },
    { text: 'pharmacy', type: 'shop', category: 'Health', icon: '💊' },
    { text: 'salon', type: 'shop', category: 'Beauty', icon: '💇' },
    { text: 'electronics shop', type: 'shop', category: 'Electronics', icon: '📱' },
    { text: 'office', type: 'shop', category: 'Office', icon: '🏢' },
    
    // Categories
    { text: 'grocery', type: 'category', category: 'Shopping', icon: '🛒' },
    { text: 'food', type: 'category', category: 'Food', icon: '🍽️' },
    { text: 'health', type: 'category', category: 'Health', icon: '🏥' },
    { text: 'beauty', type: 'category', category: 'Beauty', icon: '💄' },
    
    // Location-based
    { text: 'near me', type: 'location', category: 'Location', icon: '📍' },
    { text: 'nearby shops', type: 'location', category: 'Location', icon: '🗺️' },
    { text: 'closest restaurant', type: 'location', category: 'Location', icon: '🧭' }
  ];

  return allSuggestions
    .filter(suggestion => {
      const text = suggestion.text.toLowerCase();
      return text.includes(lowerQuery) ||
             lowerQuery.split(' ').some(word => text.includes(word)) ||
             (suggestion.category && suggestion.category.toLowerCase().includes(lowerQuery));
    })
    .sort((a, b) => {
      // Prioritize starts-with matches
      const aStartsWith = a.text.toLowerCase().startsWith(lowerQuery);
      const bStartsWith = b.text.toLowerCase().startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Then by text length
      return a.text.length - b.text.length;
    })
    .slice(0, 8);
};

/**
 * Save search to recent searches
 */
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

/**
 * Get recent searches from localStorage
 */
export const getRecentSearches = (): string[] => {
  try {
    const recent = localStorage.getItem('recentSearches');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

/**
 * Clear recent searches
 */
export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem('recentSearches');
  } catch (error) {
    console.error('Failed to clear recent searches:', error);
  }
};