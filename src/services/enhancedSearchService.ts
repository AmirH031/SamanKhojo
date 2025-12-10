/**
 * Enhanced Search Service
 * Unified search across products, shops, services, menu items, and offices
 * Supports reference ID lookup, related items, and advanced filtering
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  SearchableEntity, 
  SearchResult, 
  SearchResponse, 
  SearchFilters, 
  SearchAnalytics,
  RelatedItemsConfig,
  SearchSuggestion
} from '../types/search';
import { parseReferenceId, getEntityTypeFromId } from '../utils/referenceIdGenerator';

/**
 * Main search function - searches across all entity types
 */
export async function searchAll(
  searchTerm: string, 
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = Date.now();
  
  try {
    // Normalize search term
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Check if it's a reference ID search
    if (parseReferenceId(searchTerm)) {
      const directResult = await searchByReferenceId(searchTerm);
      if (directResult) {
        return {
          results: [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }],
          totalResults: 1,
          searchTime: Date.now() - startTime,
          suggestions: [],
          relatedSearches: [],
          categories: {
            products: directResult.type === 'product' ? [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }] : [],
            shops: directResult.type === 'shop' ? [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }] : [],
            menuItems: directResult.type === 'menu' ? [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }] : [],
            services: directResult.type === 'service' ? [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }] : [],
            offices: directResult.type === 'office' ? [{ entity: directResult, score: 100, matchType: 'exact', matchedFields: ['referenceId'] }] : []
          }
        };
      }
    }

    // Parallel search across all collections
    const searchPromises = [];
    
    if (!filters.entityTypes || filters.entityTypes.includes('product')) {
      searchPromises.push(searchProducts(normalizedTerm, filters));
    }
    if (!filters.entityTypes || filters.entityTypes.includes('shop')) {
      searchPromises.push(searchShops(normalizedTerm, filters));
    }
    if (!filters.entityTypes || filters.entityTypes.includes('menu')) {
      searchPromises.push(searchMenuItems(normalizedTerm, filters));
    }
    if (!filters.entityTypes || filters.entityTypes.includes('service')) {
      searchPromises.push(searchServices(normalizedTerm, filters));
    }
    if (!filters.entityTypes || filters.entityTypes.includes('office')) {
      searchPromises.push(searchOffices(normalizedTerm, filters));
    }

    const searchResults = await Promise.all(searchPromises);
    
    // Combine and rank results
    const allResults: SearchResult[] = searchResults.flat();
    const rankedResults = rankSearchResults(allResults, normalizedTerm);
    
    // Apply sorting and pagination
    const sortedResults = applySorting(rankedResults, filters.sortBy || 'relevance');
    const paginatedResults = applyPagination(sortedResults, filters.limit, filters.offset);
    
    // Generate suggestions and related searches
    const suggestions = await generateSearchSuggestions(normalizedTerm);
    const relatedSearches = generateRelatedSearches(normalizedTerm, allResults);
    
    // Categorize results
    const categories = categorizeResults(paginatedResults);
    
    // Log analytics
    logSearchAnalytics({
      query: searchTerm,
      resultsCount: allResults.length,
      searchTime: Date.now() - startTime,
      filters
    });

    return {
      results: paginatedResults,
      totalResults: allResults.length,
      searchTime: Date.now() - startTime,
      suggestions,
      relatedSearches,
      categories
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      results: [],
      totalResults: 0,
      searchTime: Date.now() - startTime,
      suggestions: [],
      relatedSearches: [],
      categories: {
        products: [],
        shops: [],
        menuItems: [],
        services: [],
        offices: []
      }
    };
  }
}

/**
 * Search by reference ID for direct lookup
 */
