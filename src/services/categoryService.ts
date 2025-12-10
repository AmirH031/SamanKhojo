import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserRole } from './userRoleService';

export interface Category {
  id: string;
  name: string;
  hindi_name?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryInput {
  name: string;
  hindi_name?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Get fallback categories when Firestore access fails
export const getFallbackCategories = (): Category[] => {
  return DEFAULT_CATEGORIES.map((category, index) => ({
    id: `fallback-${index}`,
    ...category,
    sortOrder: index + 1,
    isActive: category.isActive ?? true,
    createdAt: { toDate: () => new Date() } as Timestamp,
    updatedAt: { toDate: () => new Date() } as Timestamp
  }));
};

// Default categories for the system
export const DEFAULT_CATEGORIES: Omit<CategoryInput, 'sortOrder'>[] = [
  { name: 'Kirana / General Store', hindi_name: 'किराना / जनरल स्टोर', icon: '🛒', isActive: true },
  { name: 'Fruits & Vegetables (Sabzi Mandi)', hindi_name: 'फल और सब्जी (सब्जी मंडी)', icon: '🥬', isActive: true },
  { name: 'Dairy & Bakery', hindi_name: 'डेयरी और बेकरी', icon: '🥛', isActive: true },
  { name: 'Stationery & Printing', hindi_name: 'स्टेशनरी और प्रिंटिंग', icon: '📝', isActive: true },
  { name: 'Cosmetics & Personal Care', hindi_name: 'कॉस्मेटिक्स और व्यक्तिगत देखभाल', icon: '💄', isActive: true },
  { name: 'Clothing & Garments', hindi_name: 'कपड़े और वस्त्र', icon: '👕', isActive: true },
  { name: 'Footwear & Bags', hindi_name: 'जूते और बैग', icon: '👟', isActive: true },
  { name: 'Electronics & Mobile', hindi_name: 'इलेक्ट्रॉनिक्स और मोबाइल', icon: '📱', isActive: true },
  { name: 'Jewellery & Imitation', hindi_name: 'आभूषण और नकली', icon: '💍', isActive: true },
  { name: 'Medical & Healthcare', hindi_name: 'चिकित्सा और स्वास्थ्य सेवा', icon: '🏥', isActive: true },
  { name: 'Furniture & Home Needs', hindi_name: 'फर्नीचर और घरेलू जरूरतें', icon: '🪑', isActive: true },
  { name: 'Hardware & Building Material', hindi_name: 'हार्डवेयर और निर्माण सामग्री', icon: '🔨', isActive: true },
  { name: 'Sports & Toys', hindi_name: 'खेल और खिलौने', icon: '⚽', isActive: true },
  { name: 'Sweet Shops (Mithai)', hindi_name: 'मिठाई की दुकान', icon: '🍬', isActive: true },
  { name: 'Meat / Fish / Chicken / Eggs', hindi_name: 'मांस / मछली / चिकन / अंडे', icon: '🍖', isActive: true },
  { name: 'Tailor / Laundry / Boutique', hindi_name: 'दर्जी / धुलाई / बुटीक', icon: '✂️', isActive: true },
  { name: 'Gift & Decoration', hindi_name: 'उपहार और सजावट', icon: '🎁', isActive: true }
];

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('sortOrder'), orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  } catch (error) {
    console.error('Error fetching categories from Firestore:', error);
    // Using fallback categories
    
    // Return fallback categories when Firestore access fails
    return getFallbackCategories();
  }
};

// Get active categories only
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const categories = await getCategories();
    return categories.filter(category => category.isActive);
  } catch (error) {
    console.error('Error fetching active categories:', error);
    // Return fallback categories when there's an error
    return getFallbackCategories();
  }
};

// Get single category
export const getCategory = async (categoryId: string): Promise<Category | null> => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    const snapshot = await getDoc(categoryRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Category;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

// Add category (Admin only)
export const addCategory = async (categoryData: CategoryInput): Promise<string> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    // Validate required fields
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Category name is required');
    }

    // Get current max sort order
    const categories = await getCategories();
    const maxSortOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) : 0;

    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      sortOrder: categoryData.sortOrder ?? maxSortOrder + 1,
      isActive: categoryData.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update category (Admin only)
export const updateCategory = async (
  categoryId: string,
  updates: Partial<CategoryInput>
): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    // Filter out undefined values for Firestore compatibility
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category (Admin only)
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Initialize default categories (Admin only)
export const initializeDefaultCategories = async (): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    // Check if categories already exist
    const existingCategories = await getCategories();
    if (existingCategories.length > 0 && !existingCategories[0].id.startsWith('fallback-')) {
      // Categories already exist, skipping initialization
      return;
    }

    // Add default categories
    const categoriesRef = collection(db, 'categories');
    const promises = DEFAULT_CATEGORIES.map((category, index) =>
      addDoc(categoriesRef, {
        ...category,
        sortOrder: index + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    await Promise.all(promises);
    // Default categories initialized successfully
  } catch (error) {
    console.error('Error initializing default categories:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check Firestore security rules for the categories collection.');
    }
    throw error;
  }
};

// Search categories
export const searchCategories = async (searchQuery: string): Promise<Category[]> => {
  try {
    const categories = await getActiveCategories();
    const query = searchQuery.toLowerCase().trim();

    return categories.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.hindi_name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  } catch (error) {
    console.error('Error searching categories:', error);
    return [];
  }
};

// Get category by name (case-insensitive)
export const getCategoryByName = async (name: string): Promise<Category | null> => {
  try {
    const categories = await getCategories();
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase()
    ) || null;
  } catch (error) {
    console.error('Error finding category by name:', error);
    return null;
  }
};

// Validate category data
export const validateCategory = (category: Partial<CategoryInput>): string[] => {
  const errors: string[] = [];

  if (!category.name || !category.name.trim()) {
    errors.push('Category name is required');
  }

  if (category.name && category.name.length > 100) {
    errors.push('Category name must be less than 100 characters');
  }

  if (category.hindi_name && category.hindi_name.length > 100) {
    errors.push('Hindi name must be less than 100 characters');
  }

  if (category.description && category.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  if (category.sortOrder !== undefined && (category.sortOrder < 0 || !Number.isInteger(category.sortOrder))) {
    errors.push('Sort order must be a positive integer');
  }

  return errors;
};