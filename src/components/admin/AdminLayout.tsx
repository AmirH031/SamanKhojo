import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, Shield, Menu, X, Crown, Sparkles, Search } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Revolutionary Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-white/95 backdrop-blur-2xl border-b border-white/40 sticky top-0 z-50 shadow-2xl"
      >
        {/* Header Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-indigo-500/5"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 py-3 sm:py-4">
            {/* Logo and Title Section */}
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <motion.div 
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-3 rounded-2xl shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <Crown className="text-white w-5 h-5 sm:w-7 sm:h-7" />
                </motion.div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="text-yellow-400" size={16} />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium hidden sm:block">{subtitle}</p>
                )}
              </div>
            </motion.div>
            
            {/* Action Buttons Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Global Search - Hidden on Mobile */}
              <div className="hidden md:block relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-64 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-300"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </motion.div>
              </div>



              {/* Enhanced Settings */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all duration-300"
              >
                <Settings size={22} />
              </motion.button>

              {/* Enhanced User Profile */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-3 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 hover:shadow-lg transition-all duration-300 border border-gray-200/50"
                >
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-2 rounded-xl shadow-lg">
                    <User className="text-white" size={18} />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">Dashboard</p>
                    <p className="text-xs text-gray-600 truncate max-w-32">Management Panel</p>
                  </div>
                </motion.button>

                {/* User Menu Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-2 z-50"
                    >
                      <button className="w-full text-left p-3 rounded-xl hover:bg-gray-100/80 transition-all text-sm font-medium text-gray-700">
                        Profile Settings
                      </button>
                      <button className="w-full text-left p-3 rounded-xl hover:bg-gray-100/80 transition-all text-sm font-medium text-gray-700">
                        Preferences
                      </button>
                      <hr className="my-2 border-gray-200" />
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left p-3 rounded-xl hover:bg-red-50 transition-all text-sm font-medium text-red-600"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Enhanced Logout Button */}
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 px-4 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                <LogOut size={18} />
                <span className="text-sm hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.3 }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </div>

      {/* Click Outside Handler */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;