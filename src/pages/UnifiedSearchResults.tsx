import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  Package,
  Utensils,
  Wrench,
  Store,
  Grid,
  List,
  SortAsc,
  ExternalLink,
  Navigation,
  ShoppingCart,
  Heart,
  Zap,
  Calendar,
  Eye,
  Phone
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { addToBag } from '../services/bagService';
import { getCurrentLocation } from '../services/locationService';
import ItemCard from '../components/ItemCard';
import ShopCard from '../components/ShopCard';

import { saveRecentSearch } from '../services/searchService';
import ComingSoonModal from '../components/ComingSoonModal';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult {
  id: string;
  referenceId?: string;
  type: 'item' | 'shop' | 'menu' | 'service' | 'product' | 'office';
  name: string;
  description: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  price?: number;
  distance?: number;
  matchScore?: number;
  category?: string;
  availability?: boolean;
  inStock?: number;
  imageUrl?: string;
  location?: { lat: number; lng: number };
  brand_name?: string;
  variety?: string;
  hindi_name?: string;
}

interface Shop {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  type: string;
  shopType: 'product' | 'menu' | 'service' | 'office';
  isOpen: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  location: { lat: number; lng: number };
  averageRating?: number;
  totalReviews?: number;
  distance?: number;
  imageUrl?: string;
}

const UnifiedSearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const { user } = useAuth();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [services, setServices] = useState<SearchResult[]>([]);
  const [offices, setOffices] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'items' | 'shops' | 'services' | 'offices'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'rating' | 'price'>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonType, setComingSoonType] = useState<'product' | 'service'>('product');


  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation({ lat: location.latitude, lng: location.longitude });
    } catch (error) {
      console.warn('Could not get user location:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    // Save to recent searches
    saveRecentSearch(query.trim());

    setLoading(true);
    
    try {
      // Check if query looks like a reference ID first for direct lookup
      const trimmedQuery = query.trim().toUpperCase();
      const isReferenceId = /^(SHP|PRD|MNU|SRV|OFF)-[A-Z]{3}-\d{3}$/.test(trimmedQuery);
      
      let searchResults: SearchResult[] = [];
      
      if (isReferenceId) {
        // Direct reference ID lookup for highest accuracy
        try {
          const directResult = await api.get(`/search/reference/${trimmedQuery}`);
          if (directResult) {
            searchResults = [directResult];
            toast.success(`Found exact match for ${trimmedQuery}`);
          }
        } catch (error) {
          console.warn('Reference ID lookup failed, falling back to universal search');
        }
      }
      
      // If no direct match or not a reference ID, use universal search
      if (searchResults.length === 0) {
        const params = new URLSearchParams({ q: query });
        if (userLocation) {
          params.append('lat', userLocation.lat.toString());
          params.append('lng', userLocation.lng.toString());
        }

        searchResults = await api.get(`/search/universal?${params.toString()}`);
      }

      // Enhanced result processing with better categorization
      const items = searchResults.filter((result: SearchResult) =>
        ['item', 'menu', 'product'].includes(result.type)
      );
      const services = searchResults.filter((result: SearchResult) =>
        result.type === 'service'
      );
      const shopResults = searchResults.filter((result: SearchResult) =>
        result.type === 'shop'
      );
      const officeResults = searchResults.filter((result: SearchResult) =>
        result.type === 'office'
      );

      // Sort results by relevance and availability
      items.sort((a, b) => {
        // Reference ID exact matches first (highest priority)
        const aIsExactRef = a.referenceId && a.referenceId.toLowerCase().includes(query.toLowerCase());
        const bIsExactRef = b.referenceId && b.referenceId.toLowerCase().includes(query.toLowerCase());
        if (aIsExactRef && !bIsExactRef) return -1;
        if (bIsExactRef && !aIsExactRef) return 1;
        
        // Available items next
        const aAvailable = a.availability !== false;
        const bAvailable = b.availability !== false;
        if (aAvailable && !bAvailable) return -1;
        if (bAvailable && !aAvailable) return 1;

        // Then by match score
        return (b.matchScore || 0) - (a.matchScore || 0);
      });

      // Sort services similarly
      services.sort((a, b) => {
        const aIsExactRef = a.referenceId && a.referenceId.toLowerCase().includes(query.toLowerCase());
        const bIsExactRef = b.referenceId && b.referenceId.toLowerCase().includes(query.toLowerCase());
        if (aIsExactRef && !bIsExactRef) return -1;
        if (bIsExactRef && !aIsExactRef) return 1;
        return (b.matchScore || 0) - (a.matchScore || 0);
      });

      setResults(items);
      setServices(services);
      setShops(shopResults.map(convertToShop));
      setOffices(officeResults.map(convertToShop));

      // Track unavailable products for alert system
      await trackUnavailableProducts(items, services);

      // Show "did you mean" suggestions if no results
      if (searchResults.length === 0) {
        try {
          const suggestions = await api.get(`/search/did-you-mean?q=${encodeURIComponent(query)}`);
          if (suggestions.length > 0) {
            toast.info(`Did you mean: ${suggestions.slice(0, 3).join(', ')}?`);
          }
        } catch (error) {
          console.warn('Could not get suggestions:', error);
        }
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setResults([]);
      setShops([]);
      setServices([]);
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  const trackUnavailableProducts = async (items: SearchResult[], services: SearchResult[]) => {
    if (!user?.uid) return;

    try {
      const unavailableItems = [...items, ...services].filter(item => 
        item.availability === false || item.inStock === 0
      );

      if (unavailableItems.length > 0) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            userId: user.uid,
            searchQuery: query,
            unavailableProducts: unavailableItems.map(item => ({
              productId: item.id,
              productName: item.name,
              shopId: item.shopId,
              shopName: item.shopName,
              category: item.category,
              price: item.price
            }))
          })
        });
      }
    } catch (error) {
      console.warn('Failed to track unavailable products:', error);
    }
  };



  const convertToShop = (result: SearchResult): Shop => ({
    id: result.shopId,
    shopName: result.shopName,
    address: result.shopAddress,
    phone: result.shopPhone || '',
    type: result.category || result.type,
    shopType: result.shopType || (
      result.type === 'service' ? 'service' : 
      result.type === 'office' ? 'office' : 'product'
    ),
    isOpen: true,
    isFeatured: false,
    isVerified: false,
    location: result.location || { lat: 0, lng: 0 },
    distance: result.distance,
    imageUrl: result.imageUrl,
    ownerName: '',
    isHidden: false,
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any
  });

  const convertToItem = (result: SearchResult) => ({
    id: result.id,
    shopId: result.shopId,
    type: result.type as 'product' | 'menu' | 'service',
    name: result.name,
    hindi_name: result.hindi_name,
    description: result.description,
    price: result.price,
    availability: result.availability,
    inStock: result.inStock,
    category: result.category,
    brand_name: result.brand_name,
    variety: result.variety,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Filtering logic for correct section visibility
  const getItemsOnly = () => results;
  const getServicesOnly = () => services;

  // Filtered items for display (items only, not services)
  const filteredItems = () => {
    if (viewMode === 'items') {
      return [...results].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.matchScore || 0) - (a.matchScore || 0);
          case 'price':
            return (a.price || 0) - (b.price || 0);
          default:
            return (b.matchScore || 0) - (a.matchScore || 0);
        }
      });
    } else if (viewMode === 'all') {
      return [...results].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.matchScore || 0) - (a.matchScore || 0);
          case 'price':
            return (a.price || 0) - (b.price || 0);
          default:
            return (b.matchScore || 0) - (a.matchScore || 0);
        }
      });
    }
    return [];
  };

  // Filtered services for display (services only, not items)
  const filteredServices = () => {
    if (viewMode === 'services') {
      return [...services].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.matchScore || 0) - (a.matchScore || 0);
          case 'price':
            return (a.price || 0) - (b.price || 0);
          default:
            return (b.matchScore || 0) - (a.matchScore || 0);
        }
      });
    } else if (viewMode === 'all') {
      return [...services].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.matchScore || 0) - (a.matchScore || 0);
          case 'price':
            return (a.price || 0) - (b.price || 0);
          default:
            return (b.matchScore || 0) - (a.matchScore || 0);
        }
      });
    }
    return [];
  };

  // Only show shops referenced by currently visible items/services
  const filteredShops = () => {
    let relevantShopIds: string[] = [];
    if (viewMode === 'items') {
      relevantShopIds = filteredItems().map(item => item.shopId);
    } else if (viewMode === 'services') {
      relevantShopIds = filteredServices().map(service => service.shopId);
    } else if (viewMode === 'all') {
      relevantShopIds = [
        ...filteredItems().map(item => item.shopId),
        ...filteredServices().map(service => service.shopId)
      ];
    } else if (viewMode === 'shops') {
      // In shops view, show all shops
      return [...shops].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            return 0;
        }
      });
    }
    relevantShopIds = Array.from(new Set(relevantShopIds));
    const filtered = shops.filter(shop => relevantShopIds.includes(shop.id));
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });
  };

  // Filtered offices for display
  const filteredOffices = () => {
    if (viewMode === 'offices') {
      return [...offices].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            return 0;
        }
      });
    } else if (viewMode === 'all') {
      return [...offices].sort((a, b) => {
        switch (sortBy) {
          case 'distance':
            return (a.distance || Infinity) - (b.distance || Infinity);
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            return 0;
        }
      });
    }
    return [];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'item': return <Package size={16} className="text-blue-600" />;
      case 'menu': return <Utensils size={16} className="text-orange-600" />;
      case 'service': return <Wrench size={16} className="text-purple-600" />;
      case 'shop': return <Store size={16} className="text-green-600" />;
      default: return <Search size={16} className="text-gray-600" />;
    }
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return '🛍️';
      case 'menu': return '🍽️';
      case 'service': return '🔧';
      default: return '📦';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'from-green-500 to-emerald-600';
      case 'menu': return 'from-orange-500 to-red-600';
      case 'service': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const generateWhatsAppLink = (result: SearchResult) => {
    const message = result.type === 'service' 
      ? `Hi ${result.shopName}, I want to book ${result.name} service. Please confirm availability and pricing. - From SamanKhojo`
      : `Hi ${result.shopName}, I'm interested in ${result.name}. Please confirm availability and pricing. - From SamanKhojo`;
    
    const cleanPhone = result.shopPhone?.replace(/[^0-9]/g, '') || '';
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // For counts, use filtered lists
  const itemsCount = filteredItems().length;
  const servicesCount = filteredServices().length;
  const shopsCount = filteredShops().length;
  const officesCount = filteredOffices().length;
  const totalResults = itemsCount + servicesCount + shopsCount + officesCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Search Results for "{query}"
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {loading ? 'Searching...' : `${totalResults} results found`}
                  {!loading && totalResults > 0 && (
                    <span className="ml-2 text-gray-500">
                      ({itemsCount} items, {servicesCount} services, {shopsCount} shops, {officesCount} offices)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full sm:w-auto">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode('items')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'items' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'
                    }`}
                >
                  Items
                </button>
                <button
                  onClick={() => setViewMode('services')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'services' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
                    }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setViewMode('shops')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'shops' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'
                    }`}
                >
                  Shops
                </button>
                <button
                  onClick={() => setViewMode('offices')}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${viewMode === 'offices' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600'
                    }`}
                >
                  Offices
                </button>
              </div>
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="relevance">Most Relevant</option>
                <option value="distance">Nearest First</option>
                <option value="rating">Highest Rated</option>
                <option value="price">Price: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </div>



      {/* Results */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : totalResults === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-lg max-w-md mx-auto">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No results found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find anything matching "{query}". Try different keywords or browse our categories.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/shops')}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-medium"
                >
                  Browse All Shops
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Items Results */}
            {(viewMode === 'all' || viewMode === 'items') && filteredItems().length > 0 && (
              <div>
                <div className="flex flex-wrap items-center space-x-2 mb-4 sm:mb-6">
                  <Package className="text-green-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Items & Menu</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {getItemsOnly().length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {filteredItems().map((result, index) => (
                    <motion.div
                      key={`${result.type}-${result.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="relative bg-white/90 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:scale-[1.02]">
                        {/* Item Header */}
                        <div className="p-3 sm:p-4 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getItemTypeColor(result.type)} rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-lg`}>
                                {getItemTypeIcon(result.type)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[120px] sm:max-w-none">
                                  {result.name}
                                </h3>
                                {result.hindi_name && (
                                  <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-none">{result.hindi_name}</p>
                                )}
                                {result.referenceId && (
                                  <p className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                                    {result.referenceId}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.type === 'product' ? 'bg-green-100 text-green-800' :
                                      result.type === 'menu' ? 'bg-orange-100 text-orange-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                    {result.type}
                                  </span>
                                  {result.category && (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                      {result.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {result.price && (
                              <div className="text-right min-w-[60px]">
                                <span className="text-base sm:text-lg font-bold text-green-600">₹{result.price}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shop Info Section */}
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Store size={14} className="text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-blue-900 hover:text-blue-700 transition-colors truncate max-w-[100px] sm:max-w-none">
                                  {result.shopName}
                                </h4>
                                <div className="flex items-center space-x-1 text-xs text-blue-700">
                                  <MapPin size={12} />
                                  <span className="truncate max-w-[80px] sm:max-w-32">{result.shopAddress}</span>
                                  {result.distance && (
                                    <>
                                      <span>•</span>
                                      <span className="font-medium text-green-600">{formatDistance(result.distance)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className="p-3 sm:p-4">
                          {result.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                              {result.description}
                            </p>
                          )}

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                            {result.brand_name && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                {result.brand_name}
                              </span>
                            )}
                            {result.variety && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {result.variety}
                              </span>
                            )}
                            {result.availability !== false && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Available
                              </span>
                            )}
                          </div>

                          {/* Distance Display */}
                          {result.distance && (
                            <div className="flex items-center space-x-1 text-xs text-green-600 font-medium mb-2">
                              <MapPin size={12} />
                              <span>{formatDistance(result.distance)} away</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await addToBag({
                                    itemId: `${result.shopId}-${result.id}`,
                                    itemName: result.name,
                                    shopId: result.shopId,
                                    shopName: result.shopName,
                                    price: result.price
                                  });
                                  toast.success(`${result.name} added to bag!`);
                                } catch (err: any) {
                                  toast.error(err?.message || 'Failed to add to bag');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-2 sm:px-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-xs sm:text-sm"
                            >
                              <ShoppingCart size={14} />
                              <span>Add to Bag</span>
                            </button>
                            <button
                              onClick={() => {
                                if (result.location?.lat && result.location?.lng) {
                                  window.open(`https://maps.google.com/?q=${result.location.lat},${result.location.lng}`, '_blank');
                                } else {
                                  toast.info('Location not available for directions');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 py-2 px-2 sm:px-3 rounded-lg hover:bg-blue-200 transition-all font-medium text-xs sm:text-sm"
                            >
                              <Navigation size={14} />
                              <span>Directions</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Action Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Zap size={16} className="text-yellow-500" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Services Results */}
            {(viewMode === 'all' || viewMode === 'services') && filteredServices().length > 0 && (
              <div>
                <div className="flex flex-wrap items-center space-x-2 mb-4 sm:mb-6">
                  <Wrench className="text-purple-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Services</h2>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                    {getServicesOnly().length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {filteredServices().map((result, index) => (
                    <motion.div
                      key={`service-${result.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-md rounded-2xl border border-purple-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:scale-[1.02]">
                        {/* Service Header */}
                        <div className="p-3 sm:p-4 border-b border-purple-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl shadow-lg">
                                <Wrench size={20} />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate max-w-[120px] sm:max-w-none">
                                  {result.name}
                                </h3>
                                {result.hindi_name && (
                                  <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[100px] sm:max-w-none">{result.hindi_name}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Service Provider
                                  </span>
                                  {result.category && (
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                                      {result.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {result.price && (
                              <div className="text-right min-w-[60px]">
                                <span className="text-base sm:text-lg font-bold text-purple-600">₹{result.price}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shop Info Section */}
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-b border-purple-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Store size={14} className="text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-purple-900 hover:text-purple-700 transition-colors truncate max-w-[100px] sm:max-w-none">
                                  {result.shopName}
                                </h4>
                                <div className="flex items-center space-x-1 text-xs text-purple-700">
                                  <MapPin size={12} />
                                  <span className="truncate max-w-[80px] sm:max-w-32">{result.shopAddress}</span>
                                  {result.distance && (
                                    <>
                                      <span>•</span>
                                      <span className="font-medium text-green-600">{formatDistance(result.distance)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="p-3 sm:p-4">
                          {result.description && (
                            <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2">
                              {result.description}
                            </p>
                          )}

                          {result.referenceId && (
                            <p className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-1 mb-2 inline-block">
                              {result.referenceId}
                            </p>
                          )}

                          {/* Distance Display */}
                          {result.distance && (
                            <div className="flex items-center space-x-1 text-xs text-green-600 font-medium mb-2">
                              <MapPin size={12} />
                              <span>{formatDistance(result.distance)} away</span>
                            </div>
                          )}

                          {/* Service Info */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                            {result.brand_name && (
                              <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                ⏱️ {result.brand_name}
                              </span>
                            )}
                            {result.variety && (
                              <span className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                                💰 {result.variety}
                              </span>
                            )}
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              ✓ Available
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setComingSoonType('service');
                                setShowComingSoon(true);
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white py-2 px-2 sm:px-3 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all font-medium text-xs sm:text-sm"
                            >
                              <Calendar size={14} />
                              <span>Book</span>
                            </button>
                            <button
                              onClick={() => {
                                if (result.location?.lat && result.location?.lng) {
                                  window.open(`https://maps.google.com/?q=${result.location.lat},${result.location.lng}`, '_blank');
                                } else {
                                  toast.info('Location not available for directions');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-purple-100 text-purple-700 py-2 px-2 sm:px-3 rounded-lg hover:bg-purple-200 transition-all font-medium text-xs sm:text-sm"
                            >
                              <Navigation size={14} />
                              <span>Directions</span>
                            </button>
                          </div>
                        </div>

                        {/* Service Badge Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-purple-500/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                            <Wrench size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Shops Results */}
            {(viewMode === 'all' || viewMode === 'shops') && filteredShops().length > 0 && (
              <div>
                <div className="flex flex-wrap items-center space-x-2 mb-4 sm:mb-6">
                  <Store className="text-green-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Shops</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    {filteredShops().length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredShops().map((shop, index) => (
                    <motion.div
                      key={`shop-${shop.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ShopCard
                        shop={shop}
                        index={index}
                        viewMode="ecommerce"
                        showDistance={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Offices Results */}
            {(viewMode === 'all' || viewMode === 'offices') && filteredOffices().length > 0 && (
              <div>
                <div className="flex flex-wrap items-center space-x-2 mb-4 sm:mb-6">
                  <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm">🏢</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Offices & Public Facilities</h2>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                    {filteredOffices().length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredOffices().map((office, index) => (
                    <motion.div
                      key={`office-${office.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:scale-[1.02]">
                        {/* Office Header */}
                        <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                                🏢
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {office.shopName}
                                </h3>
                                {office.referenceId && (
                                  <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                                    {office.referenceId}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Office
                                  </span>
                                  {office.type && (
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                      {office.type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Office Details */}
                        <div className="p-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                            <MapPin size={14} />
                            <span className="truncate">{office.address}</span>
                          </div>

                          {/* Distance Display */}
                          {office.distance && (
                            <div className="flex items-center space-x-1 text-xs text-green-600 font-medium mb-3">
                              <MapPin size={12} />
                              <span>{formatDistance(office.distance)} away</span>
                            </div>
                          )}

                          {/* Contact Info */}
                          {office.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                              <Phone size={14} />
                              <span>{office.phone}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                if (office.phone) {
                                  window.open(`tel:${office.phone}`, '_self');
                                } else {
                                  toast.info('Contact information not available');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all font-medium text-sm"
                            >
                              <Phone size={14} />
                              <span>Contact</span>
                            </button>
                            <button
                              onClick={() => {
                                if (office.location?.lat && office.location?.lng) {
                                  window.open(`https://maps.google.com/?q=${office.location.lat},${office.location.lng}`, '_blank');
                                } else {
                                  toast.info('Location not available');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                            >
                              <Navigation size={14} />
                              <span>Directions</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        type={comingSoonType}
      />
    </div>
  );
};

export default UnifiedSearchResults; import { distance, animate, delay } from 'framer-motion';
import { FC } from 'react';
import { map } from 'zod';
