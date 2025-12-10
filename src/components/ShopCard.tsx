import React from 'react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MapPin, Phone, Star, ExternalLink, ShoppingCart, MessageCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Shop, ServiceDetails } from '../services/firestoreService';
import { getItems } from '../services/firestoreService';
import { addToBag } from '../services/bagService';
import { formatTime, getShopStatus, shouldDisplay, formatPrice } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import ProfileSetupModal from './ProfileSetupModal';
import ComingSoonModal from './ComingSoonModal';

// Helper function to get readable shop type names
const getShopTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'grocery': 'Grocery Store',
    'restaurant': 'Restaurant',
    'cafe': 'Cafe',
    'hotel': 'Hotel',
    'stationery': 'Stationery Shop',
    'mobile': 'Mobile Shop',
    'clinic': 'Clinic',
    'cosmetic': 'Cosmetic Store',
    'pharmacy': 'Pharmacy',
    'electronics': 'Electronics Store',
    'clothing': 'Clothing Store',
    'hardware': 'Hardware Store',
    'bakery': 'Bakery',
    'default': 'Shop'
  };

  return typeMap[type?.toLowerCase()] || typeMap['default'];
};

interface ShopCardProps {
  shop: Shop;
  index?: number;
  showDistance?: boolean;
  viewMode?: 'grid' | 'list' | 'ecommerce';
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, index = 0, showDistance = false, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const { user, needsProfileSetup } = useAuth();
  const { i18n } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Calculate average rating
  const avgRating = shop.averageRating || 0;
  const totalReviews = shop.totalReviews || 0;

  // Default images mapping
  const DEFAULT_IMAGES: Record<string, string> = {
    // Broad categories
    product: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800", // Grocery/General store
    menu: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800", // Restaurant
    service: "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800", // Service/Salon
    office: "https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=800", // Office

    // Specific types
    grocery: "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800",
    restaurant: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800",
    cafe: "https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=800",
    hotel: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800",
    stationery: "https://images.pexels.com/photos/159751/book-address-book-notebook-pen-159751.jpeg?auto=compress&cs=tinysrgb&w=800",
    mobile: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800",
    electronics: "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800",
    clothing: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800",
    clinic: "https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg?auto=compress&cs=tinysrgb&w=800",
    pharmacy: "https://images.pexels.com/photos/5910953/pexels-photo-5910953.jpeg?auto=compress&cs=tinysrgb&w=800",
    bakery: "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800",
    hardware: "https://images.pexels.com/photos/3616764/pexels-photo-3616764.jpeg?auto=compress&cs=tinysrgb&w=800",
  };

  const getShopImage = (shop: Shop) => {
    if (shop.imageUrl) return shop.imageUrl;

    // Try specific type first
    if (shop.type && DEFAULT_IMAGES[shop.type.toLowerCase()]) {
      return DEFAULT_IMAGES[shop.type.toLowerCase()];
    }

    // Fallback to broad category
    if (shop.shopType && DEFAULT_IMAGES[shop.shopType.toLowerCase()]) {
      return DEFAULT_IMAGES[shop.shopType.toLowerCase()];
    }

    // Ultimate fallback
    return DEFAULT_IMAGES.product;
  };

