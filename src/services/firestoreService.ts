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
  limit, 
  serverTimestamp,
  Timestamp,
  setDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { calculateDistance as calculateHaversineDistance } from '../utils';

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
}

// Shop interfaces
export interface Shop {
  ratings: any;
  hindi_name(shopName: string, hindi_name: any, language: string): import("react").ReactNode | Iterable<import("react").ReactNode>;
  id: string;
  shopName: string;
  hindi_shopName?: string;
  ownerName: string;
  type: string;
  shopType: 'product' | 'menu' | 'service' | 'office'; // New field for main shop type
  serviceDetails?: ServiceDetails; // Enhanced service details for service type shops
  officeDetails?: OfficeDetails; // Office details for office type shops
  address: string;
  phone: string;
  openingTime?: string;
  closingTime?: string;
  mapLink?: string;
  isOpen: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isHidden: boolean; // Added for hide/unhide functionality
  location: {
    lat: number;
    lng: number;
  };
  items?: string[];
  imageUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  distance?: number; // Added for distance calculation
}


// Note: Item, ItemType, ItemInput are now imported directly from '../types/Item'
// This avoids circular dependency issues

export interface Booking {
  id: string;
  shopId: string;
  shopName: string;
  items: BookingItem[];
  uid: string;
  userAgent: string;
  timestamp: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface BookingItem {
  name: string;
  quantity: string;
  unit: string;
}

export interface BookingAnalytics {
  id: string;
  userId: string;
  shopId: string;
  itemName: string;
  count: number;
  lastBookedAt: Timestamp;
}

export interface Alert {
  id: string;
  uid: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Timestamp;
}

import { getUserRole } from './userRoleService';

// Check if user is admin (uses backend validation)
export const isAdmin = async (): Promise<boolean> => {
  try {
    const role = await getUserRole();
    return role.isAdmin;
  } catch (error) {
    // Silently return false for auth errors
    return false;
  }
};
// Check if user has admin token claims
export const hasAdminClaims = async (forceRefresh: boolean = false): Promise<boolean> => {
  try {
    const role = await getUserRole();
    return role.isAdmin;
  } catch (error) {
    // Silently return false for auth errors
    return false;
  }
};

// Force refresh admin claims
export const refreshAdminClaims = async (): Promise<boolean> => {
  return await hasAdminClaims(true);
};

// Helper function to throw admin access error with helpful message
export const throwAdminAccessError = (): never => {
  throw new Error('ADMIN_CLAIMS_REQUIRED');
};

// Shop operations (READ - Public access)
export const getShops = async (includeHidden: boolean = false): Promise<Shop[]> => {
  try {
    const shopsRef = collection(db, 'shops');
    const snapshot = await getDocs(shopsRef);
    const shops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Shop));
    
    // Filter out hidden shops for public access unless explicitly requested
    if (!includeHidden && !isAdmin()) {
      return shops.filter(shop => !shop.isHidden);
    }
    
    return shops;
  } catch (error) {
    console.error('Error fetching shops:', error);
    return [];
  }
};

export const getShop = async (shopId: string): Promise<Shop | null> => {
  try {
    const shopRef = doc(db, 'shops', shopId);
    const snapshot = await getDoc(shopRef);
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Shop;
    }
    return null;
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
};

// Shop operations (WRITE - Admin only)
export const addShop = async (shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>, imageFile?: File): Promise<string> => {
  try {
    // Check authentication and admin status
    if (!(await isAdmin())) {
      throw new Error('Admin access required');
    }

    // Check admin claims
    const hasAdminAccess = await hasAdminClaims();
    if (!hasAdminAccess) {
      throwAdminAccessError();
    }

    let imageUrl = '';
    
    // Upload image to Firebase Storage if provided
    if (imageFile) {
      const imageRef = ref(storage, `shops/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(uploadResult.ref);
    }
    
    // Remove imageFile from shopData if it exists to prevent sending File object to Firestore
    const { imageFile: _, ...cleanShopData } = shopData as any;
    
    // Filter out undefined values to prevent Firestore errors
    const filteredShopData = Object.fromEntries(
      Object.entries(cleanShopData).filter(([_, value]) => value !== undefined)
    );
    
    const shopsRef = collection(db, 'shops');
    const docRef = await addDoc(shopsRef, {
      ...filteredShopData,
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding shop:', error);
    throw error;
  }
};

export const updateShop = async (shopId: string, updates: Partial<Omit<Shop, 'imageUrl'>>, imageFile?: File): Promise<void> => {
  try {
    // Check authentication and admin status
    if (!isAdmin()) {
      throw new Error('Admin access required');
    }

    // Check admin claims
    const hasAdminAccess = await hasAdminClaims();
    if (!hasAdminAccess) {
      throwAdminAccessError();
    }

    let updateData = { ...updates };

    // Upload new image to Firebase Storage if provided
    if (imageFile) {
      // Delete old image if exists
      const currentShop = await getShop(shopId);
      if (currentShop?.imageUrl) {
        try {
          const oldImageRef = ref(storage, currentShop.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('Could not delete old image:', error);
        }
      }
      const imageRef = ref(storage, `shops/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);
      updateData.imageUrl = imageUrl;
    }

    // Remove imageFile from updates if it exists to prevent sending File object to Firestore
    const { imageFile: _, ...cleanUpdates } = updateData as any;

    // Remove undefined fields from cleanUpdates
    const filteredUpdates: Record<string, any> = {};
    Object.keys(cleanUpdates).forEach((key) => {
      if (cleanUpdates[key] !== undefined) {
        filteredUpdates[key] = cleanUpdates[key];
      }
    });

    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      ...filteredUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    throw error;
  }
};

