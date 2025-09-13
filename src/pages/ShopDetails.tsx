import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Star, 
  MessageCircle, 
  ExternalLink, 
  Search,
  Filter,
  Package,
  Clock,
  Users,
  Heart,
  Share2,
  ShoppingCart,
  Zap,
  CheckCircle,
  TrendingUp,
  Award,
  Shield,
  Truck
} from 'lucide-react';
import { toast } from 'react-toastify';
import RestaurantMenu from '../components/RestaurantMenu';
import ReviewsList from '../components/ReviewsList';
import ShopRatingForm from '../components/ShopRatingForm';
import { getOptimizedShopDetails } from '../services/optimizedSearchService';
import { Shop, Item } from '../types';
import CategoryCard from '../components/shop/CategoryCard';
import ItemsList from '../components/shop/ItemsList';
import SearchAndFilter from '../components/shop/SearchAndFilter';
import ServicePoster from '../components/ServicePoster';
import { formatTime, getShopStatus } from '../utils';

interface GroupedItems {
  [category: string]: Item[];
}

interface CategoryInfo {
  name: string;
  items: Item[];
  icon: string;
  count: number;
}

const ShopDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [shop, setShop] = useState<Shop | null>(null);
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filteredCategories, setFilteredCategories] = useState<CategoryInfo[]>([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'reviews'>('items');

  // Category icons mapping
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

  // Fetch shop and items data using optimized service
  useEffect(() => {
    const fetchShopData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Use optimized backend service
        const { shop: shopData, groupedItems: grouped, categories: categoriesData } = await getOptimizedShopDetails(id);
        
        if (!shopData) {
          toast.error('Shop not found');
          navigate('/shops');
          return;
        }
        
        setShop(shopData);
        setGroupedItems(grouped);

        // Create categories info with icons
        const categoriesInfo: CategoryInfo[] = categoriesData.map(category => ({
          name: category.name,
          items: category.items,
          icon: getCategoryIcon(category.name),
          count: category.count
        }));

        setCategories(categoriesInfo);
        setFilteredCategories(categoriesInfo);

      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast.error('Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [id, navigate]);

  // Filter and search logic
  useEffect(() => {
    let filtered = categories;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = categories.filter(category => {
        const categoryMatch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
        const itemMatch = category.items.some(item => 
          (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.variety && item.variety.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        return categoryMatch || itemMatch;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'count':
          return b.count - a.count;
        case 'az':
          return a.name.localeCompare(b.name);
        case 'za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredCategories(filtered);
  }, [searchQuery, sortBy, categories]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const generateWhatsAppLink = () => {
    if (!shop || !shop.phone) return '#';
    const message = `Hi, I found your shop on SamanKhojo. I'm interested in your products.

📍 Address: ${shop.address}
📞 Phone: ${shop.phone}

- From SamanKhojo`;
    const cleanPhone = shop.phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Shop Details</h2>
            <p className="text-gray-600">Please wait while we fetch the shop information...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h2>
          <button
            onClick={() => navigate('/shops')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Shops
          </button>
        </div>
      </div>
    );
  }

  // Check if this is a service shop with service details - show poster instead
  if (shop.shopType === 'service' && shop.serviceDetails && shop.serviceDetails.length > 0) {
    return <ServicePoster shop={shop} />;
  }

  // Check if this is a restaurant/cafe/hotel and render special menu UI
  if (['restaurant', 'cafe', 'hotel'].includes(shop.type || '')) {
    return <RestaurantMenu shop={shop} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-safe-area">
      {/* Header with Navigation */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/shops')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900 truncate max-w-48">{shop.shopName}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {shop.averageRating && (
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="fill-current text-yellow-500" />
                    <span>{shop.averageRating}</span>
                  </div>
                )}
                <span>•</span>
                <span className="capitalize">{shop.type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="relative">
          {/* Shop Image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
            {shop.imageUrl ? (
              <img
                src={shop.imageUrl}
                alt={shop.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Package size={48} className="mx-auto mb-2 opacity-80" />
                  <p className="text-lg font-medium">{shop.shopName}</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                shop.isOpen 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {shop.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>

            {/* Featured Badge */}
            {shop.isFeatured && (
              <div className="absolute top-4 left-4">
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Award size={14} />
                  <span>Featured</span>
                </div>
              </div>
            )}
          </div>

          {/* Shop Info Card */}
          <div className="px-4 py-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 -mt-8 relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{shop.shopName}</h2>
                  <p className="text-gray-600 text-sm mb-2">{shop.ownerName && `By ${shop.ownerName}`}</p>
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center space-x-4 mb-3">
                    {shop.averageRating && (
                      <div className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded">
                        <Star size={12} className="fill-current" />
                        <span className="text-sm font-medium">{shop.averageRating}</span>
                      </div>
                    )}
                    {shop.totalReviews && (
                      <span className="text-sm text-gray-600">{shop.totalReviews} reviews</span>
                    )}
                    {shop.isVerified && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <CheckCircle size={14} />
                        <span className="text-sm">Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-2 text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{shop.address}</p>
                  </div>

                  {/* Timing */}
                  {shop.openingTime && shop.closingTime && (
                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <Clock size={16} />
                      <span className="text-sm">
                        {shop.openingTime} - {shop.closingTime}
                      </span>
                    </div>
                  )}

                  {/* Shop Type */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      shop.shopType === 'product' ? 'bg-blue-100 text-blue-800' :
                      shop.shopType === 'menu' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {shop.shopType === 'product' ? '🛍️ Product Store' : 
                       shop.shopType === 'menu' ? '🍽️ Restaurant/Menu' : '🔧 Service Provider'}
                    </span>
                  </div>

                  {/* Service Details - Only for Service Type Shops */}
                  {shop.shopType === 'service' && shop.serviceDetails && shop.serviceDetails.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                      <h4 className="flex items-center space-x-2 text-sm font-semibold text-purple-800 mb-2">
                        <span>🔧</span>
                        <span>Our Services</span>
                      </h4>
                      <ul className="space-y-1">
                        {shop.serviceDetails.map((detail, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-purple-700">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={18} />
                  <span>Contact</span>
                </a>
                <button className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Zap size={18} />
                  <span>Quick Order</span>
                </button>
                <a
                  href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ExternalLink size={18} className="text-gray-600" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <Shield size={20} className="text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-700 font-medium">Safe & Secure</p>
            </div>
           
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
              <TrendingUp size={20} className="text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-orange-700 font-medium">Best Prices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-4 px-4 font-medium text-center border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Package size={18} />
              <span>Products ({categories.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-4 px-4 font-medium text-center border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Star size={18} />
              <span>Reviews</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24 md:pb-20">
        {activeTab === 'items' ? (
          <div>
            {/* Search and Filter */}
            <div className="bg-white border-b px-4 py-3">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalCategories={categories.length}
                filteredCount={filteredCategories.length}
              />
            </div>

            {/* Categories Grid */}
            <div className="px-4 py-4">
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleCategoryClick(category.name)}
                      className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-2xl">{category.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                            <p className="text-xs text-gray-500">{category.count} items</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 font-medium">View All</span>
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <ArrowLeft size={12} className="text-blue-600 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white rounded-xl p-8 shadow-sm border">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? 'Try adjusting your search terms' : 'This shop has no items yet'}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white">
            <ReviewsList 
              shopId={shop.id} 
              onAddReview={() => setShowRatingForm(true)}
            />
          </div>
        )}
      </div>

      {/* Items List Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <ItemsList
            category={selectedCategory}
            items={groupedItems[selectedCategory] || []}
            onClose={() => setSelectedCategory(null)}
            shopName={shop.shopName}
            shopId={shop.id}
            shopAddress={shop.address}
            shopPhone={shop.phone}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 md:bottom-20 right-6 flex flex-col space-y-3 z-50">
        {/* View Bag Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/bag')}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all group"
          title="View Bag"
        >
          <ShoppingCart size={24} />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            View Bag
          </span>
        </motion.button>

        {/* Rate Shop Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowRatingForm(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all group"
          title="Rate this Shop"
        >
          <Star size={24} />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Rate Shop
          </span>
        </motion.button>
      </div>
      
      {/* Shop Rating Form Modal */}
      <ShopRatingForm
        shopId={shop.id}
        shopName={shop.shopName}
        isOpen={showRatingForm}
        onClose={() => setShowRatingForm(false)}
        onSuccess={() => {
          setShowRatingForm(false);
          if (activeTab === 'reviews') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};

export default ShopDetails;