  const getShopTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'grocery': '🛒',
      'restaurant': '🍽️',
      'cafe': '☕',
      'hotel': '🏨',
      'stationery': '📝',
      'mobile': '📱',
      'clinic': '🏥',
      'cosmetic': '💄',
      'pharmacy': '💊',
      'electronics': '📱',
      'clothing': '👕',
      'hardware': '🔧',
      'bakery': '🍞',
      'default': '🏪'
    };

    return iconMap[type?.toLowerCase()] || iconMap['default'];
  };

  // Helper to get card styling based on shop type
  const getCardStyle = (shopType: string) => {
    switch (shopType) {
      case 'menu': // Restaurant/Food
        return {
          border: 'border-orange-100',
          hoverBorder: 'hover:border-orange-300',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-800',
          buttonGradient: 'from-orange-500 to-orange-600',
          buttonHover: 'hover:from-orange-600 hover:to-orange-700',
          iconBg: 'bg-orange-50',
          shadowColor: 'rgba(249, 115, 22, 0.1)'
        };
      case 'service': // Services
        return {
          border: 'border-purple-100',
          hoverBorder: 'hover:border-purple-300',
          badgeBg: 'bg-purple-100',
          badgeText: 'text-purple-800',
          buttonGradient: 'from-purple-500 to-purple-600',
          buttonHover: 'hover:from-purple-600 hover:to-purple-700',
          iconBg: 'bg-purple-50',
          shadowColor: 'rgba(168, 85, 247, 0.1)'
        };
      case 'office': // Public Facilities
        return {
          border: 'border-emerald-100',
          hoverBorder: 'hover:border-emerald-300',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-800',
          buttonGradient: 'from-emerald-500 to-emerald-600',
          buttonHover: 'hover:from-emerald-600 hover:to-emerald-700',
          iconBg: 'bg-emerald-50',
          shadowColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'product': // General Shopping
      default:
        return {
          border: 'border-blue-100',
          hoverBorder: 'hover:border-blue-300',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-800',
          buttonGradient: 'from-blue-500 to-blue-600',
          buttonHover: 'hover:from-blue-600 hover:to-blue-700',
          iconBg: 'bg-blue-50',
          shadowColor: 'rgba(59, 130, 246, 0.1)'
        };
    }
  };

  const styles = getCardStyle(shop.shopType || 'product');

  const formatDistance = (distance: number | null): string => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  // State for showing items/services modal
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [modalItems, setModalItems] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Show items/services list modal when Add to Bag/Book Service is clicked
  const handleAddToBagOrBook = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowItemsModal(true);
    setModalItems([]);
    if (shop.shopType === 'service') {
      setLoadingItems(true);
      try {
        const items = await getItems(shop.id, 'service');
        setModalItems(items.map((item: any) => item.name).filter(Boolean));
      } catch (err) {
        setModalItems([]);
      } finally {
        setLoadingItems(false);
      }
    } else {
      if (shop.items && shop.items.length > 0) {
        setModalItems(shop.items);
      } else {
        setLoadingItems(true);
        try {
          const items = await getItems(shop.id);
          setModalItems(items.map((item: any) => item.name).filter(Boolean));
        } catch (err) {
          setModalItems([]);
        } finally {
          setLoadingItems(false);
        }
      }
    }
  };

  // E-commerce style component
  if (viewMode === 'ecommerce') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          whileHover={{ y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
          onClick={() => navigate(`/shop/${shop.id}`)}
        >
          {/* Shop Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={getShopImage(shop)}
              alt={shop.shopName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Status Badge */}
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {getShopStatus(shop.openingTime || '', shop.closingTime || '').status}
            </div>

            {/* Featured Badge */}
            {shop.isFeatured && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </div>
            )}

            {/* Rating */}
            {avgRating > 0 && (
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 flex items-center space-x-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                <span className="text-xs font-medium">{avgRating}</span>
                <span className="text-xs text-gray-500">({totalReviews})</span>
              </div>
            )}
          </div>

          {/* Shop Info */}
          <div className="p-3">
            {/* Shop Name */}
            <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {shop.shopName}
            </h3>

            {/* Shop Type and Category */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <span className="text-sm">{getShopTypeIcon(shop.type)}</span>
                <span className="text-xs text-gray-600 capitalize">{shop.type}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.shopType === 'product' ? 'bg-blue-100 text-blue-800' :
                shop.shopType === 'menu' ? 'bg-orange-100 text-orange-800' :
                  shop.shopType === 'office' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-purple-100 text-purple-800'
                }`}>
                {shop.shopType === 'product' ? '🛍️' :
                  shop.shopType === 'menu' ? '🍽️' :
                    shop.shopType === 'office' ? '🏛️' : '🔧'}
              </span>
            </div>

            {/* Service Details or Items Preview */}
            {shop.shopType === 'service' && shop.serviceDetails ? (
              <div className="mb-2">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-xs text-purple-600 font-medium">🔧 Service Provider</span>
                </div>
                {shop.serviceDetails.serviceName && (
                  <p className="text-xs font-medium text-gray-900 mb-1">{shop.serviceDetails.serviceName}</p>
                )}
                {shop.serviceDetails.priceRange && (
                  <p className="text-xs text-green-600 font-medium mb-1">💰 {shop.serviceDetails.priceRange}</p>
                )}
                {shop.serviceDetails.duration && (
                  <p className="text-xs text-blue-600 mb-1">⏱️ {shop.serviceDetails.duration}</p>
                )}
                {shop.serviceDetails.description && shop.serviceDetails.description.length > 0 && (
                  <ul className="text-xs text-gray-500 space-y-1">
                    {shop.serviceDetails.description.slice(0, 2).map((desc, index) => (
                      <li key={index} className="line-clamp-1">• {desc}</li>
                    ))}
                    {shop.serviceDetails.description.length > 2 && (
                      <li className="text-purple-600">+{shop.serviceDetails.description.length - 2} more</li>
                    )}
                  </ul>
                )}
              </div>
            ) : shop.shopType === 'office' && shop.officeDetails ? (
              <div className="mb-2">
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-xs text-emerald-600 font-medium">🏛️ Public Facility</span>
                </div>
                {shop.officeDetails.facilityType && (
                  <p className="text-xs font-medium text-gray-900 mb-1">
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
                  </p>
                )}
                {shop.officeDetails.department && (
                  <p className="text-xs text-blue-600 mb-1">🏛️ {shop.officeDetails.department}</p>
                )}
                {shop.officeDetails.openTime && shop.officeDetails.closeTime && (
                  <p className="text-xs text-green-600 mb-1">
                    ⏰ {formatTime(shop.officeDetails.openTime)} - {formatTime(shop.officeDetails.closeTime)}
                  </p>
                )}
                {shop.officeDetails.services && shop.officeDetails.services.length > 0 && (
                  <ul className="text-xs text-gray-500 space-y-1">
                    {shop.officeDetails.services.slice(0, 2).map((service, index) => (
                      <li key={index} className="line-clamp-1">• {service}</li>
                    ))}
                    {shop.officeDetails.services.length > 2 && (
                      <li className="text-emerald-600">+{shop.officeDetails.services.length - 2} more services</li>
                    )}
                  </ul>
                )}
              </div>
            ) : shop.items && shop.items.length > 0 ? (
              <div className="mb-2">
                <p className="text-xs text-gray-500 line-clamp-2">
                  {shop.items.slice(0, 2).join(', ')}
                  {shop.items.length > 2 && '...'}
                </p>
              </div>
            ) : null}

            {/* Distance */}
            {typeof shop.distance === 'number' && (
              <div className="flex items-center space-x-1 mb-2">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {shop.distance < 1 ? `${Math.round(shop.distance * 1000)}m` : `${shop.distance.toFixed(1)}km`}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (shop.shopType === 'service') {
                    setShowComingSoon(true);
                  } else if (shop.shopType === 'office') {
                    navigate(`/shop/${shop.id}`);
                  } else {
                    handleAddToBagOrBook(e);
                  }
                }}
                disabled={!getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen
                  ? shop.shopType === 'service'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : shop.shopType === 'office'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {shop.shopType === 'service' ? (
                  <>
                    <Calendar size={12} className="inline mr-1" />
                    Coming Soon \ud83d\ude80
                  </>
                ) : shop.shopType === 'office' ? (
                  <>
                    <MapPin size={12} className="inline mr-1" />
                    View Details
                  </>
                ) : (
                  <>
                    <ShoppingCart size={12} className="inline mr-1" />
                    Add to Bag
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

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
      </>
    );
  }



  // Get shop status
  const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: index * 0.1 }}
        whileHover={{
          scale: 1.03,
          boxShadow: `0 20px 40px ${styles.shadowColor}`
        }}
        className={`bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border ${styles.border} ${styles.hoverBorder} shadow-lg hover:shadow-2xl transition-all cursor-pointer group`}
        onClick={() => navigate(`/shop/${shop.id}`)}
      >
        {/* Shop Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={getShopImage(shop)}
            alt={shop.shopName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

          {/* Featured Badge */}
          {shop.isFeatured && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
          )}

          {/* Shop Type Badge */}
          {shouldDisplay(shop.type) && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
              <span className="text-lg">{getShopTypeIcon(shop.type)}</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{shop.type}</span>
            </div>
          )}

          {/* Rating Badge */}
          {avgRating > 0 && totalReviews > 0 && (
            <div className={`absolute ${shouldDisplay(shop.type) ? 'top-16 right-4' : 'top-4 right-4'} bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1`}>
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">{avgRating}</span>
              <span className="text-xs text-gray-600">({totalReviews})</span>
            </div>
          )}

          {/* Shop Status Badge */}
          <div className={`absolute bottom-4 right-4 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 ${shopStatus.isOpen
            ? 'bg-green-500/90 text-white'
            : 'bg-red-500/90 text-white'
            }`}>
            <span className="text-sm font-medium">{shopStatus.status}</span>
          </div>
        </div>

        {/* Shop Info */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {shop.shopName}
            </h3>
            {/* Display service details for service type shops */}
            {shop.shopType === 'service' && shop.serviceDetails ? (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-3 border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    🔧 Service Provider
                  </span>
                </div>

                {shop.serviceDetails.serviceName && (
                  <h4 className="font-semibold text-gray-900 mb-1">{shop.serviceDetails.serviceName}</h4>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  {shop.serviceDetails.priceRange && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <span>💰</span>
                      <span>{shop.serviceDetails.priceRange}</span>
                    </div>
                  )}
                  {shop.serviceDetails.duration && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <span>⏱️</span>
                      <span>{shop.serviceDetails.duration}</span>
                    </div>
                  )}
                </div>

                {shop.serviceDetails.description && shop.serviceDetails.description.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    {shop.serviceDetails.description.slice(0, 2).map((desc, index) => (
                      <li key={index}>{desc}</li>
                    ))}
                    {shop.serviceDetails.description.length > 2 && (
                      <li className="text-purple-600">+{shop.serviceDetails.description.length - 2} more services</li>
                    )}
                  </ul>
                )}
              </div>
            ) : shop.shopType === 'office' && shop.officeDetails ? (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 mb-3 border border-emerald-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    🏛️ Public Facility
                  </span>
                </div>

                {shop.officeDetails.facilityType && (
                  <h4 className="font-semibold text-gray-900 mb-1">
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
                  </h4>
                )}

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  {shop.officeDetails.department && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <span>🏛️</span>
                      <span>{shop.officeDetails.department}</span>
                    </div>
                  )}
                  {shop.officeDetails.openTime && shop.officeDetails.closeTime && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <span>⏰</span>
                      <span>{formatTime(shop.officeDetails.openTime)} - {formatTime(shop.officeDetails.closeTime)}</span>
                    </div>
                  )}
                </div>

                {shop.officeDetails.services && shop.officeDetails.services.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    {shop.officeDetails.services.slice(0, 2).map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                    {shop.officeDetails.services.length > 2 && (
                      <li className="text-emerald-600">+{shop.officeDetails.services.length - 2} more services</li>
                    )}
                  </ul>
                )}
              </div>
            ) : shop.items && shop.items.length > 0 ? (
              <p className="text-sm text-blue-600 font-medium">
                {shop.items.slice(0, 3).join(', ')}
                {shop.items.length > 3 && ` +${shop.items.length - 3} more`}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 mb-6">
            {shouldDisplay(shop.ownerName) && (
              <p className="text-gray-600">
                Owner: <span className="font-medium text-gray-900">{shop.ownerName}</span>
              </p>
            )}

            {/* Shop Type */}
            {shouldDisplay(shop.type) && (
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="text-lg">{getShopTypeIcon(shop.type)}</span>
                <span className="text-sm font-medium">{getShopTypeName(shop.type)}</span>
              </div>
            )}

            {/* Opening Hours */}
            {shouldDisplay(shop.openingTime) && shouldDisplay(shop.closingTime) && (
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="text-lg">🕘</span>
                <div className="text-sm">
                  <span className={`font-medium ${shopStatus.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {shopStatus.status}
                  </span>
                  <br />
                  <span>{shopStatus.formattedHours}</span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-gray-600">
              <Phone size={16} />
              <button
                onClick={() => window.location.href = `https://wa.me/${shop.phone}`}
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                Contact Us
              </button>
            </div>


            <div className="flex items-start space-x-2 text-gray-600">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm">{shop.address}</span>
                {typeof shop.distance === 'number' && (
                  <span className="text-xs text-blue-600 font-medium block">
                    {shop.distance < 1 ? `${Math.round(shop.distance * 1000)}m away` : `${shop.distance.toFixed(1)}km away`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (shop.shopType === 'service') {
                  setShowComingSoon(true);
                } else if (shop.shopType === 'office') {
                  // For offices, navigate to the shop page for more details
                  navigate(`/shop/${shop.id}`);
                } else {
                  handleAddToBagOrBook(e);
                }
              }}
              disabled={!shopStatus.isOpen}
              className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-xl transition-all text-sm font-medium ${shopStatus.isOpen
                ? `bg-gradient-to-r ${styles.buttonGradient} text-white ${styles.buttonHover}`
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {shop.shopType === 'service' ? (
                <>
                  <Calendar size={14} />
                  <span>{shopStatus.isOpen ? 'Coming Soon \ud83d\ude80' : 'Closed'}</span>
                </>
              ) : shop.shopType === 'office' ? (
                <>
                  <MapPin size={14} />
                  <span>{shopStatus.isOpen ? 'View Details' : 'Closed'}</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  <span>{shopStatus.isOpen ? 'Add to Bag' : 'Closed'}</span>
                </>
              )}
            </button>

            <a
              href={shouldDisplay(shop.mapLink) ? shop.mapLink : `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center space-x-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all text-sm font-medium"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Map</span>
            </a>
          </div>
        </div>
      </motion.div>

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

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        type={shop.shopType === 'service' ? 'service' : 'product'}
      />

      {/* Items/Services List Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow-md border border-gray-200 transition-all"
              style={{ lineHeight: 1 }}
              onClick={() => setShowItemsModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              {shop.shopType === 'service' ? 'Book Service' : 'Add Items to Bag'}
            </h2>
            {loadingItems ? (
              <div className="text-gray-500 py-6 text-center">Loading items...</div>
            ) : modalItems && modalItems.length > 0 ? (
              <div>
                <ul className="mb-4 max-h-72 sm:max-h-96 overflow-y-auto grid grid-cols-1 gap-2 sm:gap-3">
                  {modalItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-3 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200"
                    >
                      <span className="text-gray-900 text-base font-medium truncate max-w-[60vw] sm:max-w-xs">{item}</span>
                      {shop.shopType === 'service' ? null : (
                        <button
                          className="ml-3 bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 text-sm font-semibold shadow"
                          onClick={() => {
                            addToBag({
                              itemId: `${shop.id}-${item}`,
                              itemName: item,
                              shopId: shop.id,
                              shopName: shop.shopName
                            });
                            toast.success(`${item} added to bag!`);
                          }}
                        >
                          Add
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {shop.shopType === 'service' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3 text-center">
                    <p className="text-yellow-800 text-sm font-medium">
                      <span className="block text-base font-semibold mb-1">Want to book or view full service details?</span>
                      Please visit the shop page
                    </p>
                  </div>
                )}
                {shop.shopType === 'service' ? (
                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition mt-1"
                    onClick={() => {
                      setShowItemsModal(false);
                      navigate(`/shop/${shop.id}`);
                    }}
                  >
                    Visit Shop
                  </button>
                ) : (
                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition mt-1"
                    onClick={() => setShowItemsModal(false)}
                  >
                    Done
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-500">No items/services found.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ShopCard;