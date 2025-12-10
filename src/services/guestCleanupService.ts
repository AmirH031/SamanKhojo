import { deleteUser } from 'firebase/auth';
import { 
  doc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Clean up guest account data when user logs out
 */
export const cleanupGuestAccount = async (userId: string, isGuest: boolean): Promise<void> => {
  if (!isGuest) return; // Only cleanup guest accounts
  
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Starting guest account cleanup
    }
    
    const batch = writeBatch(db);
    
    // 1. Delete user profile
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);
    
    // 2. Delete cart items
    const cartItemsRef = collection(db, 'cartItems');
    const cartQuery = query(cartItemsRef, where('uid', '==', userId));
    const cartSnapshot = await getDocs(cartQuery);
    cartSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 3. Delete bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(bookingsRef, where('uid', '==', userId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    bookingsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 4. Delete booking analytics
    const analyticsRef = collection(db, 'bookingAnalytics');
    const analyticsQuery = query(analyticsRef, where('userId', '==', userId));
    const analyticsSnapshot = await getDocs(analyticsQuery);
    analyticsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 5. Delete alerts
    const alertsRef = collection(db, 'alerts');
    const alertsQuery = query(alertsRef, where('uid', '==', userId));
    const alertsSnapshot = await getDocs(alertsQuery);
    alertsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 6. Delete reviews (guest reviews)
    const shopsRef = collection(db, 'shops');
    const shopsSnapshot = await getDocs(shopsRef);
    
    for (const shopDoc of shopsSnapshot.docs) {
      const reviewsRef = collection(db, 'shops', shopDoc.id, 'reviews');
      const reviewsQuery = query(reviewsRef, where('userId', '==', userId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      reviewsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    // Commit all deletions
    await batch.commit();
    
    // 7. Delete Firebase Auth user (must be done after Firestore cleanup)
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId && currentUser.isAnonymous) {
      await deleteUser(currentUser);
    }
    
    if (process.env.NODE_ENV !== 'production') {
      // Guest account cleanup completed
    }
    
    // Clear local storage
    localStorage.removeItem('deviceId');
    localStorage.removeItem('recentSearches');
    
  } catch (error) {
    console.error('❌ Error during guest account cleanup:', error);
    throw error;
  }
};

/**
 * Schedule automatic cleanup for abandoned guest accounts
 */
export const scheduleGuestCleanup = async (): Promise<void> => {
  try {
    // Find guest accounts older than 30 days with no activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usersRef = collection(db, 'users');
    const guestQuery = query(
      usersRef,
      where('isGuest', '==', true),
      where('lastLogin', '<', thirtyDaysAgo)
    );
    
    const guestSnapshot = await getDocs(guestQuery);
    
    if (process.env.NODE_ENV !== 'production') {
      // Found abandoned guest accounts for cleanup
    }
    
    // Cleanup each abandoned guest account
    for (const guestDoc of guestSnapshot.docs) {
      try {
        await cleanupGuestAccount(guestDoc.id, true);
        if (process.env.NODE_ENV !== 'production') {
          // Cleaned up abandoned guest account
        }
      } catch (error) {
        console.error(`❌ Failed to cleanup guest ${guestDoc.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in scheduled guest cleanup:', error);
  }
};

/**
 * Get guest account statistics
 */
export const getGuestAccountStats = async (): Promise<{
  totalGuests: number;
  activeGuests: number;
  abandonedGuests: number;
}> => {
  try {
    const usersRef = collection(db, 'users');
    const guestQuery = query(usersRef, where('isGuest', '==', true));
    const guestSnapshot = await getDocs(guestQuery);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let activeGuests = 0;
    let abandonedGuests = 0;
    
    guestSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const lastLogin = data.lastLogin?.toDate() || new Date(0);
      
      if (lastLogin > sevenDaysAgo) {
        activeGuests++;
      } else {
        abandonedGuests++;
      }
    });
    
    return {
      totalGuests: guestSnapshot.size,
      activeGuests,
      abandonedGuests
    };
  } catch (error) {
    console.error('Error getting guest account stats:', error);
    return { totalGuests: 0, activeGuests: 0, abandonedGuests: 0 };
  }
};