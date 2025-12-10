import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { generateHindiName } from '../utils';
import { getUserRole } from './userRoleService';
import { 
  Item, 
  ItemInput, 
  ItemType,
  validateItem, 
  normalizeItemData,
  isProduct,
  isMenu,
  isService
} from '../types/Item';

// Category interface for grouping items
export interface ItemCategory {
  name: string;
  items: Item[];
  icon?: string;
  count: number;
}

// Helper function to process item data with auto-transliteration
const processItemData = (data: ItemInput): ItemInput => {
  const processed = normalizeItemData(data);

  // Auto-generate hindi_name if not provided and name is in English
  if (!processed.hindi_name || processed.hindi_name.trim() === '') {
    processed.hindi_name = generateHindiName(processed.name || '');
  }

  return processed;
};

// Get items for a shop with optional type filtering (NEW STRUCTURE)
export const getItems = async (shopId: string, type?: ItemType, includeUnavailable: boolean = false): Promise<Item[]> => {
  try {
    // Use shop-specific items subcollection
    const itemsRef = collection(db, 'shops', shopId, 'items');
    let q = query(
      itemsRef,
      orderBy('category'),
      orderBy('name')
    );

    if (type) {
      q = query(
        itemsRef,
        where('type', '==', type),
        orderBy('category'),
        orderBy('name')
      );
    }

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      shopId, // Add shopId since it's implicit in the path
      ...doc.data()
    } as Item));

    // Filter by availability unless admin or explicitly requested
    if (!includeUnavailable) {
      try {
        const role = await getUserRole();
        if (!role.isAdmin) {
      return items.filter(item => item.availability !== false && item.isAvailable !== false);
        }
      } catch (error) {
        // If role check fails, filter unavailable items for safety
        return items.filter(item => item.availability !== false && item.isAvailable !== false);
      }
    }

    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
};

// Get items grouped by category
export const getItemsByCategory = async (shopId: string, type?: ItemType): Promise<ItemCategory[]> => {
  try {
    const items = await getItems(shopId, type);

    // Group items by category
    const categoriesMap: Record<string, Item[]> = {};
    items.forEach(item => {
      const categoryName = item.category || 'Other';
      if (!categoriesMap[categoryName]) {
        categoriesMap[categoryName] = [];
      }
      categoriesMap[categoryName].push(item);
    });

    // Convert to ItemCategory array
    const categories: ItemCategory[] = Object.entries(categoriesMap).map(([name, items]) => ({
      name,
      items,
      count: items.length,
      icon: getCategoryIcon(name, type)
    }));

    return categories;
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return [];
  }
};

// Get all items for a shop (including unavailable - for admin)
export const getAllItems = async (shopId: string, type?: ItemType): Promise<Item[]> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }

    return await getItems(shopId, type, true);
  } catch (error) {
    console.error('Error fetching all items:', error);
    return [];
  }
};

// Get single item (NEW STRUCTURE)
export const getItem = async (shopId: string, itemId: string): Promise<Item | null> => {
  try {
    const itemRef = doc(db, 'shops', shopId, 'items', itemId);
    const snapshot = await getDoc(itemRef);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        shopId,
        ...snapshot.data()
      } as Item;
    }

    return null;
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
};

