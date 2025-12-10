import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Package, BarChart3, Tag, TrendingUp, 
  Activity, Users, ShoppingCart, Star, Eye, Settings, RefreshCw, Sparkles, Shield, AlertTriangle, Calendar, Image as ImageIcon
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import Shops from '../components/admin/Shops';
import ItemManager from '../components/admin/ItemManager';
import BookingAnalytics from '../components/admin/BookingAnalytics';
import FestivalManagement from '../components/admin/FestivalManagement';
import StandaloneBannerManager from '../components/admin/StandaloneBannerManager';
import ReferenceIdMigration from '../components/admin/ReferenceIdMigration';

import Categories from '../components/admin/Categories';
import TrendingManager from '../components/admin/TrendingManager';
import ShopDiagnostics from '../components/admin/ShopDiagnostics';
import { getShops } from '../services/firestoreService';
import { getItems } from '../services/itemService';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { toast } from 'react-toastify';
import '../styles/admin-animations.css';

type TabType = 'overview' | 'shops' | 'items' | 'categories' | 'trending' | 'analytics' | 'diagnostics' | 'festivals' | 'banners' | 'reference-ids';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [quickStats, setQuickStats] = useState({
    totalShops: 0,
    totalItems: 0,
    totalBookings: 0,
    totalReviews: 0,
    totalCategories: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const { isAdmin, validation, loading: authLoading, user } = useAdminAuth();

  useEffect(() => {
    if (!authLoading && isAdmin && validation.isValid) {
      loadDashboardData();
    }
  }, [authLoading, isAdmin, validation, user]);

  const loadDashboardData = async () => {
    try {
      setQuickStats(prev => ({ ...prev, loading: true }));
      
      // Fetch real data in parallel
      const [shopsData, bookingsData, reviewsData] = await Promise.all([
        fetchShopsData(),
        fetchBookingsData(),
        fetchReviewsData()
      ]);

      // Fetch items data for all shops
      const itemsData = await fetchItemsData(shopsData.shops);
      
      // Fetch recent activity
      const activityData = await fetchRecentActivity();

      setQuickStats({
        totalShops: shopsData.totalShops,
        totalItems: itemsData.totalItems,
        totalBookings: bookingsData.totalBookings,
        totalReviews: reviewsData.totalReviews,
        totalCategories: itemsData.totalCategories,
        loading: false
      });

      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setQuickStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchShopsData = async () => {
    try {
      const shops = await getShops(true); // Include hidden shops for admin
      return {
        shops,
        totalShops: shops.length
      };
    } catch (error) {
      console.error('Error fetching shops:', error);
      return { shops: [], totalShops: 0 };
    }
  };

  const fetchItemsData = async (shops: any[]) => {
    try {
      let totalItems = 0;
      const categoriesSet = new Set<string>();

      // Fetch items for each shop
      for (const shop of shops) {
        try {
          const items = await getItems(shop.id, undefined, true); // Include unavailable items
          totalItems += items.length;
          
          // Collect unique categories from items
          items.forEach(item => {
            if (item.category && item.category.trim()) {
              categoriesSet.add(item.category.trim());
            }
          });
        } catch (error) {
          console.error(`Error fetching items for shop ${shop.id}:`, error);
        }
      }

      // Also fetch categories from the categories collection
      try {
        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        
        categoriesSnapshot.forEach(doc => {
          const category = doc.data();
          if (category.name && category.name.trim()) {
            categoriesSet.add(category.name.trim());
          }
        });
      } catch (error) {
        console.error('Error fetching categories collection:', error);
      }

      return {
        totalItems,
        totalCategories: categoriesSet.size
      };
    } catch (error) {
      console.error('Error fetching items data:', error);
      return { totalItems: 0, totalCategories: 0 };
    }
  };

  const fetchBookingsData = async () => {
    try {
      // Try to fetch bookings, but handle permission errors gracefully
      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);
      return {
        totalBookings: bookingsSnapshot.size
      };
    } catch (error: any) {
      // If permission denied, return 0 without logging error
      if (error.code === 'permission-denied') {
        return { totalBookings: 0 };
      }
      console.error('Error fetching bookings:', error);
      return { totalBookings: 0 };
    }
  };

  const fetchReviewsData = async () => {
    try {
      // Try to fetch reviews, but handle permission errors gracefully
      const reviewsRef = collection(db, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      return {
        totalReviews: reviewsSnapshot.size
      };
    } catch (error: any) {
      // If permission denied, return 0 without logging error
      if (error.code === 'permission-denied') {
        return { totalReviews: 0 };
      }
      console.error('Error fetching reviews:', error);
      return { totalReviews: 0 };
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities = [];

      // For now, skip direct Firestore queries and use placeholder data
      // TODO: Implement proper admin API endpoints for dashboard data
      
      // Add some default activities
      activities.push(
        { type: 'info', description: 'Dashboard loaded successfully', time: 'now', icon: Activity },
        { type: 'system', description: 'Admin panel ready', time: '1 min ago', icon: Settings },
        { type: 'shop', description: 'Shop management available', time: '2 min ago', icon: Store },
        { type: 'item', description: 'Item management ready', time: '3 min ago', icon: Package }
      );

      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [
        { type: 'info', description: 'Welcome to your dashboard', time: 'now', icon: Activity },
        { type: 'system', description: 'System ready for management', time: '1 min ago', icon: Settings }
      ];
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s*(sec|min|hr|days)/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'sec': return value;
      case 'min': return value * 60;
      case 'hr': return value * 3600;
      case 'days': return value * 86400;
      default: return 0;
    }
  };

  const formatBadgeNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity, badge: null, color: 'from-violet-500 to-purple-600' },
    { id: 'shops' as TabType, label: 'Shops', icon: Store, badge: quickStats.loading ? '...' : quickStats.totalShops.toString(), color: 'from-blue-500 to-cyan-600' },
    { id: 'items' as TabType, label: 'Items', icon: Package, badge: quickStats.loading ? '...' : formatBadgeNumber(quickStats.totalItems), color: 'from-emerald-500 to-teal-600' },
    { id: 'categories' as TabType, label: 'Categories', icon: Tag, badge: quickStats.loading ? '...' : quickStats.totalCategories.toString(), color: 'from-pink-500 to-rose-600' },
    { id: 'trending' as TabType, label: 'Trending', icon: TrendingUp, badge: null, color: 'from-amber-500 to-yellow-600' },
    { id: 'festivals' as TabType, label: 'Festivals', icon: Calendar, badge: null, color: 'from-orange-500 to-red-600' },
    { id: 'banners' as TabType, label: 'Banners', icon: ImageIcon, badge: null, color: 'from-purple-500 to-indigo-600' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3, badge: null, color: 'from-indigo-500 to-blue-600' },
    { id: 'diagnostics' as TabType, label: 'Diagnostics', icon: Settings, badge: null, color: 'from-teal-500 to-cyan-600' },
    { id: 'reference-ids' as TabType, label: 'Reference IDs', icon: Shield, badge: null, color: 'from-gray-500 to-slate-600' },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Enhanced Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Welcome back!</h2>
                <p className="text-purple-100 text-sm sm:text-base">Here's what's happening with your platform today</p>
              </div>
            </div>
            <motion.button
              onClick={loadDashboardData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={quickStats.loading}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${quickStats.loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </motion.button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-2xl sm:blur-3xl -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-white/10 rounded-full blur-2xl sm:blur-3xl translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>
      </motion.div>

      {/* Enhanced Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {[
          {
            title: 'Total Shops',
            value: quickStats.totalShops,
            icon: Store,
            color: 'from-blue-500 via-blue-600 to-cyan-600',
            bgPattern: 'bg-blue-50',
            iconBg: 'bg-blue-500'
          },
          {
            title: 'Total Items',
            value: quickStats.totalItems,
            icon: Package,
            color: 'from-emerald-500 via-green-600 to-teal-600',
            bgPattern: 'bg-emerald-50',
            iconBg: 'bg-emerald-500'
          },
          {
            title: 'Total Bookings',
            value: quickStats.totalBookings,
            icon: ShoppingCart,
            color: 'from-orange-500 via-amber-600 to-yellow-600',
            bgPattern: 'bg-orange-50',
            iconBg: 'bg-orange-500'
          },
          {
            title: 'Total Reviews',
            value: quickStats.totalReviews,
            icon: Star,
            color: 'from-purple-500 via-violet-600 to-indigo-600',
            bgPattern: 'bg-purple-50',
            iconBg: 'bg-purple-500'
          },
          {
            title: 'Categories',
            value: quickStats.totalCategories,
            icon: Tag,
            color: 'from-pink-500 via-rose-600 to-red-600',
            bgPattern: 'bg-pink-50',
            iconBg: 'bg-pink-500'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring", bounce: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/30 hover:shadow-2xl transition-all duration-500"
          >
            {/* Background Pattern */}
            <div className={`absolute inset-0 ${stat.bgPattern} opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
            
            {/* Floating Orbs */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-2 tracking-wide uppercase">{stat.title}</p>
                  {quickStats.loading ? (
                    <div className="space-y-2">
                      <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : (
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring", bounce: 0.5 }}
                      className="text-4xl font-black text-gray-900 mb-3"
                    >
                      {stat.value.toLocaleString()}
                    </motion.p>
                  )}
                </div>
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`${stat.iconBg} p-4 rounded-2xl shadow-lg group-hover:shadow-xl`}
                >
                  <stat.icon className="text-white" size={28} />
                </motion.div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                    <Activity size={14} />
                    <span className="text-sm font-bold">Live</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">Real-time data</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
              <p className="text-gray-600">Latest platform updates</p>
            </div>
          </div>
          <motion.button 
            onClick={loadDashboardData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={quickStats.loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`${quickStats.loading ? 'animate-spin' : ''}`} size={16} />
            <span className="text-sm font-medium">Refresh</span>
          </motion.button>
        </div>
        
        <div className="space-y-4">
          {quickStats.loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-5 rounded-2xl bg-gray-50 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600">Activity will appear here as users interact with your platform</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1, type: "spring", bounce: 0.3 }}
              whileHover={{ x: 5, scale: 1.02 }}
              className="group relative overflow-hidden flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-white hover:from-white hover:to-gray-50 transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:shadow-lg"
            >
              {/* Activity Type Indicator */}
              <div className={`p-3 rounded-xl shadow-md ${
                activity.type === 'booking' ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                activity.type === 'review' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                activity.type === 'shop' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                activity.type === 'item' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                activity.type === 'system' ? 'bg-gradient-to-br from-purple-400 to-violet-500' :
                'bg-gradient-to-br from-green-400 to-emerald-500'
              }`}>
                <activity.icon className="text-white" size={18} />
              </div>
              
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900 mb-1">{activity.description}</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600">{activity.time}</p>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              >
                <Eye size={18} />
              </motion.button>
              
              {/* Decorative Element */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-white/60 to-transparent rounded-full blur-sm group-hover:scale-150 transition-transform duration-500"></div>
            </motion.div>
            ))
          )}
        </div>
        
        {/* View All Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline transition-all duration-200">
            View all activity →
          </button>
        </motion.div>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'shops':
        return <Shops />;
      case 'items':
        return <ItemManager />;
      case 'categories':
        return <Categories />;
      case 'trending':
        return <TrendingManager />;
      case 'festivals':
        return <FestivalManagement />;
      case 'banners':
        return <StandaloneBannerManager />;
      case 'analytics':
        return <BookingAnalytics />;
      case 'diagnostics':
        return <ShopDiagnostics />;
      case 'reference-ids':
        return <ReferenceIdMigration />;
      default:
        return renderOverview();
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin || !validation.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Insufficient permissions</p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Manage shops, items, and platform settings"
    >

      {/* Revolutionary Tab Navigation */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl p-4 mb-8 border border-white/40 shadow-2xl">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
        
        <div className="relative z-10">
          {/* Enhanced Mobile Navigation */}
          <div className="block lg:hidden mb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-xl border border-white/40 rounded-2xl px-6 py-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-lg appearance-none cursor-pointer"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id} className="font-medium">
                    {tab.label} {tab.badge ? `(${tab.badge})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Tablet Navigation - Horizontal Scroll */}
          <div className="hidden sm:block lg:hidden mb-6">
            <div className="flex space-x-3 overflow-x-auto pb-4 custom-scrollbar">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-white/80 hover:text-gray-900 bg-white/60'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm whitespace-nowrap">{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/25 text-white'
                        : 'bg-violet-100 text-violet-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden lg:flex flex-wrap gap-3">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-2xl shadow-violet-500/25`
                    : 'text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-lg'
                }`}
              >
                {/* Icon with Rotation Effect */}
                <motion.div
                  whileHover={{ rotate: activeTab === tab.id ? 0 : 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <tab.icon size={20} />
                </motion.div>
                
                <span className="text-sm font-bold tracking-wide">{tab.label}</span>
                
                {/* Enhanced Badge */}
                {tab.badge && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/25 text-white backdrop-blur-sm'
                        : 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700'
                    }`}
                  >
                    {tab.badge}
                  </motion.span>
                )}
                
                {/* Active Tab Glow Effect */}
                {activeTab === tab.id && (
                  <>
                    <motion.div
                      layoutId="activeTabGlow"
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl -z-10`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                    <motion.div
                      layoutId="activeTabBlur"
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl blur-lg opacity-50 -z-20`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  </>
                )}
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`}></div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content with Enhanced Animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

    </AdminLayout>
  );
};

export default AdminDashboard