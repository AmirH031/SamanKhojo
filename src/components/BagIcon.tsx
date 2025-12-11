import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiConfig } from '../config/app';

interface BagIconProps {
  className?: string;
  showLabel?: boolean;
}

const BagIcon: React.FC<BagIconProps> = ({ className = "", showLabel = false }) => {
  const [bagCount, setBagCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBagCount();
      
      // Refresh bag count every 30 seconds
      const interval = setInterval(fetchBagCount, 30000);
      return () => clearInterval(interval);
    } else {
      setBagCount(0);
    }
  }, [user]);

  const fetchBagCount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.baseUrl}/bag/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBagCount(data.bag.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching bag count:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/bag');
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <div className="relative">
        <ShoppingBag size={20} className="text-gray-600" />
        
        {/* Badge */}
        <AnimatePresence>
          {bagCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg"
            >
              {bagCount > 99 ? '99+' : bagCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          Bag {bagCount > 0 && `(${bagCount})`}
        </span>
      )}
    </motion.button>
  );
};

export default BagIcon;