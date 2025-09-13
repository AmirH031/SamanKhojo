import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Clock, Star, MessageCircle, Phone, MapPin, Search, Filter,
  ShoppingCart, Grid, List, SortAsc, SortDesc, X, Plus, Minus
} from 'lucide-react';
import { Shop } from '../services/firestoreService';
import { getItemsByCategory, ItemCategory } from '../services/itemService';
import { Item } from '../types/Item';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addToBag } from '../services/bagService';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayName, shouldDisplay, formatPrice, formatTime, getShopStatus } from '../utils';

interface EnhancedRestaurantMenuProps {
  shop: Shop;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'price' | 'category';
type SortDirection = 'asc' | 'desc';

const EnhancedRestaurantMenu: React.FC<EnhancedRestaurantMenuProps> = ({ shop }) => {
  const [menuCategories, setMenuCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [localBag, setLocalBag] = useState<Record<string, number>>({});
  const [itemLoading, setItemLoading] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');

  useEffect(() => {
    fetchMenuItems();
  }, [shop.id]);

  const fetchMenuItems = async () => {
    try {
      const categories = await getItemsByCategory(shop.id, 'menu');
      setMenuCategories(categories);

      // Calculate price range
      const allItems = categories.flatMap(cat => cat.items);
      const prices = allItems.map(item => item.price || 0).filter(p => p > 0);
      if (prices.length > 0) {
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let allItems = menuCategories.flatMap(cat => cat.items);

    // Filter by category
    if (selectedCategory !== 'all') {
      allItems = allItems.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allItems = allItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.hindi_name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    allItems = allItems.filter(item => {
      const price = item.price || 0;
      return price === 0 || (price >= priceRange[0] && price <= priceRange[1]);
    });

    // Sort items
    allItems.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return allItems;
  }, [menuCategories, selectedCategory, searchQuery, priceRange, sortBy, sortDirection]);

  const handleAddToBag = async (item: Item) => {
    if (!user) {
      toast.error('Please login to add items to bag');
      return;
    }

    setItemLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await addToBag({
        itemId: item.id || `${shop.id}-${item.name}`,
        itemName: item.name,
        shopId: shop.id,
        shopName: shop.shopName,
        quantity: 1,
        unit: item.unit || 'piece',
        price: item.price
      });
      
      // Add to local state for UI feedback
      setLocalBag(prev => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + 1
      }));
      toast.success(`${item.name} added to bag!`);
    } catch (error) {
      console.error('Error adding to bag:', error);
      toast.error('Failed to add item to bag');
    } finally {
      setItemLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRemoveFromBag = async (itemId: string) => {
    if (!user) return;

    setItemLoading(prev => ({ ...prev, [itemId]: true }));
    try {
      // For now, we'll just update local state since the bag service doesn't have a remove function
      // In a real app, you'd call a removeFromBag API
      setLocalBag(prev => {
        const newBag = { ...prev };
        if (newBag[itemId] > 1) {
          newBag[itemId]--;
        } else {
          delete newBag[itemId];
        }
        return newBag;
      });
      toast.success('Item removed from bag');
    } catch (error) {
      console.error('Error removing from bag:', error);
      toast.error('Failed to remove item from bag');
    } finally {
      setItemLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const getTotalBagItems = () => {
    return Object.values(localBag).reduce((sum, count) => sum + count, 0);
  };

  // WhatsApp inquiry function removed - now using bag navigation

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      'starters': '🥗', 'appetizers': '🥗', 'soup': '🍲', 'soups': '🍲',
      'main course': '🍛', 'mains': '🍛', 'rice': '🍚', 'biryani': '🍚',
      'bread': '🍞', 'roti': '🫓', 'naan': '🫓', 'desserts': '🧁',
      'sweets': '🍰', 'beverages': '🥤', 'drinks': '🥤', 'tea': '☕',
      'coffee': '☕', 'juice': '🧃', 'snacks': '🍿', 'chinese': '🥢',
      'indian': '🍛', 'continental': '🍽️', 'italian': '🍝', 'pizza': '🍕',
      'burger': '🍔', 'sandwich': '🥪', 'salad': '🥗', 'default': '🍽️'
    };
    return iconMap[categoryName.toLowerCase()] || iconMap['default'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Restaurant Header - Compact */}
      <div className="bg-white shadow-lg">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
              {shop.shopName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{shop.shopName}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className={shopStatus.isOpen ? 'text-green-600' : 'text-red-600'}>
                  {shopStatus.status}
                </span>
                <span className="flex items-center"><MapPin size={14} className="mr-1" />{shop.address}</span>
                {shouldDisplay(shop.ratings) && shop.ratings.length > 0 && (
                  <span className="flex items-center">
                    <Star size={14} className="mr-1 fill-current text-yellow-400" />
                    {(shop.ratings.reduce((sum, r) => sum + r, 0) / shop.ratings.length).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="px-4 py-4 space-y-4">
          {/* Search and View Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl transition-colors ${showFilters ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Filter size={20} />
            </button>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-50 rounded-xl p-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Categories ({menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)})</option>
                      {menuCategories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name} ({category.items.length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <div className="flex space-x-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="category">Category</option>
                      </select>
                      <button
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {sortDirection === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600">
                      Showing {filteredAndSortedItems.length} of {menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)} items
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Quick Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span>All</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)}
              </span>
            </button>
            {menuCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${selectedCategory === category.name
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <span className="text-lg">{getCategoryIcon(category.name)}</span>
                <span className="font-medium">{category.name}</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {category.items.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            <AnimatePresence>
              {filteredAndSortedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                    }`}
                >
                  <div className={viewMode === 'list' ? 'flex-1 flex items-center space-x-4' : ''}>
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDisplayName(item.name, item.hindi_name, i18n.language)}
                        </h3>
                      </div>

                      {shouldDisplay(item.hindi_name) && i18n.language !== 'hi' && (
                        <p className="text-gray-500 text-sm mb-2">{item.hindi_name}</p>
                      )}

                      {shouldDisplay(item.description) && (
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        {formatPrice(item.price) && (
                          <span className="text-xl font-bold text-orange-600">
                            {formatPrice(item.price)}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bag Controls */}
                    <div className={viewMode === 'list' ? 'flex items-center space-x-2' : 'flex items-center justify-between'}>
                      {localBag[item.id] ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRemoveFromBag(item.id)}
                            disabled={itemLoading[item.id]}
                            className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                            {localBag[item.id]}
                          </span>
                          <button
                            onClick={() => handleAddToBag(item)}
                            disabled={!shopStatus.isOpen || itemLoading[item.id]}
                            className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToBag(item)}
                          disabled={!shopStatus.isOpen || itemLoading[item.id]}
                          className={`px-4 py-2 rounded-xl transition-all font-medium flex items-center space-x-2 ${shopStatus.isOpen && !itemLoading[item.id]
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          <ShoppingCart size={16} />
                          <span>
                            {itemLoading[item.id] ? 'Adding...' : shopStatus.isOpen ? 'Add to Bag' : 'Closed'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Bag Button */}
      {getTotalBagItems() > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => navigate('/bag')}
            className="flex items-center space-x-3 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl hover:bg-green-600 transition-all"
          >
            <MessageCircle size={24} />
            <div>
              <div className="font-semibold">View Bag</div>
              <div className="text-sm opacity-90">
                {getTotalBagItems()} items in bag
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedRestaurantMenu;