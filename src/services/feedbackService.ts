import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';

import { feedbackApi } from './api';

export interface Feedback {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: 'suggestion' | 'complaint' | 'bug' | 'feature' | 'general';
  category: 'website' | 'shops' | 'search' | 'booking' | 'performance' | 'other';
  subject: string;
  message: string;
  rating?: number; // 1-5 overall satisfaction
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  adminNotes?: string;
  userAgent?: string;
  url?: string;
}

export interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  averageRating: number;
}

/**
 * Submit feedback from user
 */
export const submitFeedback = async (feedbackData: {
  type: Feedback['type'];
  category: Feedback['category'];
  subject: string;
  message: string;
  rating?: number;
}): Promise<string> => {
  try {
    const user = auth.currentUser;
    
    if (feedbackData.message.trim().length < 10) {
      throw new Error('Feedback message must be at least 10 characters long');
    }

    if (feedbackData.subject.trim().length < 5) {
      throw new Error('Subject must be at least 5 characters long');
    }

    const result = await feedbackApi.submit({
        userId: user?.uid || null,
        userName: user?.displayName || 'Anonymous',
        userEmail: user?.email || null,
        type: feedbackData.type,
        category: feedbackData.category,
        subject: feedbackData.subject.trim(),
        message: feedbackData.message.trim(),
        rating: feedbackData.rating || null,
        userAgent: navigator.userAgent,
        url: window.location.href
    });

    return result.id;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

/**
 * Get user's feedback history (authenticated users only)
 */
export const getUserFeedback = async (): Promise<Feedback[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const result = await feedbackApi.getUserFeedback(user.uid);
    return result.feedback || [];
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return [];
  }
};

/**
 * Get all feedback (admin only)
 */
export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    // This would typically check admin permissions
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Feedback));
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return [];
  }
};

/**
 * Get feedback statistics (admin only)
 */
export const getFeedbackStats = async (): Promise<FeedbackStats> => {
  try {
    const feedback = await getAllFeedback();
    
    const stats: FeedbackStats = {
      total: feedback.length,
      byType: {},
      byCategory: {},
      byStatus: {},
      averageRating: 0
    };

    let totalRating = 0;
    let ratingCount = 0;

    feedback.forEach(item => {
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      
      // Count by category
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      
      // Calculate average rating
      if (item.rating) {
        totalRating += item.rating;
        ratingCount++;
      }
    });

    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    return stats;
  } catch (error) {
    console.error('Error calculating feedback stats:', error);
    return {
      total: 0,
      byType: {},
      byCategory: {},
      byStatus: {},
      averageRating: 0
    };
  }
};

/**
 * Get feedback type options
 */
export const getFeedbackTypes = (): Array<{ value: Feedback['type']; label: string; description: string }> => [
  { 
    value: 'suggestion', 
    label: 'Suggestion', 
    description: 'Ideas to improve our service' 
  },
  { 
    value: 'complaint', 
    label: 'Complaint', 
    description: 'Issues with our service or shops' 
  },
  { 
    value: 'bug', 
    label: 'Bug Report', 
    description: 'Technical problems or errors' 
  },
  { 
    value: 'feature', 
    label: 'Feature Request', 
    description: 'New features you\'d like to see' 
  },
  { 
    value: 'general', 
    label: 'General Feedback', 
    description: 'General comments or questions' 
  }
];

/**
 * Get feedback category options
 */
export const getFeedbackCategories = (): Array<{ value: Feedback['category']; label: string; description: string }> => [
  { 
    value: 'website', 
    label: 'Website', 
    description: 'Website design, navigation, or functionality' 
  },
  { 
    value: 'shops', 
    label: 'Shops', 
    description: 'Shop information, quality, or service' 
  },
  { 
    value: 'search', 
    label: 'Search', 
    description: 'Search functionality and results' 
  },
  { 
    value: 'booking', 
    label: 'Booking', 
    description: 'Booking process and communication' 
  },
  { 
    value: 'performance', 
    label: 'Performance', 
    description: 'Website speed and responsiveness' 
  },
  { 
    value: 'other', 
    label: 'Other', 
    description: 'Other topics not listed above' 
  }
];