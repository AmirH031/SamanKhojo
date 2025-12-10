import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Universal Item Type
export type ItemType = "product" | "menu" | "service";

// Company variation interface for multi-company support
export interface CompanyVariation {
  companyName: string;
  variations: Array<{
    size: string;        // e.g., "small pack", "big pack", "250ml", "500ml"
    price: number;       // price for that variation
    availability?: boolean; // availability for this specific variation
  }>;
}

// Base Item Interface
export interface Item {
  id: string;
  shopId: string;
  type: ItemType;
  name?: string;                   // optional for services
  description?: string;
  price?: number;                  // deprecated - use companies array for pricing
  availability?: boolean;
  categoryId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Type-specific fields:
  inStock?: number | boolean;     // required for products - now supports boolean (true/false for in stock/out of stock)
  
  // Enhanced fields for all types
  hindi_name?: string;            // auto-generated transliteration
  brand_name?: string | string[]; // support both single and multiple brands
  category?: string;              // category name
  variety?: string[];             // for products - now array for multiple varieties
  unit?: string;                  // for menu items
  isAvailable?: boolean;          // for menu items (alias for availability)
  highlights?: string[];          // for services (array of bullet points)
  tags?: string[];                // for services and search optimization
  imageUrl?: string;              // optional image for all types
  
  // NEW: Multi-company support with variations
  companies?: CompanyVariation[]; // array of companies with their variations and pricing
  
  // NEW: ProductItem specific fields (when type = "product")
  packs?: string[];               // e.g., ["Small", "Medium", "Large"]
  priceRange?: [number, number];  // [min, max] price range
  
  // Display enhancement fields
  originalPrice?: number;         // for showing discounts
  discount?: number;              // percentage discount
  rating?: number;                // item rating (1-5)
  reviewCount?: number;           // number of reviews
  isPopular?: boolean;            // trending/popular item
  isFeatured?: boolean;           // featured item
  
  // Computed fields (calculated by backend)
  primaryCompany?: string;        // most popular/default company name
  
  // Metadata for future-proofing
  metadata?: Record<string, any>; // flexible JSON field
}

// Input interface for creating items
export interface ItemInput {
  shopId: string;
  type: ItemType;
  name?: string;                   // optional for services
  description?: string;
  price?: number | string;        // Accept both for input, normalize internally (legacy support)
  availability?: boolean;
  categoryId?: string;

  // Type-specific fields
  /**
   * For products: required, boolean (true/false) or number (1/0)
   * For menu/services: optional
   */
  inStock?: boolean | number | string;
  
  // Enhanced fields
  hindi_name?: string;
  brand_name?: string | string[]; // Accept both string and array for multiple brands
  category?: string;
  variety?: string | string[];    // Accept both string and array for variety
  unit?: string;
  isAvailable?: boolean;
  highlights?: string[];
  tags?: string[];
  imageUrl?: string;
  
  // NEW: ProductItem specific fields
  packs?: string | string[];      // Accept both string and array for packs
  priceRange?: string | [number, number]; // Accept "min-max" string or [min, max] array
  
  // NEW: Multi-company support
  companies?: CompanyVariation[];
  
  metadata?: Record<string, any>;
}

