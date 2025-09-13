import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  MessageCircle, 
  ExternalLink,
  CheckCircle,
  Award,
  Shield
} from 'lucide-react';
import { Shop } from '../services/firestoreService';
import { formatTime, getShopStatus } from '../utils';

interface ServicePosterProps {
  shop: Shop;
}

const ServicePoster: React.FC<ServicePosterProps> = ({ shop }) => {
  const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');

  const generateWhatsAppLink = () => {
    const message = `Hi ${shop.shopName}, I'm interested in your services. Can you please share more details? - From SamanKhojo`;
    return `https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getServiceIcon = (detail: string): string => {
    const lowerDetail = detail.toLowerCase();
    if (lowerDetail.includes('hair') || lowerDetail.includes('cut')) return '✂️';
    if (lowerDetail.includes('massage') || lowerDetail.includes('spa')) return '💆';
    if (lowerDetail.includes('repair') || lowerDetail.includes('fix')) return '🔧';
    if (lowerDetail.includes('clean')) return '🧽';
    if (lowerDetail.includes('beauty') || lowerDetail.includes('facial')) return '💄';
    if (lowerDetail.includes('mobile') || lowerDetail.includes('phone')) return '📱';
    if (lowerDetail.includes('computer') || lowerDetail.includes('laptop')) return '💻';
    if (lowerDetail.includes('delivery') || lowerDetail.includes('transport')) return '🚚';
    if (lowerDetail.includes('tutor') || lowerDetail.includes('teach')) return '📚';
    if (lowerDetail.includes('doctor') || lowerDetail.includes('medical')) return '👨‍⚕️';
    return '🔧';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-80 overflow-hidden">
          <img
            src={shop.imageUrl || "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"}
            alt={shop.shopName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>

        {/* Service Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">
                🔧
              </div>
              <div>
                <h1 className="text-3xl font-bold">{shop.shopName}</h1>
                <p className="text-purple-200 text-lg">Professional Services</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span className={shopStatus.isOpen ? 'text-green-200' : 'text-red-200'}>
                  {shopStatus.status}
                </span>
              </div>
              {shop.averageRating && (
                <div className="flex items-center space-x-2">
                  <Star size={16} className="fill-current text-yellow-400" />
                  <span>{shop.averageRating} Rating</span>
                </div>
              )}
              {shop.isVerified && (
                <div className="flex items-center space-x-2">
                  <Shield size={16} />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Service Details Poster */}
      <div className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Service Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Services</h2>
              <p className="text-gray-600">Professional quality services you can trust</p>
            </div>

            {/* Service Details Grid */}
            {shop.serviceDetails && shop.serviceDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {shop.serviceDetails.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start space-x-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                      {getServiceIcon(detail)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Service {index + 1}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Services Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Contact us directly to learn about our full range of professional services and get personalized assistance.
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">Get in Touch</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Call Us</p>
                    <p className="text-sm text-gray-600">{shop.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Visit Us</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{shop.address}</p>
                  </div>
                </div>

                {shop.openingTime && shop.closingTime && (
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock size={18} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Business Hours</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <a
                  href={generateWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-lg"
                >
                  <MessageCircle size={20} />
                  <span>Contact via WhatsApp</span>
                </a>
                
                <a
                  href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg"
                >
                  <ExternalLink size={20} />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">Verified Service</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Award size={24} className="text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-800">Quality Assured</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Star size={24} className="text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-800">Customer Rated</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicePoster;