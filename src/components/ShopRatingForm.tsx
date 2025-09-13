import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, X, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { addReview, getUserReviewsForShop } from '../services/reviewService';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ShopRatingFormProps {
  shopId: string;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ShopRatingForm: React.FC<ShopRatingFormProps> = ({
  shopId,
  shopName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { user, profile, needsProfileSetup } = useAuth();

  // Check if user has already reviewed this shop
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user || !isOpen) return;

      setCheckingExisting(true);
      try {
        const existingReviews = await getUserReviewsForShop(shopId, user.uid);
        setHasExistingReview(existingReviews.length > 0);

        if (existingReviews.length > 0) {
          const existingReview = existingReviews[0];
          setRating(existingReview.rating);
          setComment(existingReview.comment || '');
        }
      } catch (error) {
        console.error('Error checking existing review:', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingReview();
  }, [shopId, user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('Please sign in to rate this shop');
      return;
    }

    if (needsProfileSetup) {
      toast.error('Please complete your profile setup first');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Please write at least 10 characters in your review');
      return;
    }

    setLoading(true);
    try {
      await addReview(shopId, user.uid, profile.name, rating, comment);
      toast.success(hasExistingReview ? 'Review updated successfully!' : 'Review added successfully!');

      // Reset form
      setRating(0);
      setComment('');

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor - Very unsatisfied';
      case 2: return 'Fair - Below expectations';
      case 3: return 'Good - Meets expectations';
      case 4: return 'Very Good - Above expectations';
      case 5: return 'Excellent - Outstanding service';
      default: return 'Select a rating';
    }
  };

  if (!isOpen) return null;

  // Show authentication required message for non-authenticated users
  if (!user) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-6">
                Please sign in to rate and review shops. This helps us maintain authentic reviews from real users.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Auth Modal - rendered outside with higher z-index */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            onClose(); // Close the rating form after successful auth
          }}
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {hasExistingReview ? 'Update Your Review' : 'Rate This Shop'}
            </h3>
            <p className="text-gray-600 mt-1">{shopName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {checkingExisting ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking existing review...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Existing Review Notice */}
            {hasExistingReview && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Star size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">You've already reviewed this shop</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You can update your existing review below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="text-center">
              <p className="text-gray-700 mb-4 font-medium">How was your experience?</p>
              <div className="flex justify-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    <Star
                      size={36}
                      className={`${star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                        } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this shop. What did you like? What could be improved?"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={500}
                required
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Minimum 10 characters</span>
                <span>{comment.length}/500</span>
              </div>
            </div>

            {/* User Info Display */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Reviewing as:</h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-gray-600">Verified User</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0 || comment.trim().length < 10}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send size={18} />
                    <span>{hasExistingReview ? 'Update Review' : 'Submit Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          onClose(); // Close the rating form after successful auth
        }}
      />
    </motion.div>
  );
};

export default ShopRatingForm;