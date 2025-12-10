import React from 'react';
import { motion } from 'framer-motion';

interface ModernLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Animated Loader */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-violet-500 to-purple-600"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #8b5cf6, transparent)',
            borderRadius: '50%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner Ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-gradient-to-r from-indigo-500 to-blue-600"
          style={{
            background: 'conic-gradient(from 180deg, transparent, #6366f1, transparent)',
            borderRadius: '50%',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center Dot */}
        <motion.div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${dotSizes[size]} bg-gradient-to-r from-violet-500 to-purple-600 rounded-full`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>

      {/* Loading Text */}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-gray-600"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default ModernLoader;