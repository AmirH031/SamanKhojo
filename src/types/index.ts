// Re-export all types for easier imports
export * from './Item';

// Shop type from firestoreService
export interface Shop {
  id: string;
  shopName: string;
  hindi_shopName?: string;
  ownerName: string;
  type: string;
  shopType: 'product' | 'menu' | 'service';
  serviceDetails?: string[];
  address: string;
  phone: string;
  openingTime?: string;
  closingTime?: string;
  mapLink?: string;
  isOpen: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isHidden: boolean;
  location: {
    lat: number;
    lng: number;
  };
  items?: string[];
  imageUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  ratings?: number[];
  createdAt: any;
  updatedAt: any;
  distance?: number;
}

// Search result types
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