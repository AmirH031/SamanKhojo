import React from 'react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MapPin, Phone, Star, ExternalLink, ShoppingCart, MessageCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Shop } from '../services/firestoreService';
import { addToBag } from '../services/bagService';
import { formatTime, getShopStatus, shouldDisplay, formatPrice } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import ProfileSetupModal from './ProfileSetupModal';

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

  // Calculate average rating
  const avgRating = shop.averageRating || 0;
  const totalReviews = shop.totalReviews || 0;

  const getShopImage = (shop: Shop) => {
    return shop.imageUrl || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400";
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

  const formatDistance = (distance: number | null): string => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  const handleAddToBag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
        itemName: `Quick order from ${shop.shopName}`,
        shopId: shop.id,
        shopName: shop.shopName,
        quantity: 1,
        unit: 'order'
      });
      toast.success(`${shop.shopName} added to bag!`);
    } catch (error) {
      console.error('Error adding to bag:', error);
      toast.error('Failed to add to bag');
    }
  };

  const handleVisitShop = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shop/${shop.id}`);
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
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
              getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                shop.shopType === 'product' ? 'bg-blue-100 text-blue-800' :
                shop.shopType === 'menu' ? 'bg-orange-100 text-orange-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {shop.shopType === 'product' ? '🛍️' : 
                 shop.shopType === 'menu' ? '🍽️' : '🔧'}
              </span>
            </div>

            {/* Service Details or Items Preview */}
            {shop.shopType === 'service' && shop.serviceDetails && shop.serviceDetails.length > 0 ? (
              <div className="mb-2">
                <p className="text-xs text-blue-600 font-medium mb-1">Services:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {shop.serviceDetails.slice(0, 2).map((detail, index) => (
                    <li key={index} className="line-clamp-1">• {detail}</li>
                  ))}
                  {shop.serviceDetails.length > 2 && (
                    <li className="text-blue-600">+{shop.serviceDetails.length - 2} more</li>
                  )}
                </ul>
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
                onClick={handleVisitShop}
                disabled={!getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen ? 'Visit' : 'Closed'}
              </button>
              <button
                onClick={handleAddToBag}
                disabled={!getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  getShopStatus(shop.openingTime || '', shop.closingTime || '').isOpen
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={12} className="inline mr-1" />
                Add
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
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
        }}
        className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
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
        <div className={`absolute bottom-4 right-4 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 ${
          shopStatus.isOpen 
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
          {shop.shopType === 'service' && shop.serviceDetails && shop.serviceDetails.length > 0 ? (
            <div className="text-sm text-blue-600 font-medium">
              <div className="flex items-center space-x-1 mb-1">
                <span>🔧</span>
                <span>Services:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                {shop.serviceDetails.slice(0, 3).map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
                {shop.serviceDetails.length > 3 && (
                  <li className="text-blue-600">+{shop.serviceDetails.length - 3} more services</li>
                )}
              </ul>
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
            onClick={handleVisitShop}
            disabled={!shopStatus.isOpen}
            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
              shopStatus.isOpen
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Zap size={14} />
            <span>{shopStatus.isOpen ? 'Visit' : 'Closed'}</span>
          </button>
          <button
            onClick={handleAddToBag}
            disabled={!shopStatus.isOpen}
            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
              shopStatus.isOpen
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={14} />
            <span>{shopStatus.isOpen ? 'Add to Bag' : 'Closed'}</span>
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
    </>
  );
};

export default ShopCard;