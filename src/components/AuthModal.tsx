import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, AlertCircle, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpgrade?: boolean; // New prop to indicate if this is an upgrade flow
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isUpgrade = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { loginWithGoogle, loginAsGuest, user } = useAuth();

  const handleGoogleSignIn = async () => {
    if (!agreeToTerms) {
      setError('Please agree to the Terms and Conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      toast.success('Signed in with Google successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.');
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    if (!agreeToTerms) {
      setError('Please agree to the Terms and Conditions to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginAsGuest();
      toast.success('Continuing as guest!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Guest sign-in error:', error);
      setError('Failed to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setAgreeToTerms(false);
    onClose();
  };

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
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
          >
            {/* Header */}
            <div className="text-center mb-6 relative">
              <button
                onClick={handleClose}
                className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="text-white" size={24} />
              </div>

              {isUpgrade ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upgrade Your Account
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Sign in with Google to keep your data safe and sync across devices
                  </p>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="text-green-600" size={18} />
                      <span className="text-green-800 text-sm font-medium">
                        Your cart and preferences will be preserved
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to SamanKhojo
                  </h2>
                  <p className="text-gray-600">
                    Choose how you'd like to continue
                  </p>
                </>
              )}
            </div>

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

            <div className="space-y-4">
              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-relaxed">
                  <div className="flex items-center space-x-1 mb-1">
                    <Shield size={14} className="text-blue-600" />
                    <span className="font-medium">I agree to the terms</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    By continuing, you agree to our{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Terms
                    </a>
                    {' '}and{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </label>
              </div>

              {/* Google Sign-In Button */}
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading || !agreeToTerms}
                whileHover={{ scale: agreeToTerms && !loading ? 1.02 : 1 }}
                whileTap={{ scale: agreeToTerms && !loading ? 0.98 : 1 }}
                className={`w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-4 px-4 rounded-2xl transition-all font-medium shadow-sm ${loading || !agreeToTerms
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
                  }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                    <ArrowRight size={16} className="ml-auto" />
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Guest Sign-In Button */}
              <motion.button
                onClick={handleGuestSignIn}
                disabled={loading || !agreeToTerms}
                whileHover={{ scale: agreeToTerms && !loading ? 1.02 : 1 }}
                whileTap={{ scale: agreeToTerms && !loading ? 0.98 : 1 }}
                className={`w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-4 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-sm ${loading || !agreeToTerms
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md'
                  }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <User size={20} />
                    <span>Continue as Guest</span>
                    <ArrowRight size={16} className="ml-auto" />
                  </>
                )}
              </motion.button>

              {/* Benefits */}
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2 font-medium">
                    Why sign in?
                  </p>
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    <span>• Save cart</span>
                    <span>• Order history</span>
                    <span>• Faster checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;