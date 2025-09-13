import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { addRating, getUserRating, Rating } from '../../services/ratingService';
import { useAuth } from '../../contexts/AuthContext';

interface RatingComponentProps {
  itemId: string;
  shopId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted?: () => void;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  itemId,
  shopId,
  itemName,
  isOpen,
  onClose,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadExistingRating();
    }
  }, [isOpen, user, itemId]);

  const loadExistingRating = async () => {
    try {
      const userRating = await getUserRating(itemId);
      if (userRating) {
        setExistingRating(userRating);
        setRating(userRating.rating);
        setReview(userRating.review || '');
      }
    } catch (error) {
      console.error('Error loading existing rating:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to rate items');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await addRating(itemId, shopId, rating, review);
      toast.success(existingRating ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      onRatingSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setReview('');
    setExistingRating(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {existingRating ? 'Update Rating' : 'Rate Item'}
            </h2>
            <p className="text-gray-600 mt-1 text-sm">{itemName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rating Content */}
        <div className="p-6">
          {/* Star Rating */}
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-4">How would you rate this item?</p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={16} className="inline mr-2" />
              Write a review (optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this item..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{review.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              existingRating ? 'Update Rating' : 'Submit Rating'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RatingComponent;