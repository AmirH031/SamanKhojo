import { auth } from './firebase';

import { api } from './api';

export interface UserReview {
  id: string;
  shopId: string;
  shopName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserActivityStats {
  totalBookings: number;
  totalReviews: number;
  shopsVisited: number;
}

/**
 * Get user's reviews across all shops
 */
export const getUserReviews = async (): Promise<UserReview[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const result = await api.get(`/ratings/user/${user.uid}/reviews`);
    return result.reviews || [];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

/**
 * Get user activity statistics
 */
export const getUserActivityStats = async (): Promise<UserActivityStats> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        totalBookings: 0,
        totalReviews: 0,
        shopsVisited: 0
      };
    }

    const result = await api.get(`/users/${user.uid}/stats`);
    return result.stats || {
      totalBookings: 0,
      totalReviews: 0,
      shopsVisited: 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalBookings: 0,
      totalReviews: 0,
      shopsVisited: 0
    };
  }
};