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
  Truck,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import RestaurantMenu from '../components/RestaurantMenu';
import ReviewsList from '../components/ReviewsList';
import ShopRatingForm from '../components/ShopRatingForm';
import { api } from '../services/api';
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
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
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
        // Use backend API service
        const shopData = await api.get(`/shops/${id}`);
        
        if (!shopData.shop) {
          toast.error('Shop not found');
          navigate('/shops');
          return;
        }
        
        setShop(shopData.shop);
        setGroupedItems(shopData.groupedItems || {});

        // Create categories info with icons
        const categoriesInfo: CategoryInfo[] = (shopData.categories || []).map((category: any) => ({
          name: category.name,
          items: category.items,
          icon: getCategoryIcon(category.name),
          count: category.count
        }));

        setCategories(categoriesInfo);

        // Flatten all items from all categories
        const allItemsFlat = categoriesInfo.reduce((acc: Item[], category) => {
          return [...acc, ...category.items];
        }, []);
        
        setAllItems(allItemsFlat);
        setFilteredItems(allItemsFlat);

      } catch (error) {
        console.error('Error fetching shop data:', error);
        toast.error('Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [id, navigate]);

  // Filter and search logic for items
  useEffect(() => {
    let filtered = allItems;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = allItems.filter(item => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.hindi_name && item.hindi_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand_name && item.brand_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
          return (a.name || '').localeCompare(b.name || '');
        case 'price':
          return (b.price || 0) - (a.price || 0);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  }, [searchQuery, sortBy, selectedCategory, allItems]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
  };

  const handleContact = () => {
    if (!shop || !shop.phone) return;
    const message = `Hi, I found your shop on SamanKhojo. I'm interested in your products.

📍 Address: ${shop.address}
📞 Phone: ${shop.phone}

- From SamanKhojo`;
    const cleanPhone = shop.phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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

  // Check if this is a service shop - show service details instead
  if (shop.shopType === 'service') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 mobile-safe-area">
        {/* Enhanced Header with Navigation */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b border-purple-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/shops')}
                className="p-2 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} className="text-purple-700" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 truncate max-w-48 text-lg">{shop.shopName}</h1>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <span>🔧</span>
                    <span>Service Provider</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-105">
                <Share2 size={20} className="text-purple-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Hero Section */}
        <div className="relative">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-white/10" style={{
                backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 2px)`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>
          </div>
          
          {/* Service Image with Enhanced Styling */}
          <div className="h-40 relative overflow-hidden">
            {shop.imageUrl ? (
              <img
                src={shop.imageUrl}
                alt={shop.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center text-white"
                >
                  <div className="text-6xl mb-3 animate-pulse">🔧</div>
                  <p className="text-lg font-semibold drop-shadow-lg">{shop.shopName}</p>
                </motion.div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Status Badge with Animation */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 right-4"
            >
              <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${
                shop.openingTime && shop.closingTime
                  ? getShopStatus(shop.openingTime, shop.closingTime).isOpen
                    ? 'bg-green-500/90 text-white border border-green-400' 
                    : 'bg-red-500/90 text-white border border-red-400'
                  : 'bg-gray-500/90 text-white border border-gray-400'
              }`}>
                {shop.openingTime && shop.closingTime
                  ? getShopStatus(shop.openingTime, shop.closingTime).status
                  : 'Hours Not Available'
                }
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content with Enhanced Design */}
        <div className="px-4 py-6">
          <div className="flex gap-6">
            {/* Main Service Details - Enhanced Left Side */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 -mt-8 relative z-10">
                {/* Service Header with Enhanced Typography */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{shop.shopName}</h2>
                  {shop.ownerName && (
                    <p className="text-purple-600 font-medium mb-3">By {shop.ownerName}</p>
                  )}
                  
                  {/* Enhanced Service Type Badge */}
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                  >
                    <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200 px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                      🔧 Service Provider
                    </span>
                  </motion.div>

                  {/* Enhanced Info Cards */}
                  <div className="space-y-4">
                    {/* Address Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-start space-x-3">
                        <div className="bg-purple-500 p-2 rounded-lg">
                          <MapPin size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-purple-800 mb-1">Location</p>
                          <p className="text-sm text-gray-700 font-medium">{shop.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Service Hours Card */}
                    {shop.openingTime && shop.closingTime && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <Clock size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-800 mb-1">Service Hours</p>
                            <p className="text-sm text-gray-700 font-medium">
                              {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Card */}
                    {shop.phone && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <Phone size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800 mb-1">Contact</p>
                            <p className="text-sm text-gray-700 font-medium">{shop.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification Badge */}
                    {shop.isVerified && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <CheckCircle size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Verified Business</p>
                            <p className="text-xs text-green-600">Trusted service provider</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Service Details Section */}
                {shop.serviceDetails && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl p-5 mb-6 shadow-sm"
                  >
                    <h4 className="flex items-center space-x-2 text-lg font-bold text-purple-800 mb-4">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <span className="text-white text-sm">✨</span>
                      </div>
                      <span>Our Services</span>
                    </h4>

                    {/* Service Name */}
                    {shop.serviceDetails.serviceName && (
                      <div className="mb-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{shop.serviceDetails.serviceName}</h5>
                      </div>
                    )}

                    {/* Service Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {shop.serviceDetails.priceRange && (
                        <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-700 mb-1">Price Range</p>
                          <p className="text-sm font-medium text-gray-800">{shop.serviceDetails.priceRange}</p>
                        </div>
                      )}
                      {shop.serviceDetails.duration && (
                        <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
                          <p className="text-xs font-semibold text-purple-700 mb-1">Duration</p>
                          <p className="text-sm font-medium text-gray-800">{shop.serviceDetails.duration}</p>
                        </div>
                      )}
                    </div>

                    {/* Service Descriptions */}
                    {shop.serviceDetails.description && shop.serviceDetails.description.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-sm font-semibold text-purple-800 mb-2">Service Details</h6>
                        <div className="space-y-2">
                          {shop.serviceDetails.description.map((desc, index) => (
                            <motion.div 
                              key={index}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex items-start space-x-3 bg-white/60 rounded-lg p-3 border border-purple-100"
                            >
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                              <span className="text-sm text-gray-700">{desc}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Features */}
                    {shop.serviceDetails.features && shop.serviceDetails.features.length > 0 && (
                      <div>
                        <h6 className="text-sm font-semibold text-purple-800 mb-2">Key Features</h6>
                        <div className="grid grid-cols-1 gap-2">
                          {shop.serviceDetails.features.map((feature, index) => (
                            <motion.div 
                              key={index}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                              className="flex items-center space-x-3 bg-white/60 rounded-lg p-3 border border-purple-100"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700">{feature}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Enhanced Action Buttons */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 gap-4 mb-6"
                >
                  <button
                    onClick={handleContact}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <MessageCircle size={20} />
                    <span>Contact</span>
                  </button>
                  <a
                    href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <MapPin size={20} />
                    <span>Directions</span>
                  </a>
                </motion.div>

                {/* Enhanced Trust Indicators */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="bg-purple-500 p-3 rounded-full w-fit mx-auto mb-2">
                      <Shield size={20} className="text-white" />
                    </div>
                    <p className="text-sm text-purple-700 font-semibold">Trusted Service</p>
                    <p className="text-xs text-purple-600 mt-1">Quality Guaranteed</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-2">
                      <Award size={20} className="text-white" />
                    </div>
                    <p className="text-sm text-blue-700 font-semibold">Professional</p>
                    <p className="text-xs text-blue-600 mt-1">Expert Service</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Reviews Section - Right Side */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-80 hidden md:block"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4 -mt-8 relative z-10">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <div className="bg-yellow-500 p-1.5 rounded-lg">
                    <Star size={12} className="text-white" />
                  </div>
                  <span>Reviews</span>
                </h4>
                <div className="text-center py-6">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-full w-fit mx-auto mb-3">
                    <MessageCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-medium">No Reviews Yet</p>
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Write Review
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Mobile Reviews Section */}
        <div className="bg-white/80 backdrop-blur-md mt-6 mx-4 rounded-2xl shadow-lg border border-white/50 md:hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <div className="bg-yellow-500 p-1.5 rounded-lg">
                <Star size={12} className="text-white" />
              </div>
              <span>Reviews & Feedback</span>
            </h4>
          </div>
          <div className="px-4 py-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-full w-fit mx-auto mb-3">
                <MessageCircle size={20} className="text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mb-3 font-medium">No Reviews Yet</p>
              <button
                onClick={() => setShowRatingForm(true)}
                className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-md"
              >
                Write First Review
              </button>
            </div>
          </div>
        </div>

        {/* Shop Rating Form Modal */}
        <ShopRatingForm
          shopId={shop.id}
          shopName={shop.shopName}
          isOpen={showRatingForm}
          onClose={() => setShowRatingForm(false)}
          onSuccess={() => {
            setShowRatingForm(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Check if this is an office/public facility - show office details instead
  if (shop.shopType === 'office') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 mobile-safe-area">
        {/* Enhanced Header with Navigation */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b border-emerald-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/shops')}
                className="p-2 hover:bg-emerald-50 rounded-full transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft size={20} className="text-emerald-700" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 truncate max-w-48 text-lg">{shop.shopName}</h1>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <span>🏛️</span>
                    <span>Public Facility</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-emerald-50 rounded-full transition-all duration-200 hover:scale-105">
                <Share2 size={20} className="text-emerald-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Hero Section */}
        <div className="relative">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-white/10" style={{
                backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 2px)`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>
          </div>
          
          {/* Office Image with Enhanced Styling */}
          <div className="h-40 relative overflow-hidden">
            {shop.imageUrl ? (
              <img
                src={shop.imageUrl}
                alt={shop.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center text-white"
                >
                  <div className="text-6xl mb-3 animate-pulse">🏛️</div>
                  <p className="text-lg font-semibold drop-shadow-lg">{shop.shopName}</p>
                </motion.div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Status Badge with Animation */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-4 right-4"
            >
              <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${
                shop.officeDetails?.openTime && shop.officeDetails?.closeTime
                  ? getShopStatus(shop.officeDetails.openTime, shop.officeDetails.closeTime).isOpen
                    ? 'bg-green-500/90 text-white border border-green-400' 
                    : 'bg-red-500/90 text-white border border-red-400'
                  : 'bg-gray-500/90 text-white border border-gray-400'
              }`}>
                {shop.officeDetails?.openTime && shop.officeDetails?.closeTime
                  ? getShopStatus(shop.officeDetails.openTime, shop.officeDetails.closeTime).status
                  : 'Hours Not Available'
                }
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content with Enhanced Design */}
        <div className="px-4 py-6">
          <div className="flex gap-6">
            {/* Main Office Details - Enhanced Left Side */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 -mt-8 relative z-10">
                {/* Office Header with Enhanced Typography */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{shop.shopName}</h2>
                  
                  {/* Enhanced Facility Type Badge */}
                  {shop.officeDetails?.facilityType && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4"
                    >
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                        shop.officeDetails.facilityType === 'government_office' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                        shop.officeDetails.facilityType === 'bank' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200' :
                        shop.officeDetails.facilityType === 'hospital' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200' :
                        shop.officeDetails.facilityType === 'school' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200' :
                        'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {shop.officeDetails.facilityType === 'government_office' && '🏛️ Government Office'}
                        {shop.officeDetails.facilityType === 'private_office' && '🏢 Private Office'}
                        {shop.officeDetails.facilityType === 'bank' && '🏦 Bank'}
                        {shop.officeDetails.facilityType === 'atm' && '🏧 ATM'}
                        {shop.officeDetails.facilityType === 'hospital' && '🏥 Hospital/Clinic'}
                        {shop.officeDetails.facilityType === 'school' && '🏫 School/Educational'}
                        {shop.officeDetails.facilityType === 'public_toilet' && '🚻 Public Toilet'}
                        {shop.officeDetails.facilityType === 'public_garden' && '🌳 Public Garden'}
                        {shop.officeDetails.facilityType === 'telecom_office' && '📞 Telecom Office'}
                        {shop.officeDetails.facilityType === 'other' && '🏢 Other Facility'}
                      </span>
                    </motion.div>
                  )}

                  {/* Enhanced Info Cards */}
                  <div className="space-y-4">
                    {/* Address Card */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-start space-x-3">
                        <div className="bg-emerald-500 p-2 rounded-lg">
                          <MapPin size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-800 mb-1">Location</p>
                          <p className="text-sm text-gray-700 font-medium">{shop.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Office Hours Card */}
                    {shop.officeDetails?.openTime && shop.officeDetails?.closeTime && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-500 p-2 rounded-lg">
                            <Clock size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-800 mb-1">Office Hours</p>
                            <p className="text-sm text-gray-700 font-medium">
                              {formatTime(shop.officeDetails.openTime)} - {formatTime(shop.officeDetails.closeTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Working Days Card */}
                    {shop.officeDetails?.workingDays && shop.officeDetails.workingDays.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-start space-x-3">
                          <div className="bg-purple-500 p-2 rounded-lg">
                            <Calendar size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-800 mb-2">Working Days</p>
                            <div className="flex flex-wrap gap-2">
                              {shop.officeDetails.workingDays.map((day, index) => (
                                <span key={index} className="bg-white/70 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-200">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification Badge */}
                    {shop.isVerified && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500 p-2 rounded-lg">
                            <CheckCircle size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Verified Facility</p>
                            <p className="text-xs text-green-600">Officially recognized and verified</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Services Section */}
                {shop.officeDetails?.services && shop.officeDetails.services.length > 0 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-sm"
                  >
                    <h4 className="flex items-center space-x-2 text-lg font-bold text-emerald-800 mb-4">
                      <div className="bg-emerald-500 p-2 rounded-lg">
                        <span className="text-white text-sm">📋</span>
                      </div>
                      <span>Services Offered</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {shop.officeDetails.services.map((service, index) => (
                        <motion.div 
                          key={index}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center space-x-3 bg-white/60 rounded-lg p-3 border border-emerald-100"
                        >
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">{service}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Facilities Section */}
                {shop.officeDetails?.facilities && shop.officeDetails.facilities.length > 0 && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm"
                  >
                    <h4 className="flex items-center space-x-2 text-lg font-bold text-blue-800 mb-4">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <span className="text-white text-sm">🏢</span>
                      </div>
                      <span>Available Facilities</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {shop.officeDetails.facilities.map((facility, index) => (
                        <motion.div 
                          key={index}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center space-x-3 bg-white/60 rounded-lg p-3 border border-blue-100"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">{facility}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Action Button */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                >
                  <a
                    href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <MapPin size={20} />
                    <span>Get Directions</span>
                  </a>
                </motion.div>

                {/* Enhanced Trust Indicators */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="bg-emerald-500 p-3 rounded-full w-fit mx-auto mb-2">
                      <Shield size={20} className="text-white" />
                    </div>
                    <p className="text-sm text-emerald-700 font-semibold">Official Facility</p>
                    <p className="text-xs text-emerald-600 mt-1">Government Recognized</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 rounded-xl p-4 text-center shadow-sm">
                    <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-2">
                      <Clock size={20} className="text-white" />
                    </div>
                    <p className="text-sm text-blue-700 font-semibold">Regular Hours</p>
                    <p className="text-xs text-blue-600 mt-1">Consistent Schedule</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Reviews Section - Right Side */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-80 hidden md:block"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4 -mt-8 relative z-10">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <div className="bg-yellow-500 p-1.5 rounded-lg">
                    <Star size={12} className="text-white" />
                  </div>
                  <span>Reviews</span>
                </h4>
                <div className="text-center py-6">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-full w-fit mx-auto mb-3">
                    <MessageCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mb-3 font-medium">No Reviews Yet</p>
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Write Review
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Mobile Reviews Section */}
        <div className="bg-white/80 backdrop-blur-md mt-6 mx-4 rounded-2xl shadow-lg border border-white/50 md:hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <div className="bg-yellow-500 p-1.5 rounded-lg">
                <Star size={12} className="text-white" />
              </div>
              <span>Reviews & Feedback</span>
            </h4>
          </div>
          <div className="px-4 py-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-full w-fit mx-auto mb-3">
                <MessageCircle size={20} className="text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mb-3 font-medium">No Reviews Yet</p>
              <button
                onClick={() => setShowRatingForm(true)}
                className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-md"
              >
                Write First Review
              </button>
            </div>
          </div>
        </div>

        {/* Shop Rating Form Modal */}
        <ShopRatingForm
          shopId={shop.id}
          shopName={shop.shopName}
          isOpen={showRatingForm}
          onClose={() => setShowRatingForm(false)}
          onSuccess={() => {
            setShowRatingForm(false);
            window.location.reload();
          }}
        />
      </div>
    );
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
                <button
                  onClick={handleContact}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={18} />
                  <span>Contact</span>
                </button>
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
              <span>Products ({allItems.length})</span>
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
              <div className="space-y-3">
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

                {/* Filters */}
                <div className="flex items-center justify-between">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories ({allItems.length})</option>
                    {categories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {category.name} ({category.count})
                      </option>
                    ))}
                  </select>

                  {/* Sort Filter */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price">Sort by Price</option>
                    <option value="category">Sort by Category</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {searchQuery || selectedCategory !== 'all' 
                      ? `${filteredItems.length} of ${allItems.length} items` 
                      : `${allItems.length} items`}
                  </span>
                  {(searchQuery || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Items Display */}
            <div className="px-4 py-4">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-blue-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.name || 'Unnamed Item'}
                              </h3>

                              {item.hindi_name && (
                                <p className="text-sm text-gray-500 mb-1">{item.hindi_name}</p>
                              )}
                              
                              {item.brand_name && (
                                <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                                  {item.brand_name}
                                </span>
                              )}
                            </div>

                            <div className="text-right ml-3">
                              {item.price ? (
                                <div className="text-lg font-bold text-green-600">
                                  ₹{item.price}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Price on request</div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.category && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {getCategoryIcon(item.category)} {item.category}
                              </span>
                            )}
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
                              onClick={() => {
                                // Add to bag functionality
                                toast.success(`${item.name} added to bag!`);
                              }}
                              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 text-sm"
                            >
                              <ShoppingCart size={14} />
                              <span>Add to Bag</span>
                            </button>
                            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <Heart size={16} className="text-gray-600" />
                            </button>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? 'Try adjusting your search terms' : 'This shop has no items yet'}
                    </p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Filters
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