// Add item (Admin only) - NEW STRUCTURE
export const addItem = async (itemData: ItemInput): Promise<string> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required. Please ensure you are logged in with the admin account.');
    }


    // Validate item data
    const errors = validateItem(itemData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    if (!itemData.shopId) {
      throw new Error('shopId is required');
    }

    // Process data with auto-transliteration
    const processedData = processItemData(itemData);

    // Use shop-specific items subcollection
    const itemsRef = collection(db, 'shops', itemData.shopId, 'items');

    // Remove shopId from data since it's implicit in the path
    const { shopId, ...itemDataWithoutShopId } = processedData;

    // Remove undefined fields for Firestore compatibility
    const cleanedData = Object.fromEntries(
      Object.entries(itemDataWithoutShopId).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(itemsRef, {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

// Update item (Admin only) - NEW STRUCTURE
export const updateItem = async (
  shopId: string,
  itemId: string,
  updates: Partial<ItemInput>
): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    // Validate updates
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    // Get current item to check if hindi_name should be regenerated
    const currentItem = await getItem(shopId, itemId);
    if (!currentItem) {
      throw new Error('Item not found');
    }

    let processedUpdates = normalizeItemData({ ...currentItem, ...updates });

    // Auto-regenerate hindi_name if it's empty and name is being updated
    if (updates.name && (!currentItem.hindi_name || currentItem.hindi_name.trim() === '')) {
      processedUpdates.hindi_name = generateHindiName(updates.name);
    }

    const itemRef = doc(db, 'shops', shopId, 'items', itemId);

    // Remove shopId from updates since it's implicit in the path
    const { shopId: _, ...updatesWithoutShopId } = processedUpdates;

    // Remove undefined fields for Firestore compatibility
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updatesWithoutShopId).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(itemRef, {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

// Delete item (Admin only) - NEW STRUCTURE
export const deleteItem = async (shopId: string, itemId: string): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const itemRef = doc(db, 'shops', shopId, 'items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

// Bulk add items with auto-transliteration (Admin only) - NEW STRUCTURE
export const addBulkItems = async (shopId: string, items: Omit<ItemInput, 'shopId'>[]): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    if (!items || items.length === 0) {
      throw new Error('No items provided for bulk upload');
    }

    // Validate all items first
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      const itemWithShopId = { ...item, shopId };
      const errors = validateItem(itemWithShopId);
      if (errors.length > 0) {
        validationErrors.push(`Row ${index + 1}: ${errors.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(`Validation errors:\n${validationErrors.join('\n')}`);
    }

    // Process all items with auto-transliteration
    const processedItems = items.map(item =>
      processItemData({ ...item, shopId })
    );

    // Use batch write for better performance
    const batch = writeBatch(db);
    const itemsRef = collection(db, 'shops', shopId, 'items');

    processedItems.forEach(item => {
      const docRef = doc(itemsRef);

      // Remove shopId from data since it's implicit in the path
      const { shopId: _, ...itemWithoutShopId } = item;

      // Remove undefined fields for Firestore compatibility
      const cleanedItem = Object.fromEntries(
        Object.entries(itemWithoutShopId).filter(([_, value]) => value !== undefined)
      );

      batch.set(docRef, {
        ...cleanedItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error adding bulk items:', error);
    throw error;
  }
};

// Search items across all shops (for global search)
export const searchItemsGlobal = async (searchQuery: string, type?: ItemType): Promise<Item[]> => {
  try {
    // Use collection group query to search across all shop items
    const { collectionGroup } = await import('firebase/firestore');
    const itemsRef = collectionGroup(db, 'items');
    let q = query(itemsRef);
    
    if (type) {
      q = query(itemsRef, where('type', '==', type));
    }
    
    const snapshot = await getDocs(q);
    const allItems = snapshot.docs.map(doc => {
      const data = doc.data();
      // Extract shopId from document path: shops/{shopId}/items/{itemId}
      const pathParts = doc.ref.path.split('/');
      const shopId = pathParts[1];
      
      return {
        id: doc.id,
        shopId,
        ...data
      } as Item;
    });

    return filterItems(allItems, searchQuery);
  } catch (error) {
    console.error('Error searching items globally:', error);
    return [];
  }
};

// Search items within a specific shop
export const searchItems = async (searchQuery: string, shopId: string, type?: ItemType): Promise<Item[]> => {
  try {
    const items = await getItems(shopId, type);
    return filterItems(items, searchQuery);
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
};

// Filter items by search query
const filterItems = (items: Item[], searchQuery: string): Item[] => {
  const query = searchQuery.toLowerCase().trim();

  return items.filter(item =>
    item.name?.toLowerCase().includes(query) ||
    item.hindi_name?.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query) ||
    item.category?.toLowerCase().includes(query) ||
    item.brand_name?.toLowerCase().includes(query) ||
    (item.variety && (
      Array.isArray(item.variety) 
        ? item.variety.some(v => v.toLowerCase().includes(query))
        : item.variety.toLowerCase().includes(query)
    )) ||
    (item.packs && Array.isArray(item.packs) && item.packs.some(pack => pack.toLowerCase().includes(query))) ||
    item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
    item.highlights?.some(highlight => highlight.toLowerCase().includes(query))
  );
};

// Get category icon based on category name and type
const getCategoryIcon = (category: string, type?: ItemType): string => {
  const categoryLower = category.toLowerCase();
  
  // Type-specific icons
  if (type === 'product') {
    const productIcons: Record<string, string> = {
      'fruits': '🍎',
      'vegetables': '🥕',
      'dairy': '🥛',
      'bakery': '🍞',
      'meat': '🥩',
      'seafood': '🐟',
      'beverages': '🥤',
      'snacks': '🍿',
      'spices': '🌶️',
      'grains': '🌾',
      'default': '📦'
    };
    return productIcons[categoryLower] || productIcons['default'];
  }
  
  if (type === 'menu') {
    const menuIcons: Record<string, string> = {
      'starters': '🥗',
      'appetizers': '🥗',
      'soup': '🍲',
      'soups': '🍲',
      'main course': '🍛',
      'mains': '🍛',
      'rice': '🍚',
      'biryani': '🍚',
      'bread': '🍞',
      'roti': '🫓',
      'naan': '🫓',
      'desserts': '🧁',
      'sweets': '🍰',
      'beverages': '🥤',
      'drinks': '🥤',
      'tea': '☕',
      'coffee': '☕',
      'juice': '🧃',
      'snacks': '🍿',
      'chinese': '🥢',
      'indian': '🍛',
      'continental': '🍽️',
      'italian': '🍝',
      'pizza': '🍕',
      'burger': '🍔',
      'sandwich': '🥪',
      'salad': '🥗',
      'default': '🍽️'
    };
    return menuIcons[categoryLower] || menuIcons['default'];
  }
  
  if (type === 'service') {
    const serviceIcons: Record<string, string> = {
      'beauty': '💄',
      'haircut': '✂️',
      'massage': '💆',
      'spa': '🧖',
      'fitness': '💪',
      'education': '📚',
      'tutoring': '👨‍🏫',
      'repair': '🔧',
      'cleaning': '🧽',
      'delivery': '🚚',
      'consultation': '💬',
      'default': '🛠️'
    };
    return serviceIcons[categoryLower] || serviceIcons['default'];
  }
  
  return '📋';
};

// Get default categories for different shop types and item types
export const getDefaultCategories = (shopType: string, itemType: ItemType): string[] => {
  if (itemType === 'menu') {
    switch (shopType.toLowerCase()) {
      case 'restaurant':
        return ['Starters', 'Soups', 'Main Course', 'Rice & Biryani', 'Bread', 'Desserts', 'Beverages'];
      case 'cafe':
        return ['Coffee', 'Tea', 'Cold Beverages', 'Snacks', 'Sandwiches', 'Pastries', 'Desserts'];
      case 'hotel':
        return ['Room Service', 'Breakfast', 'Lunch', 'Dinner', 'Beverages', 'Desserts'];
      default:
        return ['Food Items', 'Beverages'];
    }
  }
  
  if (itemType === 'product') {
    switch (shopType.toLowerCase()) {
      case 'grocery':
      case 'fruits & vegetables (sabzi mandi)':
        return ['Fresh Fruits', 'Vegetables', 'Leafy Greens', 'Exotic Fruits', 'Organic Produce'];
      case 'dairy & bakery':
        return ['Fresh Bread', 'Cakes & Pastries', 'Milk Products', 'Cookies & Biscuits', 'Dairy Items'];
      case 'sweet shops (mithai)':
        return ['Traditional Sweets', 'Dry Fruits', 'Namkeen', 'Festival Specials', 'Gift Boxes'];
      default:
        return ['Products', 'Accessories'];
    }
  }
  
  if (itemType === 'service') {
    switch (shopType.toLowerCase()) {
      case 'beauty salon':
      case 'barber shop':
        return ['Haircut', 'Styling', 'Coloring', 'Treatment'];
      case 'spa':
        return ['Massage', 'Facial', 'Body Treatment', 'Wellness'];
      case 'fitness':
        return ['Personal Training', 'Group Classes', 'Consultation'];
      case 'education':
        return ['Tutoring', 'Courses', 'Consultation'];
      default:
        return ['Services', 'Consultation'];
    }
  }
  
  return ['General'];
};

// Parse CSV data for bulk upload
export const parseItemCSV = (csvData: string, itemType: ItemType): Omit<ItemInput, 'shopId'>[] => {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['name'];

  // Validate headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const items: Omit<ItemInput, 'shopId'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
    }

    const item: any = { type: itemType };

    headers.forEach((header, index) => {
      const value = values[index] || '';

      switch (header) {
        case 'name':
          item.name = value;
          break;
        case 'hindi_name':
          item.hindi_name = value || undefined;
          break;
        case 'description':
          item.description = value || undefined;
          break;
        case 'category':
          item.category = value || undefined;
          break;
        case 'price':
          item.price = value ? parseFloat(value) : undefined;
          break;
        case 'instock':
        case 'in_stock':
          item.inStock = value ? parseFloat(value) : undefined;
          break;
        case 'availability':
        case 'isavailable':
        case 'is_available':
          item.availability = value ? (value.toLowerCase() === 'true' || value === '1') : true;
          break;
        case 'brand_name':
          item.brand_name = value || undefined;
          break;
        case 'variety':
          item.variety = value ? value.split(',').map(v => v.trim()).filter(v => v) : undefined;
          break;
        case 'packs':
          item.packs = value ? value.split(',').map(p => p.trim()).filter(p => p) : undefined;
          break;
        case 'pricerange':
        case 'price_range':
          if (value && value.includes('-')) {
            const parts = value.split('-').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              item.priceRange = [parts[0], parts[1]];
            }
          }
          break;
        case 'unit':
          item.unit = value || undefined;
          break;
        case 'highlights':
          item.highlights = value ? value.split(';').map(h => h.trim()).filter(h => h) : undefined;
          break;
        case 'tags':
          item.tags = value ? value.split(';').map(t => t.trim()).filter(t => t) : undefined;
          break;
      }
    });

    // Validate item
    const errors = validateItem({ ...item, shopId: 'temp' });
    if (errors.length > 0) {
      throw new Error(`Row ${i + 1}: ${errors.join(', ')}`);
    }

    items.push(item);
  }

  return items;
};

// Real-time transliteration for UI
export const generateHindiName = (englishName: string): string => {
  return generateHindiName(englishName);
};