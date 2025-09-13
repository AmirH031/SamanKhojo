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
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserRole } from './userRoleService';

export interface TrendingItem {
  id: string;
  itemId: string;
  shopId: string;
  itemName: string;
  shopName: string;
  category?: string;
  imageUrl?: string;
  priority: number; // Higher number = higher priority
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TrendingItemInput {
  itemId: string;
  shopId: string;
  itemName: string;
  shopName: string;
  category?: string;
  imageUrl?: string;
  priority?: number;
  isActive?: boolean;
}

// Get all trending items
export const getTrendingItems = async (): Promise<TrendingItem[]> => {
  try {
    const trendingRef = collection(db, 'trendingItems');
    const q = query(trendingRef, orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TrendingItem));
  } catch (error) {
    console.error('Error fetching trending items:', error);
    return [];
  }
};

// Get active trending items only
export const getActiveTrendingItems = async (): Promise<TrendingItem[]> => {
  try {
    const trendingItems = await getTrendingItems();
    return trendingItems.filter(item => item.isActive);
  } catch (error) {
    console.error('Error fetching active trending items:', error);
    return [];
  }
};

// Add trending item (Admin only)
export const addTrendingItem = async (itemData: TrendingItemInput): Promise<string> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const trendingRef = collection(db, 'trendingItems');
    const docRef = await addDoc(trendingRef, {
      ...itemData,
      priority: itemData.priority ?? 1,
      isActive: itemData.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding trending item:', error);
    throw error;
  }
};

// Update trending item (Admin only)
export const updateTrendingItem = async (
  trendingId: string,
  updates: Partial<TrendingItemInput>
): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const trendingRef = doc(db, 'trendingItems', trendingId);
    await updateDoc(trendingRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating trending item:', error);
    throw error;
  }
};

// Delete trending item (Admin only)
export const deleteTrendingItem = async (trendingId: string): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const trendingRef = doc(db, 'trendingItems', trendingId);
    await deleteDoc(trendingRef);
  } catch (error) {
    console.error('Error deleting trending item:', error);
    throw error;
  }
};

// Toggle trending item active status (Admin only)
export const toggleTrendingItemStatus = async (trendingId: string): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const trendingRef = doc(db, 'trendingItems', trendingId);
    const trendingDoc = await getDoc(trendingRef);
    
    if (trendingDoc.exists()) {
      const currentData = trendingDoc.data() as TrendingItem;
      await updateDoc(trendingRef, {
        isActive: !currentData.isActive,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error toggling trending item status:', error);
    throw error;
  }
};

// Set trending item priority (Admin only)
export const setTrendingItemPriority = async (trendingId: string, priority: number): Promise<void> => {
  try {
    const role = await getUserRole();
    if (!role.isAdmin) {
      throw new Error('Admin access required');
    }


    const trendingRef = doc(db, 'trendingItems', trendingId);
    await updateDoc(trendingRef, {
      priority,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error setting trending item priority:', error);
    throw error;
  }
};