export async function searchByReferenceId(referenceId: string): Promise<SearchableEntity | null> {
  const parsed = parseReferenceId(referenceId);
  if (!parsed) return null;

  const collectionMap = {
    SHP: 'shops',
    PRD: 'items',
    MNU: 'menuItems',
    SRV: 'services',
    OFF: 'offices'
  };

  const collectionName = collectionMap[parsed.prefix];
  if (!collectionName) return null;

  try {
    const q = query(
      collection(db, collectionName),
      where('referenceId', '==', referenceId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      type: getEntityTypeFromPrefix(parsed.prefix),
      ...doc.data()
    } as SearchableEntity;
  } catch (error) {
    console.error('Reference ID search error:', error);
    return null;
  }
}

/**
 * Get related items based on category, brand, or tags
 */
export async function getRelatedItems(
  entityId: string, 
  config: RelatedItemsConfig = { maxResults: 10, includeTypes: ['category', 'brand', 'tags'], excludeCurrentItem: true }
): Promise<SearchResult[]> {
  try {
    // First get the current entity
    const entity = await searchByReferenceId(entityId);
    if (!entity) return [];

    const relatedResults: SearchResult[] = [];

    // Search for related items based on configuration
    if (config.includeTypes.includes('category') && 'category' in entity) {
      const categoryResults = await searchByCategory(entity.category, entity.type);
      relatedResults.push(...categoryResults);
    }

    if (config.includeTypes.includes('brand') && 'brand' in entity && entity.brand) {
      const brandResults = await searchByBrand(entity.brand);
      relatedResults.push(...brandResults);
    }

    if (config.includeTypes.includes('tags')) {
      const tagResults = await searchByTags(entity.tags);
      relatedResults.push(...tagResults);
    }

    // Remove duplicates and current item
    const uniqueResults = removeDuplicateResults(relatedResults);
    const filteredResults = config.excludeCurrentItem 
      ? uniqueResults.filter(r => r.entity.id !== entity.id)
      : uniqueResults;

    // Sort by relevance and limit
    return filteredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, config.maxResults);

  } catch (error) {
    console.error('Related items error:', error);
    return [];
  }
}

/**
 * Search products collection
 */
async function searchProducts(searchTerm: string, filters: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Search by name
    const nameQuery = query(
      collection(db, 'items'),
      where('name_lowercase', '>=', searchTerm),
      where('name_lowercase', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const nameSnapshot = await getDocs(nameQuery);
    nameSnapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        entity: { id: doc.id, type: 'product', ...data } as SearchableEntity,
        score: calculateScore(data, searchTerm, 'name'),
        matchType: 'exact',
        matchedFields: ['name']
      });
    });

    // Search by tags
    const tagQuery = query(
      collection(db, 'items'),
      where('tags', 'array-contains-any', [searchTerm]),
      limit(20)
    );
    
    const tagSnapshot = await getDocs(tagQuery);
    tagSnapshot.forEach(doc => {
      const data = doc.data();
      if (!results.find(r => r.entity.id === doc.id)) {
        results.push({
          entity: { id: doc.id, type: 'product', ...data } as SearchableEntity,
          score: calculateScore(data, searchTerm, 'tags'),
          matchType: 'tag',
          matchedFields: ['tags']
        });
      }
    });

    // Search by brand if applicable
    if (searchTerm.length > 2) {
      const brandQuery = query(
        collection(db, 'items'),
        where('brand_lowercase', '>=', searchTerm),
        where('brand_lowercase', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      
      const brandSnapshot = await getDocs(brandQuery);
      brandSnapshot.forEach(doc => {
        const data = doc.data();
        if (!results.find(r => r.entity.id === doc.id)) {
          results.push({
            entity: { id: doc.id, type: 'product', ...data } as SearchableEntity,
            score: calculateScore(data, searchTerm, 'brand'),
            matchType: 'brand',
            matchedFields: ['brand']
          });
        }
      });
    }

  } catch (error) {
    console.error('Product search error:', error);
  }

  return results;
}

/**
 * Search shops collection
 */
