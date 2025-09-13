import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Universal Item Type
export type ItemType = "product" | "menu" | "service";

// Base Item Interface
export interface Item {
  id: string;
  shopId: string;
  type: ItemType;
  name?: string;                   // optional for services
  description?: string;
  price?: number;
  availability?: boolean;
  categoryId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Type-specific fields:
  inStock?: number;               // required for products
  
  // Enhanced fields for all types
  hindi_name?: string;            // auto-generated transliteration
  brand_name?: string;            // for products
  category?: string;              // category name
  variety?: string;               // for products
  unit?: string;                  // for menu items
  isAvailable?: boolean;          // for menu items (alias for availability)
  highlights?: string[];          // for services (array of bullet points)
  tags?: string[];                // for services and search optimization
  imageUrl?: string;              // optional image for all types
  
  // Display enhancement fields
  originalPrice?: number;         // for showing discounts
  discount?: number;              // percentage discount
  rating?: number;                // item rating (1-5)
  reviewCount?: number;           // number of reviews
  isPopular?: boolean;            // trending/popular item
  isFeatured?: boolean;           // featured item
  deliveryTime?: string;          // estimated delivery/preparation time
  minOrder?: number;              // minimum order quantity
  
  // Metadata for future-proofing
  metadata?: Record<string, any>; // flexible JSON field
}

// Input interface for creating items
export interface ItemInput {
  shopId: string;
  type: ItemType;
  name?: string;                   // optional for services
  description?: string;
  price?: number | string;        // Accept both for input, normalize internally
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
  brand_name?: string;
  category?: string;
  variety?: string;
  unit?: string;
  isAvailable?: boolean;
  highlights?: string[];
  tags?: string[];
  imageUrl?: string;
  deliveryTime?: string;
  minOrder?: number;
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
  inStock: z.number().min(0, "Stock must be non-negative"),
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

// Input schemas for validation
export const ItemInputSchema = z.object({
  shopId: z.string().min(1, "Shop ID is required"),
  type: z.enum(["product", "menu", "service"]),
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  price: z.union([z.number(), z.string()]).optional(),
  availability: z.boolean().optional(),
  categoryId: z.string().optional(),
  
  inStock: z.union([z.number(), z.string()]).optional(),
  
  hindi_name: z.string().optional(),
  brand_name: z.string().optional(),
  category: z.string().optional(),
  variety: z.string().optional(),
  unit: z.string().optional(),
  isAvailable: z.boolean().optional(),
  highlights: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  deliveryTime: z.string().optional(),
  minOrder: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.any()).optional(),
});

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
  
  try {
    ItemInputSchema.parse(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => err.message));
    }
  }
  
  // Type-specific validation
  if (item.type === "product") {
    if (!item.name || item.name.trim() === '') {
      errors.push("Name is required for products");
    }
    if (item.inStock === undefined || item.inStock === null || item.inStock === '') {
      errors.push("Stock quantity is required for products");
    }
    if (item.price === undefined || item.price === null || item.price === '') {
      errors.push("Price is required for products");
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
  
  // Normalize minOrder for services
  if (normalized.minOrder !== undefined && normalized.minOrder !== null && normalized.minOrder !== '') {
    const minOrderNum = typeof normalized.minOrder === 'string' ? parseFloat(normalized.minOrder) : normalized.minOrder;
    normalized.minOrder = isNaN(minOrderNum) || minOrderNum < 0 ? undefined : minOrderNum;
  } else {
    normalized.minOrder = undefined;
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
  type?: string;
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