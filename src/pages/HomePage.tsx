import React, { useState, useEffect } from 'react';
import { MapPin, Star, MessageCircle, ArrowRight, Phone, ExternalLink, ShoppingCart, TrendingUp, Clock, Users, Award, Zap, Filter, Grid2x2 as Grid, List, Store, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { useTranslation } from 'react-i18next';
import UnifiedSearchBar from '../components/UnifiedSearchBar';
import FestivalBanner from '../components/FestivalBanner';
import FestivalHeroSection from '../components/FestivalHeroSection';
import StandaloneBannerDisplay from '../components/StandaloneBannerDisplay';
import ErrorBoundary from '../components/ErrorBoundary';
import RecommendationsSection from '../components/RecommendationsSection';
import ProductAlertBanner from '../components/ProductAlertBanner';

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

    const categories = [
        { id: 'all', name: 'All Shops', icon: Grid },
        { id: 'grocery', name: 'Grocery', icon: ShoppingCart },
        { id: 'medical', name: 'Medical', icon: Award },
        { id: 'electronics', name: 'Electronics', icon: Zap },
    ];

    // Enhanced Shop Card Component
    const ShopCard = ({ shop, index, onContact }: {
        shop: Shop;
        index: number;
        onContact: (shop: Shop) => void;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
            }}
            className="group bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-white/50"
            onClick={() => navigate(`/shop/${shop.id}`)}
        >
            {/* Shop Image with Enhanced Overlay */}
            <div className="relative h-52 overflow-hidden">
                <img
                    src={shop.imageUrl || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400"}
                    alt={shop.shopName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Enhanced Badges */}
                {shop.isFeatured && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg"
                    >
                        <Award size={12} />
                        <span>Featured</span>
                    </motion.div>
                )}

                {shop.distance && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                        {formatDistance(shop.distance)}
                    </div>
                )}

                {/* Enhanced Status Indicator */}
                <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${shop.isOpen
                    ? 'bg-green-500/90 text-white'
                    : 'bg-red-500/90 text-white'
                    }`}>
                    {shop.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                </div>
            </div>

            {/* Enhanced Shop Info */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">
                        {shop.shopName}
                    </h3>
                    {shop.isVerified && (
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center ml-2 shadow-md"
                        >
                            <span className="text-white text-xs font-bold">✓</span>
                        </motion.div>
                    )}
                </div>

                {shop.ownerName && (
                    <p className="text-sm text-gray-600 mb-3">
                        by <span className="font-semibold text-gray-700">{shop.ownerName}</span>
                    </p>
                )}

                {/* Enhanced Rating */}
                {shop.averageRating && shop.totalReviews && shop.totalReviews > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="flex items-center space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={`${i < Math.floor(shop.averageRating!)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{shop.averageRating}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {shop.totalReviews} reviews
                        </span>
                    </div>
                )}

                {/* Enhanced Address */}
                <div className="flex items-start space-x-2 text-gray-600 mb-5">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5 text-gray-400" />
                    <span className="text-sm line-clamp-2 leading-relaxed">{shop.address}</span>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onContact(shop);
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 px-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1 shadow-md"
                    >
                        <MessageCircle size={14} />
                        <span>Contact</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (shop.shopType === 'service') {
                                toast.info('✨ Booking feature is coming soon! Stay tuned 🚀');
                            } else {
                                navigate(`/shop/${shop.id}`);
                            }
                        }}
                        className={`py-2.5 px-2 rounded-xl transition-all text-xs font-semibold flex items-center justify-center space-x-1 shadow-md ${shop.shopType === 'service'
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                            }`}
                    >
                        {shop.shopType === 'service' ? (
                            <>
                                <Calendar size={14} />
                                <span>Soon</span>
                            </>
                        ) : (
                            <>
                                <Store size={14} />
                                <span>Visit</span>
                            </>
                        )}
                    </motion.button>

                    <motion.a
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-r from-slate-500 to-gray-600 text-white py-2.5 px-2 rounded-xl hover:from-slate-600 hover:to-gray-700 transition-all text-xs font-semibold flex items-center justify-center space-x-1 shadow-md"
                    >
                        <ExternalLink size={14} />
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
                {/* Clean Background */}
                <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>

                {/* Hero Section - mobile friendly */}
                <section className="relative flex items-center justify-center min-h-[70vh] md:min-h-screen py-8 px-2 md:py-16 md:px-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/40 to-black/60"></div>
                    <div className="relative z-10 text-center px-2 md:px-4 max-w-full md:max-w-4xl mx-auto">
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-16 border border-white/30 shadow-2xl"
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
                                <span className="bg-gradient-to-r from-yellow-200 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-2xl filter drop-shadow-lg">
                                    {t('home.title')}
                                </span>
                            </motion.h1>

                            {/* SEO Tagline */}
                            <motion.div
                                variants={fadeInUp}
                                className="mb-8"
                            >
                                <h2 className="text-yellow-300 md:text-3xl font-bold mb-4 drop-shadow-xl">
                                    {t('home.subtitle')}
                                </h2>
                                <p className="text-base xs:text-lg md:text-xl text-white/95 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
                                    {t('home.description')}
                                </p>
                            </motion.div>

                            {/* Optimized Search */}
                            <motion.div
                                variants={fadeInUp}
                                className="max-w-full md:max-w-4xl mx-auto mb-8"
                            >
                                <UnifiedSearchBar
                                    placeholder={t('home.searchPlaceholder')}
                                    variant="hero"
                                    className="w-full shadow-2xl"
                                />
                                <div className="mt-4 text-center">
                                    <p className="text-white/95 text-sm md:text-base drop-shadow-md">
                                        🔍 Search for items, food, services, or shops • 🗣️ Voice search supported • 🌍 Works in Hindi & English
                                    </p>
                                </div>
                            </motion.div>
                            {/* Festival Banner or Feature Boxes */}
                            <FestivalHeroSection
                                pulseAnimation={pulseAnimation}
                                fadeInUp={fadeInUp}
                            />

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

                {/* Product Alerts Banner */}
                <section className="py-4 px-4 relative">
                    <div className="max-w-7xl mx-auto">
                        <ErrorBoundary fallback={<div></div>}>
                            <ProductAlertBanner className="mb-4" maxAlerts={2} />
                        </ErrorBoundary>
                    </div>
                </section>

                {/* Standalone Banners */}
                <ErrorBoundary fallback={<div className="px-4 max-w-7xl mx-auto py-2"></div>}>
                    <StandaloneBannerDisplay position="hero" className="px-4 max-w-7xl mx-auto" />
                </ErrorBoundary>

                {/* Recommendations Section */}
                <section className="py-12 md:py-16 px-4 relative">
                    <div className="max-w-7xl mx-auto">
                        <ErrorBoundary fallback={<div className="text-center text-gray-500">Unable to load recommendations</div>}>
                            <RecommendationsSection />
                        </ErrorBoundary>
                    </div>
                </section>

                {/* Stats Section - Modern Glass Cards */}
                <section className="py-12 md:py-20 px-4 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                        >
                            {[
                                { icon: Users, count: `${allShops.length}+`, label: "Verified Shops", gradient: "from-blue-500 to-purple-600", delay: 0.1 },
                                { icon: MapPin, count: nearbyShops.length, label: "Nearby Shops", gradient: "from-emerald-500 to-teal-600", delay: 0.2 },
                                { icon: Clock, count: "24/7", label: "Service", gradient: "from-orange-500 to-red-600", delay: 0.3 },
                                { icon: Star, count: "4.8+", label: "Rating", gradient: "from-pink-500 to-rose-600", delay: 0.4 }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.6, delay: stat.delay }}
                                    whileHover={{ y: -8, scale: 1.05 }}
                                    className="group relative"
                                >
                                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden">
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl" style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}></div>

                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            whileInView={{ scale: 1, rotate: 0 }}
                                            transition={{ duration: 0.8, delay: stat.delay + 0.2, type: "spring", bounce: 0.4 }}
                                            className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                                        >
                                            <stat.icon className="text-white" size={28} />
                                        </motion.div>

                                        <motion.h3
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            transition={{ duration: 0.6, delay: stat.delay + 0.4 }}
                                            className="text-2xl md:text-4xl font-bold text-gray-900 mb-2"
                                        >
                                            {stat.count}
                                        </motion.h3>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            transition={{ duration: 0.6, delay: stat.delay + 0.5 }}
                                            className="text-sm md:text-base text-gray-600 font-medium"
                                        >
                                            {stat.label}
                                        </motion.p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Category Filter - Modern Floating Pills */}
                <section className="py-8 px-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50 to-white"></div>
                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6"
                        >
                            {categories.map((category, index) => (
                                <motion.button
                                    key={category.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`group relative flex items-center space-x-2 px-4 md:px-6 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 ${selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg border border-gray-200/50'
                                        }`}
                                >
                                    {selectedCategory === category.id && (
                                        <motion.div
                                            layoutId="activeCategory"
                                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <category.icon size={18} className="relative z-10" />
                                    <span className="text-sm md:text-base relative z-10">{category.name}</span>
                                </motion.button>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center"
                        >
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50">
                                <div className="flex space-x-1">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setViewMode('grid')}
                                        className={`relative p-3 rounded-xl transition-all duration-300 ${viewMode === 'grid'
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Grid size={20} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setViewMode('list')}
                                        className={`relative p-3 rounded-xl transition-all duration-300 ${viewMode === 'list'
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <List size={20} />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>





                {/* Nearby Shops Section - Enhanced */}
                {nearbyShops.length > 0 && (
                    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
                        {/* Background Design */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"></div>
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-teal-200/40 to-cyan-300/40 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

                        <div className="max-w-7xl mx-auto relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-center mb-12 md:mb-16"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                                    className="inline-flex items-center justify-center space-x-3 mb-6"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <MapPin className="text-white" size={24} />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Nearby Shops
                                    </h2>
                                </motion.div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                                >
                                    Convenient shops within 5km of your location, ready to serve you with quick delivery and pickup options
                                </motion.p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                            >
                                {nearbyShops.map((shop, index) => (
                                    <ShopCard key={shop.id} shop={shop} index={index} onContact={handleContactShop} />
                                ))}
                            </motion.div>
                        </div>
                    </section>
                )}

                {/* Trending Shops Section - Enhanced */}
                <section className="py-16 md:py-24 px-4 relative overflow-hidden">
                    {/* Background Design */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50"></div>
                    <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-br from-rose-200/30 to-pink-300/30 rounded-full blur-3xl -translate-x-1/2"></div>
                    <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-300/30 rounded-full blur-3xl translate-x-1/2"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12 md:mb-16"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                                className="inline-flex items-center justify-center space-x-3 mb-6"
                            >
                                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <TrendingUp className="text-white" size={24} />
                                </div>
                                <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Trending Shops
                                </h2>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                            >
                                Most popular shops with highest ratings and customer satisfaction, trending in your area right now
                            </motion.p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                        >
                            {trendingShops.map((shop, index) => (
                                <ShopCard key={shop.id} shop={shop} index={index} onContact={handleContactShop} />
                            ))}
                        </motion.div>
                    </div>
                </section>



                {/* Call to Action Section - Modern Design */}
                <section className="py-20 md:py-32 px-4 relative overflow-hidden">
                    {/* Dynamic Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.3),transparent_50%)]"></div>

                    {/* Floating Elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse delay-500"></div>

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-16 border border-white/20 shadow-2xl"
                        >
                            <motion.h2
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
                            >
                                Ready to Discover
                                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent"> Local Shops</span>?
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
                            >
                                Join thousands of users who trust SamanKhojo to find the best local shops, connect with trusted vendors, and discover amazing deals in their area.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/shops')}
                                    className="group bg-gradient-to-r from-white to-gray-100 text-gray-900 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 shadow-xl"
                                >
                                    <span>Explore All Shops</span>
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAuthModal(true)}
                                    className="group border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center space-x-3"
                                >
                                    <Users size={20} />
                                    <span>Join SamanKhojo</span>
                                </motion.button>
                            </motion.div>

                            {/* Trust Indicators */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/70"
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm">Trusted by 10,000+ users</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                                    <span className="text-sm">500+ verified shops</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                                    <span className="text-sm">4.8★ average rating</span>
                                </div>
                            </motion.div>
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