import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Clock, 
  Star, 
  MessageCircle, 
  Phone, 
  MapPin,
  Search,
  Filter,
  ShoppingCart
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
import ComingSoonModal from './ComingSoonModal';

interface RestaurantMenuProps {
  shop: Shop;
}

const RestaurantMenu: React.FC<RestaurantMenuProps> = ({ shop }) => {
  const [menuCategories, setMenuCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [localBag, setLocalBag] = useState<Record<string, number>>({});
  const [addingToBag, setAddingToBag] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get shop status
  const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');

  useEffect(() => {
    fetchMenuItems();
  }, [shop.id]);

  const fetchMenuItems = async () => {
    try {
      const categories = await getItemsByCategory(shop.id, 'menu');
      setMenuCategories(categories);
      if (categories.length > 0) {
        setSelectedCategory(categories[0].name);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuCategories
    .find(cat => cat.name === selectedCategory)
    ?.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const handleAddToBag = async (item: Item) => {
    if (!user) {
      toast.error('Please login to add items to bag');
      return;
    }

    setAddingToBag(true);
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
        [item.id || `${shop.id}-${item.name}`]: (prev[item.id || `${shop.id}-${item.name}`] || 0) + 1
      }));
      toast.success(`${item.name} added to bag!`);
    } catch (error) {
      console.error('Error adding to bag:', error);
      toast.error('Failed to add item to bag');
    } finally {
      setAddingToBag(false);
    }
  };

  const getTotalBagItems = () => {
    return Object.values(localBag).reduce((sum, count) => sum + count, 0);
  };

  const getShopTypeIcon = () => {
    switch (shop.type) {
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'hotel':
        return '🏨';
      default:
        return '🍽️';
    }
  };

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      'starters': '🥗',
      'appetizers': '🥗',
      'soup': '🍲',
      'soups': '🍲',
      'main course': '🍛',
      'mains': '🍛',
      'rice': '🍚',
      'biryani': '🍚',
      'bread': '🍞',
      'roti': '🫓',
      'naan': '🫓',
      'desserts': '🧁',
      'sweets': '🍰',
      'beverages': '🥤',
      'drinks': '🥤',
      'tea': '☕',
      'coffee': '☕',
      'juice': '🧃',
      'snacks': '🍿',
      'chinese': '🥢',
      'indian': '🍛',
      'continental': '🍽️',
      'italian': '🍝',
      'pizza': '🍕',
      'burger': '🍔',
      'sandwich': '🥪',
      'salad': '🥗',
      'default': '🍽️'
    };
    
    const key = categoryName.toLowerCase();
    return iconMap[key] || iconMap['default'];
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
      {/* Restaurant Header */}
      <div className="relative">
        <div className="h-64 md:h-80 overflow-hidden">
          <img
            src={shop.imageUrl || "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800"}
            alt={shop.shopName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-3xl">{getShopTypeIcon()}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{shop.shopName}</h1>
              <p className="text-orange-200 capitalize">{shop.type} • {t('restaurant.indianCuisine')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span className={shopStatus.isOpen ? 'text-green-200' : 'text-red-200'}>
                {shopStatus.status}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin size={16} />
              <span>{shop.address}</span>
            </div>
            {shouldDisplay(shop.ratings) && shop.ratings.length > 0 && (
              <div className="flex items-center space-x-1">
                <Star size={16} className="fill-current text-yellow-400" />
                <span>
                  {(shop.ratings.reduce((sum, r) => sum + r, 0) / shop.ratings.length).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Navigation */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-40">
        <div className="px-4 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('restaurant.searchMenu')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {menuCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === category.name
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
        {menuCategories.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('restaurant.menuNotAvailable')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('restaurant.contactForMenu')}
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href={`tel:${shop.phone}`}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Phone size={18} />
                <span>{t('restaurant.call')}</span>
              </a>
              <button
                onClick={() => setShowComingSoon(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={18} />
                <span>Order Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="wait">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDisplayName(item.name, item.hindi_name, i18n.language)}
                        </h3>
                      </div>
                      
                      {shouldDisplay(item.hindi_name) && i18n.language !== 'hi' && (
                        <p className="text-gray-500 text-sm mb-2">{item.hindi_name}</p>
                      )}
                      
                      {shouldDisplay(item.brand_name) && (
                        <p className="text-purple-600 text-sm font-medium mb-2">
                          Brand: {item.brand_name}
                        </p>
                      )}
                      
                      {shouldDisplay(item.description) && (
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {formatPrice(item.price) && (
                          <span className="text-xl font-bold text-orange-600">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToBag(item)}
                    disabled={!shopStatus.isOpen || addingToBag}
                    className={`w-full py-3 px-4 rounded-xl transition-all font-medium flex items-center justify-center space-x-2 ${
                      shopStatus.isOpen && !addingToBag
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    <span>
                      {addingToBag ? 'Adding...' : shopStatus.isOpen ? t('restaurant.addToBag') : 'Closed'}
                    </span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!shopStatus.isOpen && (
          <div className="text-center py-8 bg-red-50 rounded-2xl border border-red-200 mx-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Restaurant Closed</h3>
            <p className="text-red-600">
              This restaurant is currently closed. Hours: {shopStatus.formattedHours}
            </p>
          </div>
        )}

        {filteredItems.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('restaurant.noItemsFound')}
            </h3>
            <p className="text-gray-600">
              {t('restaurant.tryDifferentSearch')}
            </p>
          </div>
        )}
      </div>


      
      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        type="product"
      />
    </div>
  );
};

export default RestaurantMenu;