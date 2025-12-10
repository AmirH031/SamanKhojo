/**
 * Enhanced Search System Types
 * Supports unified search across products, shops, services, menu items, and offices
 */

export interface BaseSearchableEntity {
  id: string;
  referenceId: string;
  name: string;
  name_lowercase: string;
  description?: string;
  district: string;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SearchableProduct extends BaseSearchableEntity {
  type: 'product';
  brand?: string;
  category: string;
  subCategory?: string;
  price?: number;
  shopId: string;
  shopName: string;
  shopReferenceId: string;
  relatedIds: string[];
  shopRefs: string[];
  inStock: number;
  imageUrl?: string;
  variety?: string;
  hindi_name?: string;
}

export interface SearchableShop extends BaseSearchableEntity {
  type: 'shop';
  ownerName: string;
  shopType: 'product' | 'menu' | 'service' | 'office';
  category: string;
  address: string;
  phone?: string;
  location: {
    lat: number;
    lng: number;
  };
  openingTime?: string;
  closingTime?: string;
  averageRating?: number;
  totalReviews?: number;
  items?: string[];
  imageUrl?: string;
}

export interface SearchableMenuItem extends BaseSearchableEntity {
  type: 'menu';
  shopId: string;
  shopName: string;
  shopReferenceId: string;
  category: string;
  price: number;
  isVeg: boolean;
  spiceLevel?: string;
  preparationTime?: string;
  ingredients?: string[];
  imageUrl?: string;
  hindi_name?: string;
}

export interface SearchableService extends BaseSearchableEntity {
  type: 'service';
  shopId: string;
  shopName: string;
  shopReferenceId: string;
  serviceCategory: string;
  priceRange?: string;
  duration?: string;
  features: string[];
  availability?: {
    days: string[];
    timeSlots: string[];
  };
}

export interface SearchableOffice extends BaseSearchableEntity {
  type: 'office';
  facilityType: string;
  services: string[];
  workingDays: string[];
  openTime: string;
  closeTime: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  meta?: {
    priority?: number;
    showOnHome?: boolean;
    featuredLabel?: string;
    languages?: string[];
    landmark?: string;
    dataSource?: string;
  };
}

export type SearchableEntity = 
  | SearchableProduct 
  | SearchableShop 
  | SearchableMenuItem 
  | SearchableService 
  | SearchableOffice;

export interface SearchResult {
  entity: SearchableEntity;
  score: number;
  matchType: 'exact' | 'partial' | 'tag' | 'category' | 'brand' | 'related';
  matchedFields: string[];
  distance?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
  relatedSearches: string[];
  categories: {
    products: SearchResult[];
    shops: SearchResult[];
    menuItems: SearchResult[];
    services: SearchResult[];
    offices: SearchResult[];
  };
}

export interface SearchFilters {
  entityTypes?: ('product' | 'shop' | 'menu' | 'service' | 'office')[];
  categories?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    lat: number;
    lng: number;
    radius: number; // in km
  };
  district?: string;
  isFeatured?: boolean;
  isOpen?: boolean;
  rating?: number;
  sortBy?: 'relevance' | 'price' | 'rating' | 'distance' | 'newest';
  limit?: number;
  offset?: number;
}

export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  searchTime: number;
  userId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  filters?: SearchFilters;
  clickedResults?: string[];
  timestamp: Date;
}

export interface RelatedItemsConfig {
  maxResults: number;
  includeTypes: ('brand' | 'category' | 'tags' | 'shop')[];
  excludeCurrentItem: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'entity' | 'category' | 'brand';
  count?: number;
  entityType?: 'product' | 'shop' | 'menu' | 'service' | 'office';
}