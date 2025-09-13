import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Rating {
  id: string;
  itemId: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  review?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ItemRatingStats {
  itemId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Add or update a rating
export const addRating = async (
  itemId: string,
  shopId: string,
  rating: number,
  review?: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to rate items');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has already rated this item
    const ratingsRef = collection(db, 'ratings');
    const existingRatingQuery = query(
      ratingsRef,
      where('itemId', '==', itemId),
      where('userId', '==', user.uid)
    );
    const existingRatingSnapshot = await getDocs(existingRatingQuery);

    let ratingId: string;

    if (!existingRatingSnapshot.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatingSnapshot.docs[0];
      ratingId = existingRatingDoc.id;
      
      await updateDoc(doc(db, 'ratings', ratingId), {
        rating,
        review: review || '',
        updatedAt: serverTimestamp()
      });
    } else {
      // Add new rating
      const newRatingRef = await addDoc(ratingsRef, {
        itemId,
        shopId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        review: review || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      ratingId = newRatingRef.id;
    }

    // Update item rating statistics
    await updateItemRatingStats(itemId);

    return ratingId;
  } catch (error) {
    console.error('Error adding rating:', error);
    throw error;
  }
};

// Update item rating statistics
const updateItemRatingStats = async (itemId: string): Promise<void> => {
  try {
    const ratingsRef = collection(db, 'ratings');
    const ratingsQuery = query(ratingsRef, where('itemId', '==', itemId));
    const ratingsSnapshot = await getDocs(ratingsQuery);

    const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
    const totalRatings = ratings.length;

    if (totalRatings === 0) return;

    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalRatings;

    const ratingDistribution = {
      1: ratings.filter(r => r === 1).length,
      2: ratings.filter(r => r === 2).length,
      3: ratings.filter(r => r === 3).length,
      4: ratings.filter(r => r === 4).length,
      5: ratings.filter(r => r === 5).length,
    };

    // Update or create item rating stats
    const statsRef = doc(db, 'itemRatingStats', itemId);
    await setDoc(statsRef, {
      itemId,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings,
      ratingDistribution,
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Error updating item rating stats:', error);
  }
};

// Get item rating statistics
export const getItemRatingStats = async (itemId: string): Promise<ItemRatingStats | null> => {
  try {
    const statsRef = doc(db, 'itemRatingStats', itemId);
    const statsSnapshot = await getDoc(statsRef);

    if (statsSnapshot.exists()) {
      return {
        id: statsSnapshot.id,
        ...statsSnapshot.data()
      } as ItemRatingStats;
    }

    return null;
  } catch (error) {
    console.error('Error getting item rating stats:', error);
    return null;
  }
};

// Get ratings for an item
export const getItemRatings = async (itemId: string, limitCount: number = 10): Promise<Rating[]> => {
  try {
    const ratingsRef = collection(db, 'ratings');
    const ratingsQuery = query(
      ratingsRef,
      where('itemId', '==', itemId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);

    return ratingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Rating));
  } catch (error) {
    console.error('Error getting item ratings:', error);
    return [];
  }
};

// Get user's rating for an item
export const getUserRating = async (itemId: string): Promise<Rating | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const ratingsRef = collection(db, 'ratings');
    const userRatingQuery = query(
      ratingsRef,
      where('itemId', '==', itemId),
      where('userId', '==', user.uid)
    );
    const userRatingSnapshot = await getDocs(userRatingQuery);

    if (!userRatingSnapshot.empty) {
      const ratingDoc = userRatingSnapshot.docs[0];
      return {
        id: ratingDoc.id,
        ...ratingDoc.data()
      } as Rating;
    }

    return null;
  } catch (error) {
    console.error('Error getting user rating:', error);
    return null;
  }
};

