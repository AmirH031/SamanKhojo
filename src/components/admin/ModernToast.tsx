import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ModernToast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  onClose 
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: {
      bg: 'from-emerald-500 to-teal-600',
      icon: 'text-emerald-600',
      border: 'border-emerald-200'
    },
    error: {
      bg: 'from-red-500 to-pink-600',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    warning: {
      bg: 'from-amber-500 to-orange-600',
      icon: 'text-amber-600',
      border: 'border-amber-200'
    },
    info: {
      bg: 'from-blue-500 to-indigo-600',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    }
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className={`relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border ${colorScheme.border} p-4 max-w-sm w-full`}
    >
      {/* Gradient Border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.bg} opacity-5 rounded-2xl`}></div>
      
      <div className="relative z-10 flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-xl bg-gradient-to-r ${colorScheme.bg} bg-opacity-10`}>
          <Icon className={`${colorScheme.icon} w-5 h-5`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
          {message && (
            <p className="text-xs text-gray-600">{message}</p>
          )}
        </div>
        
        {/* Close Button */}
        <motion.button
          onClick={() => onClose(id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </motion.button>
      </div>
      
      {/* Progress Bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colorScheme.bg} rounded-full`}
        onAnimationComplete={() => onClose(id)}
      />
    </motion.div>
  );
};

export default ModernToast;