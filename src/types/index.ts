// Re-export all types for easier imports
export * from './Item';

// Shop type from firestoreService
export interface Shop {
  id: string;
  referenceId: string; // New: Auto-generated reference ID (e.g., SHP-MAN-001)
  shopName: string;
  hindi_shopName?: string;
  ownerName: string;
  type: string;
  shopType: 'product' | 'menu' | 'service' | 'office';
  serviceDetails?: ServiceDetails;
  officeDetails?: OfficeDetails;
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
  // Enhanced search fields
  name_lowercase?: string;
  tags?: string[];
  district?: string;
}

// Enhanced service details interface
export interface ServiceDetails {
  duration?: string;
  priceRange?: string;
  serviceCategory?: string;
  serviceName?: string;
  description?: string[];
  features?: string[];
  availability?: {
    days: string[];
    timeSlots: string[];
  };
}

// Office details interface for office-type shops and public facilities
export interface OfficeDetails {
  facilityType: 'government_office' | 'private_office' | 'public_toilet' | 'public_garden' | 'telecom_office' | 'bank' | 'atm' | 'hospital' | 'school' | 'other';
  department?: string;
  services?: string[];
  workingDays: string[];
  openTime: string;
  closeTime: string;
  contactPerson?: string;
  description?: string;
  facilities?: string[]; // For public facilities like parking, wheelchair access, etc.
  meta?: {
    priority?: number;
    showOnHome?: boolean;
    featuredLabel?: string;
    tags?: string[];
    languages?: string[];
    aiKeywords?: string[];
    landmark?: string;
    dataSource?: 'Official' | 'User Submitted' | 'Field Survey' | 'Other';
    referenceId?: string;
  };
}

// Search result types
export interface SearchResult {
  id: string;
  type: 'item' | 'shop' | 'menu' | 'office';
  name: string;
  description: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopType?: 'product' | 'menu' | 'service' | 'office';
  shopPhone?: string;
  price?: number;
  distance?: number;
  matchScore?: number;
  category?: string;
  availability?: boolean;
  inStock?: number;
  imageUrl?: string;
  location?: { lat: number; lng: number };
  brand_name?: string;
  variety?: string;
  hindi_name?: string;
  highlights?: string[];
}

export interface SearchSuggestion {
  text: string;
  type: 'item' | 'shop' | 'location' | 'office';
}

// Enhanced Item interface with reference ID and search fields
export interface Item {
  id: string;
  referenceId: string; // New: Auto-generated reference ID (e.g., PRD-MAN-001)
  name: string;
  hindi_name?: string;
  name_lowercase: string;
  description?: string;
  brand?: string;
  brand_lowercase?: string;
  category: string;
  subCategory?: string;
  price?: number;
  shopId: string;
  shopName: string;
  shopReferenceId?: string;
  inStock: number;
  imageUrl?: string;
  variety?: string;
  tags: string[];
  relatedIds: string[]; // Reference IDs of related products
  shopRefs: string[]; // Reference IDs of shops that sell this item
  district: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Menu Item interface with reference ID
export interface MenuItem {
  id: string;
  referenceId: string; // New: Auto-generated reference ID (e.g., MNU-MAN-001)
  name: string;
  hindi_name?: string;
  name_lowercase: string;
  description?: string;
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
  tags: string[];
  district: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Service interface with reference ID
export interface Service {
  id: string;
  referenceId: string; // New: Auto-generated reference ID (e.g., SRV-MAN-001)
  name: string;
  name_lowercase: string;
  description?: string;
  shopId: string;
  shopName: string;
  shopReferenceId: string;
  serviceCategory: string;
  priceRange?: string;
  duration?: string;
  features: string[];
  tags: string[];
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  district: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}