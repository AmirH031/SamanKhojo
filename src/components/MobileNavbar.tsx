import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Store, ShoppingBag, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBagCount } from '../services/bagService';
const MobileNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [bagCount, setBagCount] = useState(0);

  useEffect(() => {
    const fetchBagCount = async () => {
      if (!user) {
        setBagCount(0);
        return;
      }

      try {
        const count = await getBagCount();
        setBagCount(count);
      } catch (error) {
        console.error('Error fetching bag count:', error);
      }
    };

    fetchBagCount();

    // Refresh bag count every 30 seconds
    const interval = setInterval(fetchBagCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems: Array<{
    icon: any;
    label: string;
    path?: string;
    action?: () => void;
    color: string;
    badge?: number;
  }> = [
      {
        icon: Home,
        label: 'Home',
        path: '/',
        color: 'text-blue-600'
      },
      {
        icon: Store,
        label: 'Shops',
        path: '/shops',
        color: 'text-green-600'
      },
      {
        icon: ShoppingBag,
        label: 'Bag',
        path: '/bag',
        color: 'text-purple-600',
        badge: bagCount > 0 ? bagCount : undefined
      },
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        color: 'text-gray-600'
      },
    ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-200/30 z-50 md:hidden shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <motion.button
            key={item.path || item.label}
            onClick={() => item.path ? navigate(item.path) : item.action?.()}
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all ${isActive(item.path)
              ? `${item.color} bg-gradient-to-t from-blue-50 to-blue-100 shadow-lg`
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            <div className="relative">
              <item.icon size={20} />
              {item.badge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </motion.div>
              )}
            </div>
            <span className="text-xs font-medium mt-1">{item.label}</span>

            {isActive(item.path) && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"
              />
            )}
          </motion.button>
        ))}
      </div>

    </motion.div>
  );
};

export default MobileNavbar;