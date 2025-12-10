import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, completeProfile } = useAuth();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    // For anonymous users, phone number is required
    if (user?.isAnonymous && (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await completeProfile(name.trim(), phoneNumber || undefined);
      toast.success('Profile setup completed!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Profile setup error:', error);
      setError('Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Don't show modal when offline
  if (!isOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 pb-24 sm:pb-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user?.isAnonymous ? 'Create Guest Account' : 'Complete Your Profile'}
              </h2>
              <p className="text-gray-600">
                {user?.isAnonymous
                  ? 'Enter your details to continue as a guest user'
                  : 'Help us personalize your experience'
                }
              </p>

              {/* Guest Account Warning */}
              {user?.isAnonymous && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-700 text-sm">⚠️</span>
                    </div>
                    <div>
                      <span className="text-amber-800 text-sm font-semibold block">
                        This is a temporary guest account
                      </span>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                        You may lose your bag & history on logout. Upgrade to Google later to keep your data safe.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Offline Warning */}
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-2"
              >
                <WifiOff size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">You're currently offline. Profile setup requires internet connection.</span>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <span className="absolute left-10 top-3 text-gray-500">+91</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Required for shopping and bag features
                </p>
              </div>

              {/* User Type Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {user?.isAnonymous ? 'Guest Account' : 'Google Account'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {user?.isAnonymous
                    ? 'Your data is temporary. Upgrade to Google to sync across devices.'
                    : 'Your data will be synced across all your devices'
                  }
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !isOnline}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Setting up profile...</span>
                  </div>
                ) : !isOnline ? (
                  'Offline - Cannot Setup Profile'
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                This information helps us provide better service and enables booking features
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileSetupModal;