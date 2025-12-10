import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  MessageCircle, 
  ExternalLink,
  CheckCircle,
  Award,
  Shield,
  ArrowLeft,
  Calendar,
  Wrench,
  Plus
} from 'lucide-react';
import { Shop, ServiceDetails } from '../services/firestoreService';
import { formatTime, getShopStatus } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { addToBag } from '../services/bagService';
import { toast } from 'react-toastify';
import ComingSoonModal from './ComingSoonModal';

interface ServicePosterProps {
  shop: Shop;
}

const ServicePoster: React.FC<ServicePosterProps> = ({ shop }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shopStatus = getShopStatus(shop.openingTime || '', shop.closingTime || '');
  const [showComingSoon, setShowComingSoon] = React.useState(false);

  const generateWhatsAppLink = () => {
    const serviceName = shop.serviceDetails?.serviceName || 'your services';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString();
    
    const message = `Hi ${shop.shopName}, I want to book ${serviceName} on ${dateStr}. Please confirm availability and pricing. - From SamanKhojo`;
    return `https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const handleBookService = async (serviceName?: string) => {
    if (!user) {
      toast.error('Please login to book services');
      return;
    }

    try {
      await addToBag({
        itemId: `service-${shop.id}-${serviceName || 'general'}`,
        itemName: serviceName || `Service from ${shop.shopName}`,
        shopId: shop.id,
        shopName: shop.shopName,
        quantity: 1,
        unit: 'appointment'
      });
      toast.success(`${serviceName || 'Service'} added to bag for booking!`);
    } catch (error) {
      console.error('Error adding service to bag:', error);
      toast.error('Failed to add service to bag');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 mobile-safe-area">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 bg-white/90 backdrop-blur-md text-gray-900 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-all"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </motion.button>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-64 sm:h-80 overflow-hidden">
          <img
            src={shop.imageUrl || "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"}
            alt={shop.shopName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>

        {/* Service Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl">
                🔧
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{shop.shopName}</h1>
                <p className="text-purple-200 text-sm sm:text-base md:text-lg">Professional Services</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Clock size={14} className="sm:w-4 sm:h-4" />
                <span className={shopStatus.isOpen ? 'text-green-200' : 'text-red-200'}>
                  {shopStatus.status}
                </span>
              </div>
              {shop.averageRating && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Star size={14} className="sm:w-4 sm:h-4 fill-current text-yellow-400" />
                  <span>{shop.averageRating} Rating</span>
                </div>
              )}
              {shop.isVerified && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Shield size={14} className="sm:w-4 sm:h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Service Details Poster */}
      <div className="px-3 sm:px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Service Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/50">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Our Services</h2>
              <p className="text-sm sm:text-base text-gray-600">Professional quality services you can trust</p>
            </div>

            {/* Service Details Grid */}
            {shop.serviceDetails ? (
              <div className="space-y-6 mb-6 sm:mb-8">
                {/* Service Header */}
                {shop.serviceDetails.serviceName && (
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      {shop.serviceDetails.serviceName}
                    </h3>
                    {shop.serviceDetails.serviceCategory && (
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {shop.serviceDetails.serviceCategory}
                      </span>
                    )}
                  </div>
                )}

                {/* Service Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shop.serviceDetails.duration && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">⏱️</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Duration</h4>
                      </div>
                      <p className="text-gray-700">{shop.serviceDetails.duration}</p>
                    </div>
                  )}

                  {shop.serviceDetails.priceRange && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">💰</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Price Range</h4>
                      </div>
                      <p className="text-gray-700">{shop.serviceDetails.priceRange}</p>
                    </div>
                  )}
                </div>

                {/* Service Description */}
                {shop.serviceDetails.description && shop.serviceDetails.description.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Service Details</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {shop.serviceDetails.description.map((desc, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex items-start space-x-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg flex-shrink-0">
                            {getServiceIcon(desc)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 leading-relaxed text-sm">{desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Features */}
                {shop.serviceDetails.features && shop.serviceDetails.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shop.serviceDetails.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                          <span className="text-green-500">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {shop.serviceDetails.availability && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Availability</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {shop.serviceDetails.availability.days && shop.serviceDetails.availability.days.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Available Days:</p>
                          <p className="text-sm text-gray-600">{shop.serviceDetails.availability.days.join(', ')}</p>
                        </div>
                      )}
                      {shop.serviceDetails.availability.timeSlots && shop.serviceDetails.availability.timeSlots.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Time Slots:</p>
                          <p className="text-sm text-gray-600">{shop.serviceDetails.availability.timeSlots.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl sm:text-3xl">🔧</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Professional Services Available</h3>
                <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base px-4">
                  Contact us directly to learn about our full range of professional services and get personalized assistance.
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 text-center text-sm sm:text-base">Get in Touch</h3>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Call Us</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{shop.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="sm:w-[18px] sm:h-[18px] text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Visit Us</p>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{shop.address}</p>
                  </div>
                </div>

                {shop.openingTime && shop.closingTime && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Business Hours</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleBookService(shop.serviceDetails?.serviceName)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all font-medium shadow-lg text-sm sm:text-base"
                >
                  <Plus size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Add to Bag</span>
                  <span className="xs:hidden">Add</span>
                </button>
                <button
                  onClick={() => setShowComingSoon(true)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-lg text-sm sm:text-base"
                >
                  <Calendar size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Book Now</span>
                  <span className="xs:hidden">Book</span>
                </button>
                
                <a
                  href={shop.mapLink || `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg text-sm sm:text-base"
                >
                  <ExternalLink size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Get Directions</span>
                  <span className="xs:hidden">Directions</span>
                </a>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
              <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-200">
                <CheckCircle size={20} className="sm:w-6 sm:h-6 text-green-600 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-green-800">Verified Service</p>
              </div>
              <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                <Wrench size={20} className="sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-blue-800">Professional</p>
              </div>
              <div className="text-center p-2 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-200">
                <Calendar size={20} className="sm:w-6 sm:h-6 text-purple-600 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-purple-800">Easy Booking</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        type="service"
      />
    </div>
  );
};

export default ServicePoster;