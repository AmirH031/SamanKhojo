import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Star, 
  ShoppingCart, 
  MessageCircle, 
  Calendar,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getUserReviews, UserReview } from '../services/userActivityService';

interface Inquiry {
  id: string;
  shopId: string;
  shopName: string;
  items: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  status: 'pending' | 'confirmed' | 'cancelled';
  timestamp: any;
}

// Using UserReview from service

const RecentActivity: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'reviews'>('inquiries');
  
  const { user } = useAuth();

  // Real-time bookings subscription
  useEffect(() => {
    if (!user) {
      setInquiries([]);
      setReviews([]);
      setLoading(false);
      return;
    }

    const inquiriesQuery = query(
      collection(db, 'inquiries'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeInquiries = onSnapshot(inquiriesQuery, (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Inquiry));
      setInquiries(inquiriesData);
      setLoading(false);
    });

    return () => unsubscribeInquiries();
  }, [user]);

  // Real-time reviews subscription
  useEffect(() => {
    if (!user) return;

    // Query all shop reviews collections for this user
    const fetchUserReviews = async () => {
      try {
        // This is a simplified approach - in a real app, you'd need to query across all shop subcollections
        // For now, we'll use a placeholder approach
        setReviews([]);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchUserReviews();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (timestamp: any): string => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} min ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} hours ago`;
      } else {
        return date.toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return 'Unknown date';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
        <div className="text-center py-8">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600">
            Sign in to view your recent inquiries and reviews
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header with Tabs */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'inquiries'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ShoppingCart size={16} />
              <span>Recent Inquiries</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Star size={16} />
              <span>Reviews Given</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                {inquiries.length > 0 ? (
                  inquiries.map((inquiry, index) => (
                    <motion.div
                      key={inquiry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{inquiry.shopName}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                {inquiry.status}
                              </span>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>{formatDate(inquiry.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {getStatusIcon(inquiry.status)}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                        <div className="space-y-1">
                          {inquiry.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-gray-900 font-medium">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start exploring shops and make your first inquiry!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Star size={18} className="text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{review.shopName}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {renderStars(review.rating)}
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Visit shops and share your experience with the community!
                    </p>
                    <div className="text-center">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        0 reviews
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Coming Soon Badge for Reviews */}
      {activeTab === 'reviews' && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Coming Soon</h4>
                <p className="text-sm text-blue-700">
                  Your shop reviews and ratings will appear here once you start rating shops.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;