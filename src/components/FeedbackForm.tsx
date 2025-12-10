import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  X, 
  Star, 
  MessageSquare, 
  AlertCircle, 
  Bug, 
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  submitFeedback, 
  getFeedbackTypes, 
  getFeedbackCategories,
  Feedback 
} from '../services/feedbackService';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [type, setType] = useState<Feedback['type']>('general');
  const [category, setCategory] = useState<Feedback['category']>('website');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const feedbackTypes = getFeedbackTypes();
  const feedbackCategories = getFeedbackCategories();

  const getTypeIcon = (type: Feedback['type']) => {
    switch (type) {
      case 'suggestion': return <Lightbulb size={16} />;
      case 'complaint': return <AlertCircle size={16} />;
      case 'bug': return <Bug size={16} />;
      case 'feature': return <Star size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters long');
      return;
    }
    
    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        type,
        category,
        subject: subject.trim(),
        message: message.trim(),
        rating: rating > 0 ? rating : undefined
      });
      
      toast.success('Thank you for your feedback! We\'ll review it soon.');
      
      // Reset form
      setType('general');
      setCategory('website');
      setSubject('');
      setMessage('');
      setRating(0);
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 pb-24 sm:pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share Your Feedback</h2>
            <p className="text-gray-600 mt-1">Help us improve SamanKhojo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of feedback is this?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feedbackTypes.map((typeOption) => (
                <button
                  key={typeOption.value}
                  type="button"
                  onClick={() => setType(typeOption.value)}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    type === typeOption.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(typeOption.value)}
                    <span className="font-medium">{typeOption.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{typeOption.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Which area does this relate to?
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Feedback['category'])}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {feedbackCategories.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>
                  {categoryOption.label} - {categoryOption.description}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
              required
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 5 characters</span>
              <span>{subject.length}/100</span>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide detailed feedback. The more specific you are, the better we can help!"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={1000}
              required
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 10 characters</span>
              <span>{message.length}/1000</span>
            </div>
          </div>

          {/* Overall Satisfaction Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Satisfaction (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Poor</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={`${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-600">Excellent</span>
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Rating: {rating}/5 stars
              </p>
            )}
          </div>

          {/* User Info Display */}
          {user && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {user.displayName || 'Not provided'}</p>
                <p><strong>Email:</strong> {user.email || 'Not provided'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  We may contact you for follow-up questions about your feedback.
                </p>
              </div>
            </div>
          )}

          {!user && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Anonymous Feedback</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You're submitting feedback anonymously. Consider signing in if you'd like us to follow up with you.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || subject.trim().length < 5 || message.trim().length < 10}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FeedbackForm;