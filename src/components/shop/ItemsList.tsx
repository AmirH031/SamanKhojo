import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Search,
  Package,
  Tag,
  Sparkles,
  ShoppingCart,
  Heart,
  Star,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  Plus,
  Check,
  Calendar,
  Wrench,
  Utensils
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Item } from '../../types/Item';
import { getDisplayName, shouldDisplay, formatPrice } from '../../utils';
import { addToBag } from '../../services/bagService';
import { useAuth } from '../../contexts/AuthContext';

interface ItemsListProps {
  category: string;
  items: Item[];
  onClose: () => void;
  shopName: string;
  shopId: string;
  shopAddress: string;
  shopPhone: string;
}

// Get shop type from first item or default to product
const getShopTypeFromItems = (items: Item[]): 'product' | 'menu' | 'service' => {
  if (items.length === 0) return 'product';
  const firstItem = items[0];
  return firstItem.type === 'service' ? 'service' : 
         firstItem.type === 'menu' ? 'menu' : 'product';
};

const getActionText = (shopType: 'product' | 'menu' | 'service') => {
  switch (shopType) {
    case 'service': return 'Book Service';
    case 'menu': return 'Add to Order';
    default: return 'Add to Bag';
  }
};

const getActionIcon = (shopType: 'product' | 'menu' | 'service') => {
  switch (shopType) {
    case 'service': return <Calendar size={14} />;
    case 'menu': return <Utensils size={14} />;
    default: return <ShoppingCart size={14} />;
  }
};
const ItemsList: React.FC<ItemsListProps> = ({
  category,
  items,
  onClose,
  shopName,
  shopId,
  shopAddress,
  shopPhone
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'type'>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const shopType = getShopTypeFromItems(items);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = items.filter(item =>
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.hindi_name && item.hindi_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.variety && (
          Array.isArray(item.variety) 
            ? item.variety.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
            : item.variety.toLowerCase().includes(searchQuery.toLowerCase())
        )) ||
        (item.packs && Array.isArray(item.packs) && item.packs.some(pack => pack.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = getDisplayName(a.name, a.hindi_name, i18n.language) || '';
          const nameB = getDisplayName(b.name, b.hindi_name, i18n.language) || '';
          return nameA.localeCompare(nameB);
        case 'price':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA; // Higher price first
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, sortBy, i18n.language]);

  const handleAddToBag = async (item: Item) => {
    if (!user) {
      toast.error('Please login to add items to bag');
      return;
    }

    const itemId = item.id || `${shopId}-${item.name}`;
    
    if (addedItems.has(itemId)) {
      toast.info('Item already added to bag');
      return;
    }

    setLoading(prev => new Set(prev).add(itemId));

    try {
      await addToBag({
        itemId,
        itemName: item.name || 'Unknown Item',
        shopId,
        shopName,
        quantity: 1,
        unit: shopType === 'service' ? 'appointment' : shopType === 'menu' ? 'plate' : 'piece',
        price: item.price
      });

      setAddedItems(prev => new Set(prev).add(itemId));
      toast.success(`${item.name} ${shopType === 'service' ? 'service booked' : 'added to bag'}!`);
    } catch (error) {
      console.error('Error adding to bag:', error);
      toast.error(`Failed to ${shopType === 'service' ? 'book service' : 'add item to bag'}`);
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'grocery': '🛒',
      'kirana': '🏪',
      'food': '🍽️',
      'snacks': '🍿',
      'beverages': '🥤',
      'dairy': '🥛',
      'fruits': '🍎',
      'vegetables': '🥕',
      'spices': '🌶️',
      'oil': '🫒',
      'rice': '🍚',
      'flour': '🌾',
      'sugar': '🧂',
      'tea': '☕',
      'coffee': '☕',
      'biscuits': '🍪',
      'soap': '🧼',
      'shampoo': '🧴',
      'cosmetics': '💄',
      'medicine': '💊',
      'stationery': '📝',
      'toys': '🧸',
      'electronics': '📱',
      'hardware': '🔧',
      'electrical': '💡',
      'mobile accessories': '📱',
      'plastic items': '🥤',
      'frozen items': '🧊',
      'default': '📦'
    };

    const lowerCategory = category.toLowerCase();
    return iconMap[lowerCategory] || iconMap['default'];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
                {getCategoryIcon(category)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize">{category}</h2>
                <p className="text-gray-500 text-sm">{shopName} • {items.length} items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Search and Controls */}
          <div className="px-4 pb-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'type')}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="type">Sort by Type</option>
                </select>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-colors ${showFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Filter size={18} />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid3X3 size={16} />
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {searchQuery ? `${filteredItems.length} of ${items.length} items` : `${items.length} items`}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)] md:max-h-[calc(85vh-280px)]">
          {filteredItems.length > 0 ? (
            <div className={`p-4 ${viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3'
                : 'space-y-3'
              }`}>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer group ${viewMode === 'grid' ? 'p-3' : 'p-4'
                    }`}
                >
                  {viewMode === 'list' ? (
                    // Optimized List View
                    <div className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={20} className="text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {getDisplayName(item.name, item.hindi_name, i18n.language) || 'Unnamed Item'}
                            </h3>

                            {shouldDisplay(item.hindi_name) && i18n.language !== 'hi' && (
                              <p className="text-sm text-gray-500 mb-1">{item.hindi_name}</p>
                            )}
                            
                            {item.brand_name && (
                              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                                {item.brand_name}
                              </span>
                            )}
                          </div>

                          <div className="text-right ml-3">
                            {item.type === 'product' && item.priceRange && Array.isArray(item.priceRange) ? (
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  ₹{item.priceRange[0]} - ₹{item.priceRange[1]}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.packs?.length || 1} sizes
                                </div>
                              </div>
                            ) : item.price ? (
                              <div className="text-lg font-bold text-green-600">
                                {formatPrice(item.price)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.variety && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {Array.isArray(item.variety) ? item.variety.join(', ') : item.variety}
                            </span>
                          )}
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            In Stock
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleAddToBag(item)}
                            disabled={loading.has(item.id || `${shopId}-${item.name}`) || addedItems.has(item.id || `${shopId}-${item.name}`)}
                            className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1 text-sm ${
                              addedItems.has(item.id || `${shopId}-${item.name}`)
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:opacity-50`}
                          >
                            {loading.has(item.id || `${shopId}-${item.name}`) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : addedItems.has(item.id || `${shopId}-${item.name}`) ? (
                              <>
                                <Check size={14} />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                {getActionIcon(shopType)}
                                <span>{getActionText(shopType)}</span>
                              </>
                            )}
                          </button>
                          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <Heart size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Simplified Grid View
                    <div className="text-center">
                      <div className="w-full h-24 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Package size={24} className="text-blue-600" />
                      </div>

                      <h3 className="font-medium text-gray-900 mb-1 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                        {getDisplayName(item.name, item.hindi_name, i18n.language) || 'Unnamed Item'}
                      </h3>

                      {item.brand_name && (
                        <p className="text-xs text-purple-600 mb-2">{item.brand_name.split(',')[0].trim()}</p>
                      )}

                      {item.type === 'product' && item.priceRange && Array.isArray(item.priceRange) ? (
                        <p className="text-green-600 font-bold text-sm mb-2">
                          ₹{item.priceRange[0]} - ₹{item.priceRange[1]}
                        </p>
                      ) : item.price ? (
                        <p className="text-green-600 font-bold text-sm mb-2">
                          {formatPrice(item.price)}
                        </p>
                      ) : null}

                      <button 
                        onClick={() => handleAddToBag(item)}
                        disabled={loading.has(item.id || `${shopId}-${item.name}`) || addedItems.has(item.id || `${shopId}-${item.name}`)}
                        className={`w-full py-2 px-2 rounded-lg transition-colors text-xs ${
                          addedItems.has(item.id || `${shopId}-${item.name}`)
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        {loading.has(item.id || `${shopId}-${item.name}`) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mx-auto"></div>
                        ) : addedItems.has(item.id || `${shopId}-${item.name}`) ? (
                          'Added'
                        ) : (
                          getActionText(shopType)
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-4"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No items found' : 'No items available'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try adjusting your search terms or browse other categories'
                  : 'This category is currently empty. Check back later for new items!'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Sticky Bottom Bar */}
        {filteredItems.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredItems.length}</span> items in {category}
              </div>
              <div className="flex items-center space-x-2">
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  Select All
                </button>
                <button className={`px-6 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                  shopType === 'service' ? 'bg-purple-600 hover:bg-purple-700' :
                  shopType === 'menu' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}>
                  {getActionText(shopType)}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ItemsList;