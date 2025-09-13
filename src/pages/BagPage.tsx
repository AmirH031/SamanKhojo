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
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';
import ProfileSetupModal from '../components/ProfileSetupModal';

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
  const navigate = useNavigate();
  const { user, profile, needsProfileSetup } = useAuth();

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

    setProcessing(true);
    try {
      const response = await fetch('/api/bag/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userPhone: profile?.phoneNumber,
          userName: profile?.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm booking');
      }

      const data = await response.json();
      setWhatsappLinks(data.links);
      setShowConfirmation(true);
      
      // Clear local state
      setBagItems([]);
      setShopGroups([]);
      
      toast.success(`Booking confirmed! WhatsApp links generated for ${data.totalShops} shops.`);
      
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking. Please try again.');
    } finally {
      setProcessing(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shopping Bag
          </h1>
          <p className="text-gray-600">
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
          <div className="space-y-6">
            {/* Bag Items by Shop */}
            {shopGroups.map((shopGroup) => (
              <motion.div
                key={shopGroup.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
              >
                {/* Shop Header */}
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{shopGroup.shopName}</h3>
                    <p className="text-sm text-gray-600">{shopGroup.items.length} items</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {shopGroup.items.map((item) => (
                    <motion.div
                      key={item.itemId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* Item Icon */}
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Package size={20} className="text-gray-400" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                        {item.price && (
                          <p className="text-sm font-medium text-green-600">₹{item.price}</p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.itemId, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.itemId, item.quantity + 1)}
                          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                        
                        <span className="text-sm text-gray-500 ml-2">
                          {item.unit}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to Book?</h3>
                  <p className="text-gray-600">
                    {totalItems} items from {totalShops} shops
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MessageCircle size={24} />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                WhatsApp messages will be generated for each shop
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Confirmation Modal with WhatsApp Links */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Booking Confirmed!
                </h3>
                <p className="text-gray-600">
                  Your booking has been prepared. Click the buttons below to message each shop on WhatsApp.
                </p>
              </div>

              <div className="space-y-4">
                {whatsappLinks.map((link, index) => (
                  <motion.div
                    key={link.shopId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Store className="text-green-600" size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{link.shopName}</h4>
                          <p className="text-sm text-gray-600">
                            {link.totalQuantity} items • {link.shopPhone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <a
                        href={link.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors font-medium"
                      >
                        <MessageCircle size={18} />
                        <span>Message on WhatsApp</span>
                        <ExternalLink size={14} />
                      </a>
                      
                      <button
                        onClick={() => handleCopyMessage(link)}
                        className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                        title="Copy message"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    navigate('/');
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 text-center">
                  💡 <strong>Tip:</strong> Shop owners will confirm availability and pricing via WhatsApp. 
                  You can coordinate pickup details directly with them.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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

export default BagPage;