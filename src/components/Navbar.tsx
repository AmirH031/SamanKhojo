import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Store, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import MobileLanguageSwitch from './MobileLanguageSwitch';
import BagIcon from './BagIcon';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Store className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                SamanKhojo
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
            >
              {t('nav.home')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              to="/shops" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
            >
              {t('nav.shops')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              to="/bag" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
            >
              Bag
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              to="/settings" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group"
            >
              Settings
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Bag Icon */}
            <BagIcon />
            
            {/* User Badge */}
            {user && (
              <Link 
                to="/settings"
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <User size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {profile?.isGuest ? '👤 Guest' : `👤 ${profile?.name || 'User'}`}
                </span>
                {profile?.isGuest && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Upgrade
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <motion.div
              animate={{ rotate: isMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-t border-white/20"
          >
            <div className="px-4 py-2 space-y-2">
              <Link 
                to="/" 
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to="/shops" 
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.shops')}
              </Link>
              <Link 
                to="/bag" 
                className="block px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Bag
              </Link>
              
              {/* Mobile Language Selector */}
              <div className="px-3 py-2">
                <MobileLanguageSwitch />
              </div>
              
              {/* Mobile User Badge */}
              {user && (
                <div className="px-3 py-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User size={16} />
                    <span className="text-sm">
                      {profile?.isGuest ? '👤 Guest' : `👤 ${profile?.name || 'User'}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;