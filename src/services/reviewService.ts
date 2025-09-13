import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';

import { ratingsApi } from './api';

export interface Review {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  isVerified?: boolean;
  helpfulCount?: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Add a review for a shop
export const addReview = async (
  shopId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<string> => {
  try {
    const result = await ratingsApi.addShopRating(shopId, userId, userName, rating, comment.trim());
    return result.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

// Get reviews for a shop
export const getShopReviews = async (shopId: string, limit: number = 20): Promise<Review[]> => {
  try {
    const result = await ratingsApi.getShopRatings(shopId, limit);
    return result.reviews || [];
  } catch (error) {
    console.error('Error fetching shop reviews:', error);
    return [];
  }
};

// Get user's reviews for a specific shop
export const getUserReviewsForShop = async (shopId: string, userId: string): Promise<Review[]> => {
  try {
    const result = await ratingsApi.getUserRating(shopId, userId);
    return result.rating ? [result.rating] : [];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

// Get all reviews by a user
export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    // This requires a collection group query across all shop reviews
    // For now, we'll return empty array and implement later if needed
    return [];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

// Update shop's average rating
const updateShopRating = async (shopId: string): Promise<void> => {
  try {
    const reviews = await getShopReviews(shopId);
    
    if (reviews.length === 0) return;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Update shop document with new rating
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating shop rating:', error);
  }
};

// Get review summary for a shop
export const getReviewSummary = async (shopId: string): Promise<ReviewSummary> => {
  try {
    const result = await ratingsApi.getShopRatings(shopId, 1000);
    return result.summary || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  } catch (error) {
    console.error('Error getting review summary:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
};

// Mark review as helpful
export const markReviewHelpful = async (shopId: string, reviewId: string): Promise<void> => {
  try {
    await ratingsApi.markHelpful(shopId, reviewId);
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    throw error;
  }
};

// Delete review (user can delete their own review)
export const deleteReview = async (shopId: string, reviewId: string, userId: string): Promise<void> => {
  try {
    const reviewsRef = collection(db, 'shops', shopId, 'reviews');
    const q = query(reviewsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const userReview = snapshot.docs.find(doc => doc.id === reviewId);
    if (!userReview) {
      throw new Error('Review not found or you do not have permission to delete it');
    }

    const reviewRef = doc(db, 'shops', shopId, 'reviews', reviewId);
    await deleteDoc(reviewRef);

    // Update shop's average rating
    await updateShopRating(shopId);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};