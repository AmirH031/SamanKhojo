import React, { useState, useEffect } from 'react';
import { MapPin, Star, MessageCircle, ArrowRight, Phone, ExternalLink, ShoppingCart, TrendingUp, Clock, Users, Award, Zap, Filter, Grid, List, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import EnhancedSearchBar from '../components/EnhancedSearchBar';

import LanguageSelectionModal from '../components/LanguageSelectionModal';
import { getCurrentLocation, formatDistance } from '../services/locationService';
import { calculateDistance } from '../utils';
import { getShops, Shop } from '../services/firestoreService';
import { addToBag } from '../services/bagService';
import { isFirstVisit } from '../services/languageService';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import ProfileSetupModal from '../components/ProfileSetupModal';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const HomePage = () => {
    const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
    const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
    const [trendingShops, setTrendingShops] = useState<Shop[]>([]);
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileSetup, setShowProfileSetup] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, needsProfileSetup } = useAuth();

    useEffect(() => {
        // Check if this is first visit
        if (isFirstVisit()) {
            setShowLanguageModal(true);
        }

        const initializeData = async () => {
            setIsLoading(true);
            try {
                // Get user location first
                const location = await getCurrentLocation();
                setUserLocation(location);

                // Fetch all shops from Firestore
                const shops = await getShops();
                setAllShops(shops);

                // Calculate distances if location is available
                const shopsWithDistance = location ? shops.map(shop => ({
                    ...shop,
                    distance: calculateDistance(
                        location.latitude,
                        location.longitude,
                        shop.location.lat,
                        shop.location.lng
                    )
                })) : shops;

                // Filter and sort different categories
                const featured = shopsWithDistance.filter(shop => shop.isFeatured).slice(0, 8);
                const nearby = location ? shopsWithDistance
                    .filter(shop => shop.distance && shop.distance <= 5)
                    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                    .slice(0, 6) : [];
                const trending = shopsWithDistance
                    .filter(shop => shop.averageRating && shop.averageRating >= 4.0)
                    .sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0))
                    .slice(0, 6);

                setFeaturedShops(featured);
                setNearbyShops(nearby);
                setTrendingShops(trending);
            } catch (error) {
                console.error('Error initializing data:', error);
                toast.error('Failed to load shop data');
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, []);

    // Helper function to calculate distance
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };





    const handleContactShop = (shop: Shop) => {
        const whatsappUrl = `https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hi, I found your shop on SamanKhojo. I'm interested in your products.`;
        window.open(whatsappUrl, '_blank');
        toast.success('Opening WhatsApp to contact shop!');
    };

    const handleAddToBag = async (shop: Shop) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (needsProfileSetup) {
            setShowProfileSetup(true);
            return;
        }

        try {
            await addToBag({
                itemId: `shop-${shop.id}`,
                itemName: `Item from ${shop.shopName}`,
                shopId: shop.id,
                shopName: shop.shopName,
                quantity: 1,
                unit: 'item'
            });
            toast.success(`${shop.shopName} added to bag!`);
        } catch (error) {
            console.error('Error adding to bag:', error);
            toast.error('Failed to add to bag');
        }
    };

    const categories = [
        { id: 'all', name: 'All Shops', icon: Grid },
        { id: 'grocery', name: 'Grocery', icon: ShoppingCart },
        { id: 'medical', name: 'Medical', icon: Award },
        { id: 'electronics', name: 'Electronics', icon: Zap },
    ];

    // Shop Card Component
    const ShopCard = ({ shop, index, onContact, onAddToBag }: {
        shop: Shop;
        index: number;
        onContact: (shop: Shop) => void;
        onAddToBag: (shop: Shop) => void;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{
                scale: 1.02,
                boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
            }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
            onClick={() => navigate(`/shop/${shop.id}`)}
        >
            {/* Shop Image */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={shop.imageUrl || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400"}
                    alt={shop.shopName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                {/* Featured Badge */}
                {shop.isFeatured && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Award size={12} />
                        <span>Featured</span>
                    </div>
                )}

                {/* Distance Badge */}
                {shop.distance && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {formatDistance(shop.distance)}
                    </div>
                )}

                {/* Status Indicator */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${shop.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {shop.isOpen ? '🟢 Open' : '🔴 Closed'}
                </div>
            </div>

            {/* Shop Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {shop.shopName}
                    </h3>
                    {shop.isVerified && (
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                            <span className="text-white text-xs">✓</span>
                        </div>
                    )}
                </div>

                {shop.ownerName && (
                    <p className="text-sm text-gray-600 mb-2">
                        by <span className="font-medium">{shop.ownerName}</span>
                    </p>
                )}

                {/* Rating */}
                {shop.averageRating && shop.totalReviews && shop.totalReviews > 0 && (
                    <div className="flex items-center space-x-1 mb-3">
                        <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    className={`${i < Math.floor(shop.averageRating!)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{shop.averageRating}</span>
                        <span className="text-xs text-gray-500">({shop.totalReviews})</span>
                    </div>
                )}

                {/* Address */}
                <div className="flex items-start space-x-2 text-gray-600 mb-4">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm line-clamp-2">{shop.address}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onContact(shop);
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-xs font-medium flex items-center justify-center space-x-1"
                    >
                        <MessageCircle size={12} />
                        <span>Contact</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToBag(shop);
                        }}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-xs font-medium flex items-center justify-center space-x-1"
                    >
                        <ShoppingCart size={12} />
                        <span>Add to Bag</span>
                    </motion.button>

                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-xs font-medium flex items-center justify-center space-x-1"
                    >
                        <ExternalLink size={12} />
                        <span>Map</span>
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );

    // Animation variants
    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 }
    };

    const staggerContainer = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const pulseAnimation = {
        animate: {
            scale: [1, 1.05, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const slideInLeft = {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 }
    };

    const slideInRight = {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 }
    };

    return (
        <div className="relative min-h-screen">
            {/* Main Content */}
            <div className="relative z-10">
                {/* Blurred Background Image - constrained to main content */}
                <div
                    className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                    style={{
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed',
                        filter: 'blur(3px)',
                        opacity: 0.8,
                    }}
                ></div>

                {/* Hero Section - mobile friendly */}
                <section className="relative flex items-center justify-center min-h-[70vh] md:min-h-screen py-8 px-2 md:py-16 md:px-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/30 to-black/50"></div>
                    <div className="relative z-10 text-center px-2 md:px-4 max-w-full md:max-w-4xl mx-auto">
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="bg-white/10 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-16 border border-white/20"
                        >
                            {/* TODO: Re-enable Streak Badge in future
              <motion.div 
                variants={fadeInUp}
                className="flex justify-center mb-4"
              >
                <StreakBadge />
              </motion.div>
              */}

                            {/* Main Heading */}
                            <motion.h1
                                variants={fadeInUp}
                                className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold mb-4 md:mb-6 leading-tight"
                            >
                                <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-2xl filter drop-shadow-lg">
                                    {t('home.title')}
                                </span>
                            </motion.h1>

                            {/* SEO Tagline */}
                            <motion.div
                                variants={fadeInUp}
                                className="mb-8"
                            >
                                <h2 className="text-lg xs:text-xl md:text-3xl font-bold text-white mb-4">
                                    {t('home.subtitle')}
                                </h2>
                                <p className="text-base xs:text-lg md:text-xl text-white/90 max-w-4xl mx-auto leading-relaxed">
                                    {t('home.description')}
                                </p>
                            </motion.div>

                            {/* Optimized Search */}
                            <motion.div
                                variants={fadeInUp}
                                className="max-w-full md:max-w-3xl mx-auto mb-8"
                            >
                                <EnhancedSearchBar
                                    placeholder={t('home.searchPlaceholder')}
                                    variant="hero"
                                    className="w-full"
                                />
                            </motion.div>
                            {/* SEO Features List */}
                            <motion.div
                                variants={fadeInUp}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-full md:max-w-4xl mx-auto"
                            >
                                <motion.div
                                    variants={pulseAnimation}
                                    className="flex items-center justify-center space-x-2 md:space-x-3 text-white/90 bg-white/10 rounded-2xl p-3 md:p-4"
                                >
                                    <MapPin className="text-green-400" size={24} />
                                    <span className="font-medium text-sm md:text-base">Find nearby local shops instantly</span>
                                </motion.div>
                                <motion.div
                                    variants={pulseAnimation}
                                    className="flex items-center justify-center space-x-2 md:space-x-3 text-white/90 bg-white/10 rounded-2xl p-3 md:p-4"
                                >
                                    <MessageCircle className="text-blue-400" size={24} />
                                    <span className="font-medium text-sm md:text-base">Works with WhatsApp, Hindi & English</span>
                                </motion.div>
                                <motion.div
                                    variants={pulseAnimation}
                                    className="flex items-center justify-center space-x-2 md:space-x-3 text-white/90 bg-white/10 rounded-2xl p-3 md:p-4"
                                >
                                    <ExternalLink className="text-purple-400" size={24} />
                                    <span className="font-medium text-sm md:text-base">Verified shop details with Google Map link</span>
                                </motion.div>
                            </motion.div>

                            {/* CTA Buttons */}
                            <motion.div variants={fadeInUp} className="flex justify-center">
                                <button
                                    onClick={() => navigate('/shops')}
                                    className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 flex items-center space-x-2 justify-center"
                                >
                                    <Store size={20} />
                                    <span>Browse All Shops</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-8 md:py-12 px-4 bg-white/90 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
                        >
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3"
                                >
                                    <Users className="text-white" size={24} />
                                </motion.div>
                                <h3 className="text-xl md:text-3xl font-bold text-gray-900">{allShops.length}+</h3>
                                <p className="text-sm md:text-base text-gray-600">Verified Shops</p>
                            </div>

                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3"
                                >
                                    <MapPin className="text-white" size={24} />
                                </motion.div>
                                <h3 className="text-xl md:text-3xl font-bold text-gray-900">{nearbyShops.length}</h3>
                                <p className="text-sm md:text-base text-gray-600">Nearby Shops</p>
                            </div>

                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3"
                                >
                                    <Clock className="text-white" size={24} />
                                </motion.div>
                                <h3 className="text-xl md:text-3xl font-bold text-gray-900">24/7</h3>
                                <p className="text-sm md:text-base text-gray-600">Service</p>
                            </div>

                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3"
                                >
                                    <Star className="text-white" size={24} />
                                </motion.div>
                                <h3 className="text-xl md:text-3xl font-bold text-gray-900">4.8+</h3>
                                <p className="text-sm md:text-base text-gray-600">Rating</p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Category Filter */}
                <section className="py-6 px-4 bg-gradient-to-r from-slate-50 to-blue-50">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4"
                        >
                            {categories.map((category) => (
                                <motion.button
                                    key={category.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`flex items-center space-x-2 px-3 md:px-6 py-2 md:py-3 rounded-2xl font-medium transition-all ${selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <category.icon size={16} />
                                    <span className="text-sm md:text-base">{category.name}</span>
                                </motion.button>
                            ))}
                        </motion.div>

                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-600'
                                    }`}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-600'
                                    }`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </section>



                {/* Featured Shops Section */}
                <section className="py-10 md:py-16 px-4 bg-gradient-to-br from-white to-blue-50">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-8 md:mb-12"
                        >
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <Award className="text-yellow-500" size={32} />
                                <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
                                    Featured Shops
                                </h2>
                            </div>
                            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
                                Discover our handpicked selection of top-rated local shops
                            </p>
                        </motion.div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                        <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                        <div className="flex space-x-2">
                                            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                                            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                            >
                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                                    spaceBetween={20}
                                    slidesPerView={1}
                                    navigation
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                                    effect="coverflow"
                                    coverflowEffect={{
                                        rotate: 50,
                                        stretch: 0,
                                        depth: 100,
                                        modifier: 1,
                                        slideShadows: true,
                                    }}
                                    breakpoints={{
                                        640: { slidesPerView: 2, effect: 'slide' },
                                        768: { slidesPerView: 3, effect: 'slide' },
                                        1024: { slidesPerView: 4, effect: 'slide' },
                                    }}
                                    className="featured-shops-swiper pb-12"
                                >
                                    {featuredShops.map((shop, index) => (
                                        <SwiperSlide key={shop.id}>
                                            <ShopCard shop={shop} index={index} onContact={handleContactShop} onAddToBag={handleAddToBag} />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </motion.div>
                        )}

                        {!isLoading && featuredShops.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Award className="text-gray-400" size={32} />
                                </div>
                                <p className="text-gray-600 mb-4">No featured shops available at the moment.</p>
                                <button
                                    onClick={() => navigate('/shops')}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                                >
                                    Browse All Shops
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Nearby Shops Section */}
                {nearbyShops.length > 0 && (
                    <section className="py-10 md:py-16 px-4 bg-gradient-to-br from-green-50 to-teal-50">
                        <div className="max-w-7xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center mb-8 md:mb-12"
                            >
                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <MapPin className="text-green-500" size={32} />
                                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
                                        Nearby Shops
                                    </h2>
                                </div>
                                <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
                                    Shops within 5km of your location
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {nearbyShops.map((shop, index) => (
                                    <ShopCard key={shop.id} shop={shop} index={index} onContact={handleContactShop} onAddToBag={handleAddToBag} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Trending Shops Section */}
                <section className="py-10 md:py-16 px-4 bg-gradient-to-br from-orange-50 to-red-50">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-8 md:mb-12"
                        >
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <TrendingUp className="text-orange-500" size={32} />
                                <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
                                    Trending Shops
                                </h2>
                            </div>
                            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
                                Most popular shops with highest ratings
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trendingShops.map((shop, index) => (
                                <ShopCard key={shop.id} shop={shop} index={index} onContact={handleContactShop} onAddToBag={handleAddToBag} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                Ready to Discover Local Shops?
                            </h2>
                            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                                Join thousands of users who trust SamanKhojo to find the best local shops in their area.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/shops')}
                                    className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl flex items-center space-x-2"
                                >
                                    <span>Explore All Shops</span>
                                    <ArrowRight size={20} />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAuthModal(true)}
                                    className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all flex items-center space-x-2"
                                >
                                    <Users size={20} />
                                    <span>Join SamanKhojo</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </section>

            </div>

            {/* Language Selection Modal */}
            <LanguageSelectionModal
                isOpen={showLanguageModal}
                onClose={() => setShowLanguageModal(false)}
            />

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
            />

            {/* Profile Setup Modal */}
            <ProfileSetupModal
                isOpen={showProfileSetup}
                onClose={() => setShowProfileSetup(false)}
                onSuccess={() => setShowProfileSetup(false)}
            />
        </div>
    );
};

export default HomePage;