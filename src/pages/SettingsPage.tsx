import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Info, 
  FileText, 
  Shield, 
  HelpCircle, 
  Phone, 
  Instagram, 
  Youtube, 
  MessageCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Crown,
  Mail,
  MessageSquare,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '../services/languageService';
import AuthModal from '../components/AuthModal';
import FeedbackForm from '../components/FeedbackForm';
import GuestLogoutConfirmation from '../components/GuestLogoutConfirmation';
import EnhancedLanguageSelector from '../components/EnhancedLanguageSelector';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showGuestLogoutConfirm, setShowGuestLogoutConfirm] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    // Check if it's a guest account
    if (profile?.isGuest) {
      setShowGuestLogoutConfirm(true);
      return;
    }

    // Regular logout for non-guest accounts
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleGuestLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      toast.success('Guest account deleted and logged out successfully');
      setShowGuestLogoutConfirm(false);
      navigate('/');
    } catch (error) {
      console.error('Error logging out guest:', error);
      toast.error('Failed to delete guest account');
    } finally {
      setLogoutLoading(false);
    }
  };

  const menuItems: Array<{
    icon: any;
    label: string;
    path?: string;
    action?: () => void;
    color: string;
    bgColor: string;
    component?: React.ReactNode;
  }> = [
    {
      icon: Globe,
      label: 'Language / भाषा',
      action: () => setShowLanguageModal(true),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      component: (
        <div className="text-xs text-gray-500 mt-1">
          Current: {supportedLanguages.find(lang => lang.code === i18n.language)?.nativeName || 'English'}
        </div>
      )
    },
    {
      icon: FileText,
      label: 'Terms & Privacy',
      path: '/terms',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Phone,
      label: 'Contact Us',
      path: '/contact',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      icon: MessageCircle,
      label: 'Help & Support',
      path: '/support',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: MessageSquare,
      label: 'Share Feedback',
      action: () => setShowFeedbackForm(true),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },

  ];

  const socialLinks = [
    {
      icon: Instagram,
      label: 'Instagram',
      url: 'https://instagram.com/samankhojo',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Youtube,
      label: 'YouTube',
      url: 'https://youtube.com/@samankhojo',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      url: 'https://wa.me/919876543210',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const getDefaultAvatar = () => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const colorIndex = (profile?.name?.charCodeAt(0) || 0) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 mobile-safe-area">
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
            <h1 className="text-xl font-bold text-gray-900">{t('common.settings', 'Settings')}</h1>
          </div>
          

        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl"
        >
          {user && profile ? (
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Profile Avatar */}
              <div className={`w-14 h-14 md:w-16 md:h-16 ${getDefaultAvatar()} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <span className="text-white text-lg md:text-xl font-bold">
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{profile.name}</h2>
                <div className="flex flex-col space-y-1 mt-1">
                  {profile.email && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="text-xs md:text-sm truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile.phoneNumber && (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="text-xs md:text-sm">{profile.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  {profile.isGuest ? (
                    <span className="bg-amber-100 text-amber-800 px-2 md:px-3 py-1 rounded-full text-xs font-medium">
                      Guest Account
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-600 px-2 md:px-3 py-1 rounded-full text-xs font-medium">
                      Google Account
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <User className="text-gray-400" size={20} />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Welcome to SamanKhojo</h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 px-2">Sign in to access your profile and preferences</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg text-sm md:text-base"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden"
        >
          <div className="divide-y divide-gray-100">
            {menuItems.map((item, index) => (
              <motion.button
                key={`${item.path || item.label}-${index}`}
                onClick={() => item.action ? item.action() : navigate(item.path!)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50/80 transition-all group"
              >
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${item.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0`}>
                    <item.icon className={item.color} size={18} />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium text-sm md:text-base">{item.label}</span>
                    {item.component}
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" size={18} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* About Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden"
        >
          {/* About Heading */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">About</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* What is SamanKhojo and How it Works - Non-clickable */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full text-left p-4"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Info className="text-blue-600" size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold text-base mb-2">What is SamanKhojo and How it Works</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    SamanKhojo is your local business discovery platform that bridges the gap between customers and nearby shops. Using smart search technology, we help you find exactly what you're looking for in your area. Connect directly with shop owners through WhatsApp for personalized service, real-time availability, and instant communication - all while keeping your privacy protected.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* About Us - Clickable */}
            <motion.button
              onClick={() => navigate('/about')}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left p-4 hover:bg-gray-50/80 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                    <Info className="text-purple-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium text-base">About Us</span>
                    <p className="text-gray-500 text-sm mt-1">Learn more about our mission, values, and story</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" size={18} />
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Social Media Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
        >
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Connect With Us</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center space-y-1 md:space-y-2 p-2 md:p-4 rounded-2xl hover:bg-gray-50/80 transition-all group"
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 ${social.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <social.icon className={social.color} size={18} />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center">{social.label}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Logout Button */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 md:py-4 px-4 md:px-6 rounded-3xl hover:from-red-600 hover:to-pink-600 transition-all font-medium shadow-xl"
            >
              <LogOut size={18} />
              <span className="text-sm md:text-base">Log Out</span>
            </button>
          </motion.div>
        )}

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <p className="text-gray-500 text-sm">
            SamanKhojo v1.0.0
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Made with ❤️ in India
          </p>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />

      {/* Feedback Form */}
      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        onSuccess={() => setShowFeedbackForm(false)}
      />

      {/* Guest Logout Confirmation */}
      <GuestLogoutConfirmation
        isOpen={showGuestLogoutConfirm}
        onClose={() => setShowGuestLogoutConfirm(false)}
        onConfirm={handleGuestLogoutConfirm}
        loading={logoutLoading}
      />

      {/* Enhanced Language Selector Modal */}
      <EnhancedLanguageSelector
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        variant="simple"
      />
    </div>
  );
};

export default SettingsPage;