async function searchShops(searchTerm: string, filters: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const q = query(
      collection(db, 'shops'),
      where('name_lowercase', '>=', searchTerm),
      where('name_lowercase', '<=', searchTerm + '\uf8ff'),
      limit(15)
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        entity: { id: doc.id, type: 'shop', ...data } as SearchableEntity,
        score: calculateScore(data, searchTerm, 'name'),
        matchType: 'exact',
        matchedFields: ['name']
      });
    });

  } catch (error) {
    console.error('Shop search error:', error);
  }

  return results;
}

/**
 * Search menu items collection
 */
async function searchMenuItems(searchTerm: string, filters: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const q = query(
      collection(db, 'menuItems'),
      where('name_lowercase', '>=', searchTerm),
      where('name_lowercase', '<=', searchTerm + '\uf8ff'),
      limit(15)
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        entity: { id: doc.id, type: 'menu', ...data } as SearchableEntity,
        score: calculateScore(data, searchTerm, 'name'),
        matchType: 'exact',
        matchedFields: ['name']
      });
    });

  } catch (error) {
    console.error('Menu items search error:', error);
  }

  return results;
}

/**
 * Search services collection
 */
async function searchServices(searchTerm: string, filters: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const q = query(
      collection(db, 'services'),
      where('name_lowercase', '>=', searchTerm),
      where('name_lowercase', '<=', searchTerm + '\uf8ff'),
      limit(15)
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        entity: { id: doc.id, type: 'service', ...data } as SearchableEntity,
        score: calculateScore(data, searchTerm, 'name'),
        matchType: 'exact',
        matchedFields: ['name']
      });
    });

  } catch (error) {
    console.error('Services search error:', error);
  }

  return results;
}

/**
 * Search offices collection
 */
async function searchOffices(searchTerm: string, filters: SearchFilters): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const q = query(
      collection(db, 'offices'),
      where('name_lowercase', '>=', searchTerm),
      where('name_lowercase', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        entity: { id: doc.id, type: 'office', ...data } as SearchableEntity,
        score: calculateScore(data, searchTerm, 'name'),
        matchType: 'exact',
        matchedFields: ['name']
      });
    });

  } catch (error) {
    console.error('Offices search error:', error);
  }

  return results;
}

/**
 * Calculate relevance score for search results
 */
function calculateScore(item: any, searchTerm: string, matchField: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Exact name match
  if (item.name_lowercase === term) score += 10;
  else if (item.name_lowercase?.includes(term)) score += 7;
  
  // Brand match
  if (item.brand_lowercase === term) score += 8;
  else if (item.brand_lowercase?.includes(term)) score += 5;
  
  // Category match
  if (item.category?.toLowerCase() === term) score += 6;
  else if (item.category?.toLowerCase().includes(term)) score += 3;
  
  // Tag matches
  if (item.tags?.some((tag: string) => tag.toLowerCase() === term)) score += 5;
  else if (item.tags?.some((tag: string) => tag.toLowerCase().includes(term))) score += 2;
  
  // Featured items get bonus
  if (item.isFeatured) score += 2;
  
  // In stock items get bonus
  if (item.inStock > 0) score += 1;
  
  return score;
}

/**
 * Rank search results by relevance
 */
function rankSearchResults(results: SearchResult[], searchTerm: string): SearchResult[] {
  return results.sort((a, b) => {
    // Primary sort by score
    if (b.score !== a.score) return b.score - a.score;
    
    // Secondary sort by match type priority
    const matchTypePriority = { exact: 4, brand: 3, category: 2, tag: 1, partial: 0, related: 0 };
    const aPriority = matchTypePriority[a.matchType] || 0;
    const bPriority = matchTypePriority[b.matchType] || 0;
    
    if (bPriority !== aPriority) return bPriority - aPriority;
    
    // Tertiary sort by featured status
    if (a.entity.isFeatured !== b.entity.isFeatured) {
      return a.entity.isFeatured ? -1 : 1;
    }
    
    // Final sort by creation date (newest first)
    return new Date(b.entity.createdAt).getTime() - new Date(a.entity.createdAt).getTime();
  });
}

