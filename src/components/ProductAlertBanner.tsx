import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Package, 
  ArrowRight, 
  Sparkles, 
  Clock,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface ProductAlert {
  id: string;
  productId: string;
  productName: string;
  shopName: string;
  shopId: string;
  originalSearchQuery: string;
  alertType: 'back_in_stock' | 'new_availability' | 'price_drop';
  createdAt: Date;
  triggeredAt: Date;
  priority: 'high' | 'medium' | 'low';
  price?: number;
  imageUrl?: string;
  shopAddress?: string;
}

interface ProductAlertBannerProps {
  className?: string;
  maxAlerts?: number;
}

const ProductAlertBanner: React.FC<ProductAlertBannerProps> = ({ 
  className = "", 
  maxAlerts = 3 
}) => {
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Product alerts temporarily disabled - will be enabled in future update
    setLoading(false);
    setAlerts([]);
  }, [user?.uid]);

  const fetchUserAlerts = async () => {
    // API calls temporarily disabled - will be enabled in future update
    console.log('Product alerts API temporarily disabled');
  };

  const dismissAlert = async (alertId: string) => {
    // Alert dismissal temporarily disabled - will be enabled in future update
    console.log('Alert dismissal temporarily disabled:', alertId);
  };

  const handleAlertClick = (alert: ProductAlert) => {
    // Navigate to search results for the original query
    navigate(`/search?q=${encodeURIComponent(alert.originalSearchQuery)}`);
    
    // Track interaction
    trackAlertInteraction(alert.id, 'clicked');
  };

  const handleShopClick = (alert: ProductAlert, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shop/${alert.shopId}`);
    trackAlertInteraction(alert.id, 'shop_visited');
  };

  const trackAlertInteraction = async (alertId: string, action: string) => {
    // Alert interaction tracking temporarily disabled - will be enabled in future update
    console.log('Alert interaction tracking temporarily disabled:', { alertId, action });
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'back_in_stock':
        return <Package className="text-green-600" size={20} />;
      case 'new_availability':
        return <Sparkles className="text-blue-600" size={20} />;
      case 'price_drop':
        return <ArrowRight className="text-orange-600 rotate-[-45deg]" size={20} />;
      default:
        return <Bell className="text-purple-600" size={20} />;
    }
  };

  const getAlertMessage = (alert: ProductAlert) => {
    switch (alert.alertType) {
      case 'back_in_stock':
        return `${alert.productName} is back in stock!`;
      case 'new_availability':
        return `${alert.productName} is now available!`;
      case 'price_drop':
        return `Price drop on ${alert.productName}!`;
      default:
        return `Update on ${alert.productName}`;
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'back_in_stock':
        return 'from-green-500 to-emerald-600';
      case 'new_availability':
        return 'from-blue-500 to-indigo-600';
      case 'price_drop':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-purple-500 to-violet-600';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || alerts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group cursor-pointer"
            onClick={() => handleAlertClick(alert)}
          >
            <div className={`relative bg-gradient-to-r ${getAlertColor(alert.alertType)} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Alert Icon */}
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    {getAlertIcon(alert.alertType)}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-bold text-lg truncate">
                        {getAlertMessage(alert)}
                      </h3>
                      {alert.priority === 'high' && (
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                          HOT
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-white/90 text-sm">
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>
                          {new Date(alert.triggeredAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </span>
                      
                      <button
                        onClick={(e) => handleShopClick(alert, e)}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        <span>at {alert.shopName}</span>
                        <ExternalLink size={12} />
                      </button>
                      
                      {alert.price && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          ₹{alert.price}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-white/80 text-xs">
                      Originally searched: "{alert.originalSearchQuery}"
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center space-x-2 shadow-lg"
                    >
                      <ShoppingCart size={16} />
                      <span>View Now</span>
                      <ArrowRight size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                  className="ml-4 p-2 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Pulse Animation for High Priority */}
              {alert.priority === 'high' && (
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  animate={{
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* View All Alerts Link */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/profile?tab=alerts')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center space-x-1 mx-auto"
          >
            <span>View all alerts</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProductAlertBanner;