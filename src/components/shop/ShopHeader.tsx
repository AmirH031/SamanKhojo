import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, ExternalLink, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shop } from '../../services/firestoreService';
import { formatTime, getShopStatus } from '../../utils';

interface ShopHeaderProps {
  shop: Shop;
}

const ShopHeader: React.FC<ShopHeaderProps> = ({ shop }) => {
  const navigate = useNavigate();
  
  // Calculate average rating
  const avgRating = shop.ratings && shop.ratings.length > 0 
    ? Math.round((shop.ratings.reduce((sum, r) => sum + r, 0) / shop.ratings.length) * 10) / 10
    : 0;

  const getShopImage = () => {
    return shop.imageUrl || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800";
  };

  const shopStatus = getShopStatus(shop.openingTime, shop.closingTime);

  const handleContact = () => {
    const whatsappUrl = `https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hi, I found your shop on SamanKhojo. I'm interested in your products.`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={getShopImage()}
          alt={shop.shopName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {shop.isVerified && (
            <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <CheckCircle size={14} />
              <span>Verified</span>
            </div>
          )}
          {shop.isFeatured && (
            <div className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
          )}
          <div className={`backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
            shop.isOpen 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
          }`}>
            <Clock size={14} />
            <span>{shop.isOpen ? 'Open' : 'Closed'}</span>
          </div>
        </div>

        {/* Rating Badge */}
        {avgRating > 0 && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="text-sm font-medium text-gray-900">{avgRating}</span>
            <span className="text-xs text-gray-600">({shop.ratings ? shop.ratings.length : 0})</span>
          </div>
        )}
      </div>

      {/* Shop Info Card */}
      <div className="relative -mt-8 mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl"
        >
          {/* Shop Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {shop.shopName}
          </h1>
          
          {/* Owner Info */}
          {shop.ownerName && (
            <p className="text-gray-600 mb-4">
              Owner: <span className="font-medium text-gray-900">{shop.ownerName}</span>
            </p>
          )}

          {/* Shop Hours */}
          {shop.openingTime && shop.closingTime && (
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <span className="text-lg">🕘</span>
              <div>
                <span className="font-medium">{shopStatus.status}</span>
                <span className="text-sm block">
                  {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}
                </span>
              </div>
            </div>
          )}
          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-gray-600">
              <Phone size={18} className="text-blue-500" />
              <a 
                href={`tel:${shop.phone}`}
                className="hover:text-blue-600 transition-colors"
              >
                {shop.phone}
              </a>
            </div>
            
            <div className="flex items-start space-x-3 text-gray-600">
              <MapPin size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{shop.address}</span>
                {typeof shop.distance === 'number' && (
                  <span className="text-blue-600 font-medium block text-sm">
                    {shop.distance < 1 ? `${Math.round(shop.distance * 1000)}m away` : `${shop.distance.toFixed(1)}km away`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleContact}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium"
            >
              <MessageCircle size={18} />
              <span>Contact</span>
            </button>
            
            <a
              href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
            >
              <ExternalLink size={18} />
              <span>Map</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ShopHeader;