import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface GuestLogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const GuestLogoutConfirmation: React.FC<GuestLogoutConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 pb-24 sm:pb-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6"
      >
        <div className="text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-amber-600" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Logout Guest Account?
          </h3>

          {/* Description */}
          <div className="text-gray-600 mb-6 space-y-2">
            <p>
              You're currently using a guest account. Logging out will permanently delete:
            </p>
            <ul className="text-left bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <li>• Your bag items</li>
              <li>• Your inquiry history</li>
              <li>• Your account preferences</li>
              <li>• All associated data</li>
            </ul>
            <p className="text-sm font-medium text-amber-700">
              This action cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogOut size={18} />
                  <span>Logout & Delete</span>
                </>
              )}
            </button>
          </div>

          {/* Alternative Action */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Want to keep your data? Create a permanent account instead:
            </p>
            <button
              onClick={() => {
                onClose();
                // This will be handled by the parent component to show auth modal
              }}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuestLogoutConfirmation;