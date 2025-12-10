import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Calendar, User, MoreVertical } from 'lucide-react';
import { getShopReviews, getReviewSummary, markReviewHelpful, Review, ReviewSummary } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';

interface ReviewsListProps {
  shopId: string;
  onAddReview?: () => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ shopId, onAddReview }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [shopId]);

  const fetchReviews = async () => {
    try {
      const [reviewsData, summaryData] = await Promise.all([
        getShopReviews(shopId),
        getReviewSummary(shopId)
      ]);
      
      setReviews(reviewsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(shopId, reviewId);
      // Refresh reviews to show updated helpful count
      await fetchReviews();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const formatDate = (timestamp: any): string => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
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

  const getRatingBarWidth = (count: number, total: number): string => {
    return total > 0 ? `${(count / total) * 100}%` : '0%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      {summary && summary.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {summary.averageRating}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(summary.averageRating, 20)}
              </div>
              <p className="text-gray-600">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: getRatingBarWidth(summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution], summary.totalReviews) }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Review Button */}
      {onAddReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={onAddReview}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
          >
            ⭐ Rate This Shop
          </button>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {review.isVerified && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                {review.comment}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ThumbsUp size={16} />
                  <span className="text-sm">
                    Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ''}
                  </span>
                </button>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to review this shop and help others!
              </p>
              {onAddReview && (
                <button
                  onClick={onAddReview}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  Write First Review
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;