export const deleteShop = async (shopId: string): Promise<void> => {
  try {
    // Check authentication and admin status
    if (!isAdmin()) {
      throw new Error('Admin access required');
    }

    // Check admin claims
    const hasAdminAccess = await hasAdminClaims();
    if (!hasAdminAccess) {
      throwAdminAccessError();
    }
    
    // Delete shop image from Storage if exists
    const shop = await getShop(shopId);
    if (shop?.imageUrl) {
      try {
        const imageRef = ref(storage, shop.imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Could not delete shop image:', error);
      }
    }
    
    const shopRef = doc(db, 'shops', shopId);
    await deleteDoc(shopRef);
  } catch (error) {
    console.error('Error deleting shop:', error);
    throw error;
  }
};

export const searchShops = async (searchQuery: string): Promise<Shop[]> => {
  try {
    const shops = await getShops();
    const query = searchQuery.toLowerCase();
    
    // Service-specific search terms mapping
    const serviceTerms: Record<string, string[]> = {
      'plumber': ['plumbing', 'pipe', 'water', 'leak', 'repair'],
      'electrician': ['electrical', 'wiring', 'power', 'electric'],
      'tutor': ['teaching', 'education', 'study', 'learn', 'class'],
      'salon': ['hair', 'beauty', 'cut', 'style', 'facial'],
      'mechanic': ['car', 'auto', 'vehicle', 'repair', 'service'],
      'doctor': ['medical', 'health', 'clinic', 'treatment'],
      'cleaner': ['cleaning', 'housekeeping', 'sanitize'],
      'painter': ['painting', 'wall', 'color', 'decoration'],
      'carpenter': ['wood', 'furniture', 'repair', 'construction']
    };
    
    return shops.filter(shop => {
      // Basic search
      const basicMatch = 
        shop.shopName.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query) ||
        shop.ownerName.toLowerCase().includes(query) ||
        shop.type.toLowerCase().includes(query);
      
      // Items search (for product/menu shops)
      const itemsMatch = shop.items?.some(item => 
        item.toLowerCase().includes(query)
      ) || false;
      
      // Service-specific search
      let serviceMatch = false;
      if (shop.shopType === 'service' && shop.serviceDetails) {
        // Search in service details
        const serviceDetailsMatch = 
          shop.serviceDetails.serviceName?.toLowerCase().includes(query) ||
          shop.serviceDetails.serviceCategory?.toLowerCase().includes(query) ||
          shop.serviceDetails.description?.some(desc => 
            desc.toLowerCase().includes(query)
          ) ||
          shop.serviceDetails.features?.some(feature => 
            feature.toLowerCase().includes(query)
          );
        
        // Search using service term mapping
        const serviceTermMatch = Object.entries(serviceTerms).some(([term, keywords]) => {
          if (query.includes(term)) {
            return keywords.some(keyword => 
              shop.shopName.toLowerCase().includes(keyword) ||
              shop.type.toLowerCase().includes(keyword) ||
              shop.serviceDetails?.serviceName?.toLowerCase().includes(keyword) ||
              shop.serviceDetails?.description?.some(desc => 
                desc.toLowerCase().includes(keyword)
              )
            );
          }
          return false;
        });
        
        serviceMatch = serviceDetailsMatch || serviceTermMatch;
      }

      // Office-specific search
      let officeMatch = false;
      if (shop.shopType === 'office' && shop.officeDetails) {
        // Search in office details
        officeMatch = 
          shop.officeDetails.department?.toLowerCase().includes(query) ||
          shop.officeDetails.officeType?.toLowerCase().includes(query) ||
          shop.officeDetails.contactPerson?.toLowerCase().includes(query) ||
          shop.officeDetails.description?.toLowerCase().includes(query) ||
          shop.officeDetails.services?.some(service => 
            service.toLowerCase().includes(query)
          ) ||
          // Common office search terms
          (query.includes('government') && shop.officeDetails.officeType === 'government') ||
          (query.includes('private') && shop.officeDetails.officeType === 'private') ||
          (query.includes('office') || query.includes('दफ्तर'));
      }
      
      return basicMatch || itemsMatch || serviceMatch || officeMatch;
    });
  } catch (error) {
    console.error('Error searching shops:', error);
    return [];
  }
};



