import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShopCard from '../components/ShopCard';
import { getCurrentLocation } from '../services/locationService';
import { api } from '../services/api';
import { Shop, ServiceDetails } from '../types';

const ShopsPage = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all'); // 'all', 'product', 'menu', 'service'
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        // Get user location
        const location = await getCurrentLocation();
        setUserLocation(location);

        // Check for search query
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');

        // Always use Firestore directly to ensure all shops are visible
        // This prevents issues with backend service filtering or caching
        let shopsData;
        const { getShops: getFirestoreShops, searchShops } = await import('../services/firestoreService');

        if (searchQuery) {
          shopsData = await searchShops(searchQuery);
        } else {
          shopsData = await getFirestoreShops();
        }

        // Try to enhance with backend service data if available (for distance calculation, etc.)
        try {
          const params: Record<string, string> = {};
          if (location) {
            params.lat = location.latitude.toString();
            params.lng = location.longitude.toString();
          }
          if (searchQuery) params.search = searchQuery;
          params.sortBy = 'distance';

          const backendShops = await api.get('/shops?' + new URLSearchParams(params).toString());

          // Merge backend data (like distance) with Firestore data
          if (backendShops && backendShops.length > 0) {
            shopsData = shopsData.map(shop => {
              const backendShop = backendShops.find(bs => bs.id === shop.id);
              return backendShop ? { ...shop, distance: backendShop.distance } : shop;
            });
          }
        } catch (backendError) {
          console.warn('Backend service unavailable for distance calculation:', backendError);
          // Continue with Firestore data only
        }

        // Filter out hidden shops for public view
        const visibleShops = shopsData.filter(shop => !shop.isHidden);

        if (searchQuery) {
          setSearchResults(visibleShops);
          setFilteredShops(visibleShops);
        } else {
          setShops(visibleShops);
          setFilteredShops(visibleShops);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        // Fallback without location - always use Firestore to ensure all shops are visible
        try {
          const { getShops: getFirestoreShops } = await import('../services/firestoreService');
          const fallbackShops = await getFirestoreShops();
          const visibleFallbackShops = fallbackShops.filter(shop => !shop.isHidden);
          setShops(visibleFallbackShops);
          setFilteredShops(visibleFallbackShops);
        } catch (fallbackError) {
          console.error('Error in fallback fetch:', fallbackError);
          setShops([]);
          setFilteredShops([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  useEffect(() => {
    // Use search results if available, otherwise use all shops
    const sourceShops = searchResults.length > 0 ? searchResults : shops;

    let filtered = sourceShops.filter(shop => {
      // Text search
      const textMatch = 
        shop.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.items && shop.items.some(item => 
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (shop.shopType === 'service' && shop.serviceDetails && (
          shop.serviceDetails.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.serviceDetails.serviceCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shop.serviceDetails.description?.some(desc => 
            desc.toLowerCase().includes(searchTerm.toLowerCase())
          )
        ));

      // Type filter
      const typeMatch = filterType === 'all' || shop.shopType === filterType;

      return textMatch && typeMatch;
    });

    // Sort shops
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.shopName || '').localeCompare(b.shopName || '');
        case 'rating':
          const avgRatingA = a.ratings?.length > 0 ? a.ratings.reduce((sum, r) => sum + r, 0) / a.ratings.length : 0;
          const avgRatingB = b.ratings?.length > 0 ? b.ratings.reduce((sum, r) => sum + r, 0) / b.ratings.length : 0;
          return avgRatingB - avgRatingA;
        case 'latest':
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        case 'distance':
          const distanceA = a.distance || 999;
          const distanceB = b.distance || 999;
          return distanceA - distanceB;
        default:
          return 0;
      }
    });

    setFilteredShops(filtered);
  }, [searchTerm, sortBy, filterType, shops, searchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Shops</h2>
            <p className="text-gray-600">Please wait while we fetch the latest shop information...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-6 md:py-8 mobile-safe-area">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 sm:mb-8 md:mb-12"
        >
          {searchResults.length > 0 ? (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                Search Results
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
                Found {searchResults.length} shops matching your search
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
                All Registered Shops
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
                Browse through our verified local shops and find what you need
              </p>
            </>
          )}
        </motion.div>

        {/* Search and Filter Controls - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-white/20 shadow-lg"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 text-sm sm:text-base"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Shop Type Filter */}
              <div className="flex items-center space-x-2 flex-1">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-sm sm:text-base"
                >
                  <option value="all">All Shops</option>
                  <option value="product">🛍️ Product Shops</option>
                  <option value="menu">🍽️ Restaurants</option>
                  <option value="service">🔧 Service Providers</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2 flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-sm sm:text-base"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="latest">Sort by Latest</option>
                  <option value="distance">Sort by Distance</option>
                </select>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600 flex-shrink-0 self-center">
                {filteredShops.length} of {shops.length}
                {filterType !== 'all' && (
                  <span className="ml-1 text-blue-600">
                    ({filterType === 'service' ? 'services' : filterType === 'menu' ? 'restaurants' : 'products'})
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shops Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filteredShops.map((shop, index) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              index={index}
            />
          ))}
        </div>


        {/* No Results */}
        {filteredShops.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-lg">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No shops found</h2>
              <p className="text-gray-600 mb-6">
                {shops.length === 0
                  ? "No shops are currently available in your area. Please check back later or contact support."
                  : "Try adjusting your search terms or browse all available shops."
                }
              </p>
              {shops.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    📍 <strong>Demo Mode:</strong> Real shop data is being loaded. This area will show actual local businesses once they register.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('name');
                  setSearchResults([]);
                  // Reload all shops
                  window.location.href = '/shops';
                }}
                className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-medium"
              >
                {searchResults.length > 0 ? 'Browse All Shops' : 'Clear Filters'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Data Status Indicator */}
        {filteredShops.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
          </motion.div>
        )}
      </div>

      {/* Floating Contact Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-24 md:bottom-6 right-6 z-40"
      >
      </motion.div>
    </div>
  );
};

export default ShopsPage;