/**
 * Apply sorting to results
 */
function applySorting(results: SearchResult[], sortBy: string): SearchResult[] {
  switch (sortBy) {
    case 'price':
      return results.sort((a, b) => {
        const aPrice = 'price' in a.entity ? a.entity.price || 0 : 0;
        const bPrice = 'price' in b.entity ? b.entity.price || 0 : 0;
        return aPrice - bPrice;
      });
    
    case 'rating':
      return results.sort((a, b) => {
        const aRating = 'averageRating' in a.entity ? a.entity.averageRating || 0 : 0;
        const bRating = 'averageRating' in b.entity ? b.entity.averageRating || 0 : 0;
        return bRating - aRating;
      });
    
    case 'newest':
      return results.sort((a, b) => 
        new Date(b.entity.createdAt).getTime() - new Date(a.entity.createdAt).getTime()
      );
    
    case 'distance':
      return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    default: // relevance
      return results;
  }
}

/**
 * Apply pagination to results
 */
function applyPagination(results: SearchResult[], limit?: number, offset?: number): SearchResult[] {
  const start = offset || 0;
  const end = limit ? start + limit : undefined;
  return results.slice(start, end);
}

/**
 * Categorize results by entity type
 */
function categorizeResults(results: SearchResult[]) {
  return {
    products: results.filter(r => r.entity.type === 'product'),
    shops: results.filter(r => r.entity.type === 'shop'),
    menuItems: results.filter(r => r.entity.type === 'menu'),
    services: results.filter(r => r.entity.type === 'service'),
    offices: results.filter(r => r.entity.type === 'office')
  };
}

/**
 * Generate search suggestions
 */
async function generateSearchSuggestions(searchTerm: string): Promise<string[]> {
  // This would typically query a suggestions collection or use analytics data
  // For now, return some basic suggestions
  return [
    `${searchTerm} near me`,
    `${searchTerm} shop`,
    `${searchTerm} service`,
    `best ${searchTerm}`,
    `${searchTerm} price`
  ];
}

/**
 * Generate related search terms
 */
function generateRelatedSearches(searchTerm: string, results: SearchResult[]): string[] {
  const related = new Set<string>();
  
  results.forEach(result => {
    if ('category' in result.entity && result.entity.category) {
      related.add(result.entity.category.toLowerCase());
    }
    if ('brand' in result.entity && result.entity.brand) {
      related.add(result.entity.brand.toLowerCase());
    }
    result.entity.tags?.forEach(tag => related.add(tag.toLowerCase()));
  });
  
  return Array.from(related).slice(0, 5);
}

/**
 * Helper functions
 */
function getEntityTypeFromPrefix(prefix: string): 'product' | 'shop' | 'menu' | 'service' | 'office' {
  const typeMap = {
    SHP: 'shop' as const,
    PRD: 'product' as const,
    MNU: 'menu' as const,
    SRV: 'service' as const,
    OFF: 'office' as const
  };
  return typeMap[prefix as keyof typeof typeMap] || 'product';
}

async function searchByCategory(category: string, entityType: string): Promise<SearchResult[]> {
  // Implementation for category-based search
  return [];
}

async function searchByBrand(brand: string): Promise<SearchResult[]> {
  // Implementation for brand-based search
  return [];
}

async function searchByTags(tags: string[]): Promise<SearchResult[]> {
  // Implementation for tag-based search
  return [];
}

function removeDuplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    if (seen.has(result.entity.id)) return false;
    seen.add(result.entity.id);
    return true;
  });
}

/**
 * Log search analytics
 */
function logSearchAnalytics(analytics: Partial<SearchAnalytics>) {
  // Implementation for logging search analytics
  console.log('Search Analytics:', analytics);
}