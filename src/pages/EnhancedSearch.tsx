import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  Star,
  SlidersHorizontal
} from 'lucide-react';
import { Shop } from '../services/firestoreService';
import { performUnifiedSearch } from '../services/unifiedSearchService';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getDisplayName, shouldDisplay, getShopStatus } from '../utils';

interface FilterOptions {
  type: string[];
  rating: number;
  distance: number;
  isOpen: boolean;
}

const EnhancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: [],
    rating: 0,
    distance: 50,
    isOpen: false
  });

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const shopTypes = [
    { key: 'restaurant', label: t('search.restaurant'), icon: '🍽️' },
    { key: 'cafe', label: t('search.cafe'), icon: '☕' },
    { key: 'hotel', label: t('search.hotel'), icon: '🏨' }
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setShops([]);
      setFilteredShops([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [shops, filters]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await performUnifiedSearch({
        query: searchQuery,
        type: 'shops',
        limit: 50
      });
      setShops(results.shops);
    } catch (error) {
      console.error('Search error:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shops];

    // Filter by type
    if (filters.type.length > 0) {
      filtered = filtered.filter(shop => filters.type.includes(shop.type));
    }

    // Filter by rating
    if (filters.rating > 0) {
      filtered = filtered.filter(shop => {
        if (!shop.ratings || shop.ratings.length === 0) return false;
        const avgRating = shop.ratings.reduce((sum: any, r: any) => sum + r, 0) / shop.ratings.length;
        return avgRating >= filters.rating;
      });
    }

    // Filter by open status
    if (filters.isOpen) {
      filtered = filtered.filter(shop => {
        const status = getShopStatus(shop.openingTime || '', shop.closingTime || '');
        return status.isOpen;
      });
    }

    setFilteredShops(filtered);
  };

  const toggleFilter = (type: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type as keyof FilterOptions].includes(value)
        ? (prev[type as keyof FilterOptions] as string[]).filter(item => item !== value)
        : [...(prev[type as keyof FilterOptions] as string[]), value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      rating: 0,
      distance: 50,
      isOpen: false
    });
  };

  const getShopTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'hotel': return '🏨';
      default: return '🏪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {t('search.title')}
          </h1>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal size={18} />
              <span>{t('search.filters')}</span>
            </button>

            {(filters.type.length > 0 || filters.rating > 0 || filters.isOpen) && (
              <button
                onClick={clearFilters}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                {t('search.clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Shop Type Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('search.shopType')}</h3>
                  <div className="space-y-2">
                    {shopTypes.map(type => (
                      <label key={type.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.type.includes(type.key)}
                          onChange={() => toggleFilter('type', type.key)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('search.minimumRating')}</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map(rating => (
                      <label key={rating} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.rating === rating}
                          onChange={() => setFilters(prev => ({ ...prev, rating }))}
                          className="border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex items-center space-x-1">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} size={16} className="fill-current text-yellow-400" />
                          ))}
                          <span className="text-gray-700">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('search.availability')}</h3>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.isOpen}
                      onChange={(e) => setFilters(prev => ({ ...prev, isOpen: e.target.checked }))}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">{t('search.openNow')}</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}

        {!loading && searchQuery && filteredShops.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('search.noResults')}
            </h3>
            <p className="text-gray-600">
              {t('search.tryDifferentKeywords')}
            </p>
          </div>
        )}

        {!loading && filteredShops.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredShops.length} {t('search.resultsFound')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop, index) => {
                const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');

                return (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/shop/${shop.id}`)}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="relative h-48">
                      <img
                        src={shop.imageUrl || "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400"}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="text-2xl">{getShopTypeIcon(shop.type)}</span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${shopStatus.isOpen
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {shopStatus.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {getDisplayName(shop.shopName, shop.hindi_name, i18n.language)}
                      </h3>

                      {shouldDisplay(shop.hindi_name) && i18n.language !== 'hi' && (
                        <p className="text-gray-500 text-sm mb-2">{shop.hindi_name}</p>
                      )}

                      <div className="flex items-center space-x-2 text-gray-600 text-sm mb-2">
                        <MapPin size={14} />
                        <span className="truncate">{shop.address}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-gray-600 text-sm mb-3">
                        <Clock size={14} />
                        <span>{shopStatus.formattedHours}</span>
                      </div>

                      {shouldDisplay(shop.ratings) && shop.ratings.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star size={16} className="fill-current text-yellow-400" />
                            <span className="font-medium">
                              {(shop.ratings.reduce((sum: any, r: any) => sum + r, 0) / shop.ratings.length).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-500 text-sm">
                            ({shop.ratings.length} {t('search.reviews')})
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSearch;