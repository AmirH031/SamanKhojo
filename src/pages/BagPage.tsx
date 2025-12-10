import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Store, 
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Package,
  Copy,
  ExternalLink,
  Calendar,
  Wrench,
  Utensils
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import ProfileSetupModal from '../components/ProfileSetupModal';
import ComingSoonModal from '../components/ComingSoonModal';

interface BagItem {
  itemId: string;
  itemName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  unit: string;
  price?: number;
  addedAt: string;
}

interface ShopGroup {
  shopId: string;
  shopName: string;
  items: BagItem[];
}

interface WhatsAppLink {
  shopId: string;
  shopName: string;
  shopPhone: string;
  whatsappLink: string;
  itemCount: number;
  totalQuantity: number;
}

const BagPage: React.FC = () => {
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [shopGroups, setShopGroups] = useState<ShopGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLink[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const navigate = useNavigate();
  const { user, profile, needsProfileSetup } = useAuth();

  const getItemTypeIcon = (unit: string) => {
    if (unit === 'appointment') return <Calendar size={16} className="text-purple-600" />;
    if (unit === 'plate' || unit === 'bowl' || unit === 'glass') return <Utensils size={16} className="text-orange-600" />;
    return <Package size={16} className="text-blue-600" />;
  };

  const getItemTypeColor = (unit: string) => {
    if (unit === 'appointment') return 'from-purple-500 to-violet-600';
    if (unit === 'plate' || unit === 'bowl' || unit === 'glass') return 'from-orange-500 to-red-600';
    return 'from-blue-500 to-cyan-600';
  };
  useEffect(() => {
    if (user) {
      fetchBagItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBagItems = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/bag/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bag items');
      }

      const data = await response.json();
      setBagItems(data.bag.items || []);
      setShopGroups(data.bag.shopGroups || []);
    } catch (error) {
      console.error('Error fetching bag items:', error);
      toast.error('Failed to load bag items');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const response = await fetch(`/api/bag/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user!.getIdToken()}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // Update local state
      setBagItems(prev => 
        prev.map(item => 
          item.itemId === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      // Update shop groups
      setShopGroups(prev => 
        prev.map(group => ({
          ...group,
          items: group.items.map(item => 
            item.itemId === itemId ? { ...item, quantity: newQuantity } : item
          )
        }))
      );

    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/bag/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user!.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Update local state
      setBagItems(prev => prev.filter(item => item.itemId !== itemId));
      
      // Update shop groups
      setShopGroups(prev => 
        prev.map(group => ({
          ...group,
          items: group.items.filter(item => item.itemId !== itemId)
        })).filter(group => group.items.length > 0)
      );

      toast.success('Item removed from bag');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (needsProfileSetup) {
      setShowProfileSetup(true);
      return;
    }
    
    if (bagItems.length === 0) {
      toast.error('Your bag is empty');
      return;
    }

    // Show coming soon modal instead of WhatsApp booking
    setShowComingSoon(true);
  };

  const handleCopyMessage = async (link: WhatsAppLink) => {
    try {
      // Extract message from WhatsApp link
      const url = new URL(link.whatsappLink);
      const message = url.searchParams.get('text') || '';
      
      await navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard!');
    } catch (error) {
      console.error('Error copying message:', error);
      toast.error('Failed to copy message');
    }
  };

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalShops = shopGroups.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your bag</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
        </motion.div>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            fetchBagItems();
          }}
        />
      </div>
    );
  }

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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Bag</h2>
            <p className="text-gray-600">Please wait while we fetch your items...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-3 sm:mb-4 transition-colors text-base sm:text-lg"
            style={{ minHeight: 40 }}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Shopping Bag
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {totalItems} items from {totalShops} shops
          </p>
        </motion.div>

        {bagItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-lg">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your bag is empty</h2>
              <p className="text-gray-600 mb-6">
                Start shopping to add items to your bag
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-medium"
              >
                Start Shopping
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Bag Items by Shop */}
            {shopGroups.map((shopGroup) => (
              <motion.div
                key={shopGroup.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-6 border border-white/20 shadow-lg"
              >
                {/* Shop Header */}
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{shopGroup.shopName}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{shopGroup.items.length} items</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 sm:space-y-4">
                  {shopGroup.items.map((item) => (
                    <motion.div
                      key={item.itemId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col xs:flex-row items-start xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Item Icon */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getItemTypeColor(item.unit)} rounded-lg flex items-center justify-center shadow-sm text-white mb-1 xs:mb-0`}>
                        {getItemTypeIcon(item.unit)}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.itemName}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.unit === 'appointment' ? 'bg-purple-100 text-purple-800' :
                            item.unit === 'plate' || item.unit === 'bowl' || item.unit === 'glass' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.unit === 'appointment' ? 'Service Booking' :
                             item.unit === 'plate' || item.unit === 'bowl' || item.unit === 'glass' ? 'Food Order' :
                             'Product Item'}
                          </span>
                        </div>
                        {item.price && (
                          <p className="text-xs sm:text-sm font-medium text-green-600">₹{item.price}</p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 sm:space-x-3 mt-2 xs:mt-0">
                        {item.unit !== 'appointment' && (
                          <>
                        <button
                          onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors text-base"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 sm:w-8 text-center font-medium text-base">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors text-base"
                        >
                          <Plus size={14} />
                        </button>
                        <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                          {item.unit}
                        </span>
                          </>
                        )}
                        {item.unit === 'appointment' && (
                          <div className="text-center">
                            <span className="text-base sm:text-lg font-bold text-purple-600">{item.quantity}</span>
                            <p className="text-xs text-purple-600 font-medium">Appointment{item.quantity > 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto mt-2 xs:mt-0"
                        style={{ minWidth: 36, minHeight: 36 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Confirm Booking Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-1 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ready to Book?</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {totalItems} {bagItems.some(item => item.unit === 'appointment') ? 'items & services' : 'items'} from {totalShops} shops
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={processing}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-2xl font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-white ${
                  bagItems.some(item => item.unit === 'appointment')
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                    : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
                }`}
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    {bagItems.some(item => item.unit === 'appointment') ? (
                      <>
                        <Calendar size={22} className="sm:size-6" />
                        <span>Confirm Booking</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle size={22} className="sm:size-6" />
                        <span>Confirm Order</span>
                      </>
                    )}
                  </>
                )}
              </button>

              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800 text-center">
                  <span className="font-semibold">🚀 Coming Soon:</span> Direct online {bagItems.some(item => item.unit === 'appointment') ? 'booking' : 'ordering'} feature is under development!
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                Experience the future of {bagItems.some(item => item.unit === 'appointment') ? 'service booking' : 'shopping'} - no more WhatsApp needed!
              </p>
            </motion.div>
          </div>
        )}
      </div>


      
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
        type={bagItems.some(item => item.unit === 'appointment') ? 'service' : 'product'}
      />
    </div>
  );
};

export default BagPage;