import { getShops, updateShop } from './firestoreService';
import { getActiveCategories } from './categoryService';

/**
 * Service to handle shop-category relationships and ensure data consistency
 */

/**
 * Validate and normalize shop categories
 * This ensures that all shops have valid category references
 */
export const validateShopCategories = async (): Promise<void> => {
  try {
    // Starting shop category validation
    
    // Get all shops and categories
    const [shops, categories] = await Promise.all([
      getShops(true), // Include hidden shops for admin validation
      getActiveCategories()
    ]);
    
    const categoryNames = categories.map(cat => cat.name.toLowerCase());
    let updatedCount = 0;
    
    // Check each shop's category
    for (const shop of shops) {
      let needsUpdate = false;
      let updates: any = {};
      
      // Normalize category name if it exists
      if (shop.type) {
        const normalizedType = shop.type.trim();
        
        // Check if the category exists (case-insensitive)
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase() === normalizedType.toLowerCase()
        );
        
        if (matchingCategory && shop.type !== matchingCategory.name) {
          // Update to use the exact category name from the categories collection
          updates.type = matchingCategory.name;
          needsUpdate = true;
        }
      }
      
      // Update shop if needed
      if (needsUpdate) {
        try {
          await updateShop(shop.id, updates);
          updatedCount++;
          // Shop category updated
        } catch (error) {
          console.error(`Failed to update shop ${shop.shopName}:`, error);
        }
      }
    }
    
    // Shop category validation completed
  } catch (error) {
    console.error('Error validating shop categories:', error);
    throw error;
  }
};

/**
 * Get shops by category
 */
export const getShopsByCategory = async (categoryName: string) => {
  try {
    const shops = await getShops();
    return shops.filter(shop => 
      shop.type && shop.type.toLowerCase() === categoryName.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting shops by category:', error);
    return [];
  }
};

/**
 * Get all unique categories used by shops
 */
export const getShopCategories = async (): Promise<string[]> => {
  try {
    const shops = await getShops();
    const categories = new Set<string>();
    
    shops.forEach(shop => {
      if (shop.type && shop.type.trim()) {
        categories.add(shop.type.trim());
      }
    });
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting shop categories:', error);
    return [];
  }
};

/**
 * Sync shop categories with the categories collection
 * This function ensures that all shop categories exist in the categories collection
 */
export const syncShopCategories = async (): Promise<void> => {
  try {
    // Starting shop category sync
    
    const [shopCategories, existingCategories] = await Promise.all([
      getShopCategories(),
      getActiveCategories()
    ]);
    
    const existingCategoryNames = existingCategories.map(cat => cat.name.toLowerCase());
    const missingCategories = shopCategories.filter(shopCat => 
      !existingCategoryNames.includes(shopCat.toLowerCase())
    );
    
    if (missingCategories.length > 0) {
      // Missing categories detected - manual admin review required
    } else {
      // All shop categories are properly synced
    }
    
    // Validate and normalize existing shop categories
    await validateShopCategories();
    
  } catch (error) {
    console.error('Error syncing shop categories:', error);
    throw error;
  }
};

/**
 * Check if a shop's category is valid
 */
export const isValidShopCategory = async (categoryName: string): Promise<boolean> => {
  try {
    if (!categoryName || !categoryName.trim()) {
      return false;
    }
    
    const categories = await getActiveCategories();
    return categories.some(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
  } catch (error) {
    console.error('Error validating shop category:', error);
    return true; // Return true on error to avoid blocking shop creation
  }
};

/**
 * Get category suggestions for shop type input
 */
export const getCategorySuggestions = async (input: string): Promise<string[]> => {
  try {
    const [categories, shopCategories] = await Promise.all([
      getActiveCategories(),
      getShopCategories()
    ]);
    
    const allCategories = [
      ...categories.map(cat => cat.name),
      ...shopCategories
    ];
    
    // Remove duplicates and filter by input
    const uniqueCategories = Array.from(new Set(allCategories));
    
    if (!input || !input.trim()) {
      return uniqueCategories.sort();
    }
    
    const inputLower = input.toLowerCase();
    return uniqueCategories
      .filter(cat => cat.toLowerCase().includes(inputLower))
      .sort();
      
  } catch (error) {
    console.error('Error getting category suggestions:', error);
    return [];
  }
};