// Zod Schemas for Validation
export const BaseItemSchema = z.object({
  id: z.string(),
  shopId: z.string(),
  type: z.enum(["product", "menu", "service"]),
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  availability: z.boolean().optional(),
  categoryId: z.string().optional(),
  createdAt: z.any(), // Timestamp
  updatedAt: z.any(), // Timestamp
  
  // Enhanced fields
  hindi_name: z.string().optional(),
  brand_name: z.string().optional(),
  category: z.string().optional(),
  variety: z.string().optional(),
  unit: z.string().optional(),
  isAvailable: z.boolean().optional(),
  highlights: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

// Product-specific schema
export const ProductSchema = BaseItemSchema.extend({
  type: z.literal("product"),
  inStock: z.union([z.number().min(0, "Stock must be non-negative"), z.boolean()]),
  price: z.number().min(0, "Price must be positive"),
});

// Menu-specific schema
export const MenuSchema = BaseItemSchema.extend({
  type: z.literal("menu"),
  name: z.string().min(1, "Menu item name is required"),
  // price is optional for menu items
  // isAvailable or availability can be used
});

// Service-specific schema
export const ServiceSchema = BaseItemSchema.extend({
  type: z.literal("service"),
  name: z.string().optional(), // Name is optional for services
  highlights: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Input schemas for validation (more lenient for bulk uploads)
export const ItemInputSchema = z.object({
  shopId: z.string().min(1, "Shop ID is required"),
  type: z.enum(["product", "menu", "service"]),
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  price: z.union([z.number(), z.string()]).optional(),
  availability: z.boolean().optional(),
  categoryId: z.string().optional(),
  
  inStock: z.union([z.number(), z.string(), z.boolean()]).optional(),
  
  hindi_name: z.string().optional(),
  brand_name: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.string().optional(),
  variety: z.union([z.string(), z.array(z.string())]).optional(),
  unit: z.string().optional(),
  isAvailable: z.boolean().optional(),
  highlights: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(), // Remove URL validation for more flexibility
  metadata: z.record(z.any()).optional(),
  packs: z.union([z.string(), z.array(z.string()), z.number()]).optional(),
  priceRange: z.string().optional(),
}).passthrough(); // Allow additional fields

// Type guards
export const isProduct = (item: Item): item is Item & { type: "product"; inStock: number; price: number } => {
  return item.type === "product";
};

export const isMenu = (item: Item): item is Item & { type: "menu" } => {
  return item.type === "menu";
};

export const isService = (item: Item): item is Item & { type: "service" } => {
  return item.type === "service";
};

// Validation functions
export const validateItem = (item: Partial<ItemInput>): string[] => {
  const errors: string[] = [];
  
  // Skip Zod validation for bulk uploads to be more lenient
  // Only do basic required field validation
  
  // Type-specific validation
  if (item.type === "product") {
    if (!item.name || item.name.trim() === '') {
      errors.push("Name is required for products");
    }
    // More lenient validation - accept any truthy value for inStock
    if (item.inStock === undefined || item.inStock === null) {
      // Set default if not provided
      (item as any).inStock = true;
    }
    // More lenient price validation - accept price ranges and strings
    if (item.price === undefined || item.price === null || item.price === '') {
      // Check if priceRange is provided instead
      if (!(item as any).priceRange) {
        errors.push("Price or price range is required for products");
      }
    }
  }
  
  if (item.type === "menu") {
    if (!item.name || item.name.trim() === '') {
      errors.push("Name is required for menu items");
    }
  }
  
  if (item.type === "service") {
    // For services, either name or description should be provided
    if ((!item.name || item.name.trim() === '') && (!item.description || item.description.trim() === '')) {
      errors.push("Either name or description is required for services");
    }
  }
  
  return errors;
};

// Helper function to normalize item data
export const normalizeItemData = (data: ItemInput): ItemInput => {
  const normalized = { ...data };
  
  // Normalize price
  if (normalized.price !== undefined && normalized.price !== null && normalized.price !== '') {
    const priceNum = typeof normalized.price === 'string' ? parseFloat(normalized.price) : normalized.price;
    normalized.price = isNaN(priceNum) || priceNum < 0 ? undefined : priceNum;
  } else {
    normalized.price = undefined;
  }
  
  // Normalize inStock
  if (normalized.inStock !== undefined && normalized.inStock !== null && normalized.inStock !== '') {
    const stockNum = typeof normalized.inStock === 'string' ? parseFloat(normalized.inStock) : normalized.inStock;
    normalized.inStock = isNaN(stockNum) || stockNum < 0 ? undefined : stockNum;
  } else {
    normalized.inStock = undefined;
  }
  
  // Set default availability
  if (normalized.availability === undefined && normalized.isAvailable === undefined) {
    normalized.availability = true;
  }
  
  // Sync availability and isAvailable
  if (normalized.isAvailable !== undefined) {
    normalized.availability = normalized.isAvailable;
  }
  

  
  // Clean up highlights array
  if (normalized.highlights) {
    normalized.highlights = normalized.highlights.filter(h => h && h.trim()).map(h => h.trim());
    if (normalized.highlights.length === 0) {
      normalized.highlights = undefined;
    }
  }
  
  // Clean up tags array
  if (normalized.tags) {
    normalized.tags = normalized.tags.filter(t => t && t.trim()).map(t => t.trim().toLowerCase());
    if (normalized.tags.length === 0) {
      normalized.tags = undefined;
    }
  }
  
  return normalized;
};

// Legacy compatibility types (for migration)
export interface MenuItem {
  id: string;
  shopId: string;
  name: string;
  hindi_name?: string;
  description?: string;
  category?: string;
  price?: number;
  isAvailable: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductItem {
  id: string;
  shopId: string;
  name: string;
  hindi_name?: string;
  brand_name?: string;
  category?: string;
  variety?: string;
  price: number;
  inStock: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ServiceItem {
  id: string;
  shopId: string;
  name?: string;
  description?: string;
  price?: number;
  highlights?: string[];
  tags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Migration helpers
export const migrateMenuItemToItem = (menuItem: MenuItem): Item => ({
  ...menuItem,
  type: "menu" as const,
  availability: menuItem.isAvailable,
  updatedAt: menuItem.updatedAt || menuItem.createdAt,
});

export const migrateProductItemToItem = (productItem: ProductItem): Item => ({
  ...productItem,
  type: "product" as const,
  availability: true, // assume available if not specified
  updatedAt: productItem.updatedAt || productItem.createdAt,
});

export const migrateServiceItemToItem = (serviceItem: ServiceItem): Item => ({
  ...serviceItem,
  type: "service" as const,
  name: serviceItem.name || "Service", // provide default name
  availability: true, // assume available if not specified
  updatedAt: serviceItem.updatedAt || serviceItem.createdAt,
});