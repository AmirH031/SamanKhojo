import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Edit3, 
  Calendar,
  MapPin,
  Shield,
  Crown,
  Star,
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import RecentActivity from '../components/RecentActivity';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const getDefaultAvatar = () => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const colorIndex = (profile?.name?.charCodeAt(0) || 0) % colors.length;
    return colors[colorIndex];
  };

  const formatJoinDate = (date: any): string => {
    try {
      const joinDate = date?.toDate ? date.toDate() : new Date(date);
      return joinDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return 'Recently';
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="text-gray-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <button
            onClick={() => navigate('/settings')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className={`w-20 h-20 ${getDefaultAvatar()} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-white text-2xl font-bold">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h2>
                  <div className="flex items-center space-x-2">
                    {profile.isGuest ? (
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                        Guest Account
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                        Verified Account
                      </span>
                    )}
                    {profile.isVerified && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Shield size={16} />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Edit3 size={20} />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                {profile.email && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Mail size={16} className="flex-shrink-0" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                )}
                
                {profile.phoneNumber && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Phone size={16} className="flex-shrink-0" />
                    <span className="text-sm">{profile.phoneNumber}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar size={16} className="flex-shrink-0" />
                  <span className="text-sm">Joined {formatJoinDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Reviews Given</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Shops Visited</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RecentActivity />
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User size={18} className="text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">Account Settings</span>
              </div>
              <ArrowLeft size={16} className="text-gray-400 rotate-180" />
            </button>

            {profile.isGuest && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Upgrade Your Account</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Create a permanent account to keep your data safe and access more features.
                    </p>
                    <button
                      onClick={() => toast.info('Account upgrade feature coming soon!')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Upgrade Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;