// Re-export item operations from the new itemService
export { 
  getItems, 
  getItemsByCategory,
  getAllItems,
  getItem,
  addItem, 
  updateItem, 
  deleteItem, 
  addBulkItems,
  searchItems
} from './itemService';

// Booking operations
export const addBooking = async (bookingData: Omit<Booking, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      timestamp: serverTimestamp()
    });

    // Update booking analytics
    await updateBookingAnalytics(bookingData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Booking));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// Booking Analytics
const updateBookingAnalytics = async (bookingData: Omit<Booking, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const analyticsRef = collection(db, 'bookingAnalytics');
    
    for (const item of bookingData.items) {
      const analyticsId = `${bookingData.uid}_${bookingData.shopId}_${item.name}`;
      const analyticsDocRef = doc(analyticsRef, analyticsId);
      
      const existingDoc = await getDoc(analyticsDocRef);
      
      if (existingDoc.exists()) {
        await updateDoc(analyticsDocRef, {
          count: increment(1),
          lastBookedAt: serverTimestamp()
        });
      } else {
        await setDoc(analyticsDocRef, {
          userId: bookingData.uid,
          shopId: bookingData.shopId,
          itemName: item.name,
          count: 1,
          lastBookedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error updating booking analytics:', error);
  }
};

export const getBookingAnalytics = async (shopId?: string): Promise<BookingAnalytics[]> => {
  try {
    // Check authentication and admin status
    if (!isAdmin()) {
      throw new Error('Admin access required');
    }

    // Check admin claims
    const hasAdminAccess = await hasAdminClaims();
    if (!hasAdminAccess) {
      throwAdminAccessError();
    }
    
    const analyticsRef = collection(db, 'bookingAnalytics');
    let q = query(analyticsRef, orderBy('count', 'desc'));
    
    if (shopId) {
      q = query(analyticsRef, where('shopId', '==', shopId), orderBy('count', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BookingAnalytics));
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    throw error;
  }
};

export const getUserBookingCount = async (userWhatsApp: string): Promise<number> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('uid', '==', userWhatsApp));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching user booking count:', error);
    return 0;
  }
};

// Alert operations
export const addAlert = async (alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const alertsRef = collection(db, 'alerts');
    const docRef = await addDoc(alertsRef, {
      ...alertData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding alert:', error);
    throw error;
  }
};

export const getUserAlerts = async (uid: string): Promise<Alert[]> => {
  try {
    const alertsRef = collection(db, 'alerts');
    const q = query(alertsRef, where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Alert));
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    return [];
  }
};

// Admin data operations (Admin only)
export const getAdminData = async (docId: string): Promise<any> => {
  try {
    if (!isAdmin()) {
      throw new Error('Admin access required');
    }
    
    const docRef = doc(db, 'adminData', docId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return null;
  }
};

export const setAdminData = async (docId: string, data: any): Promise<void> => {
  try {
    if (!isAdmin()) {
      throw new Error('Admin access required');
    }

    // Check admin claims
    const hasAdminAccess = await hasAdminClaims();
    if (!hasAdminAccess) {
      throwAdminAccessError();
    }
    
    const docRef = doc(db, 'adminData', docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error setting admin data:', error);
    throw error;
  }
};



// Utility functions
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // Use our improved Haversine formula implementation
  return calculateHaversineDistance(lat1, lng1, lat2, lng2);
};

export const getShopsNearby = async (userLat: number, userLng: number, radiusKm: number = 10): Promise<Shop[]> => {
  try {
    const shops = await getShops();
    return shops
      .map(shop => ({
        ...shop,
        distance: calculateHaversineDistance(userLat, userLng, shop.location.lat, shop.location.lng)
      }))
      .filter(shop => shop.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby shops:', error);
    return [];
  }
};