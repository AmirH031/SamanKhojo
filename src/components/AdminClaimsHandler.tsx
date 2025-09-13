import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, LogOut, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { refreshAdminClaims } from '../services/firestoreService';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AdminClaimsHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminClaimsHandler: React.FC<AdminClaimsHandlerProps> = ({ isOpen, onClose, onSuccess }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleRefreshClaims = async () => {
    setRefreshing(true);
    try {
      const hasAdminAccess = await refreshAdminClaims();
      if (hasAdminAccess) {
        toast.success('Admin permissions refreshed successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error('No admin permissions found. Please contact the system administrator.');
      }
    } catch (error) {
      console.error('Error refreshing admin claims:', error);
      toast.error('Failed to refresh permissions. Please try signing out and back in.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      toast.info('Signed out successfully. Please sign back in with your admin account.');
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Admin Permissions Required
          </h3>
          <p className="text-gray-600 text-sm">
            Your admin permissions need to be refreshed. This happens when admin claims are newly assigned to your account.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRefreshClaims}
            disabled={refreshing || signingOut}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <RefreshCw size={18} />
            )}
            <span>{refreshing ? 'Refreshing...' : 'Refresh Permissions'}</span>
          </button>

          <button
            onClick={handleSignOut}
            disabled={refreshing || signingOut}
            className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {signingOut ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <LogOut size={18} />
            )}
            <span>{signingOut ? 'Signing Out...' : 'Sign Out & Sign Back In'}</span>
          </button>

          <button
            onClick={onClose}
            disabled={refreshing || signingOut}
            className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> If refreshing doesn't work, signing out and back in will definitely resolve the issue.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminClaimsHandler;