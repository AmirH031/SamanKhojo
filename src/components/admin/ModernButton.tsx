import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ModernButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  gradient?: string;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  gradient
}) => {
  const variants = {
    primary: gradient || 'from-violet-500 to-purple-600',
    secondary: 'from-gray-500 to-gray-600',
    success: 'from-emerald-500 to-teal-600',
    warning: 'from-amber-500 to-orange-600',
    danger: 'from-red-500 to-pink-600',
    ghost: 'from-transparent to-transparent'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  const baseClasses = `
    relative overflow-hidden rounded-2xl font-semibold transition-all duration-300
    ${variant === 'ghost' 
      ? 'text-gray-700 hover:bg-gray-100 border border-gray-200' 
      : 'text-white shadow-lg hover:shadow-xl'
    }
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${sizes[size]}
  `;

  const gradientClass = variant !== 'ghost' ? `bg-gradient-to-r ${variants[variant]}` : '';

  return (
    <motion.button
      onClick={disabled || loading ? undefined : onClick}
      whileHover={disabled || loading ? {} : { scale: 1.05, y: -2 }}
      whileTap={disabled || loading ? {} : { scale: 0.95 }}
      className={`${baseClasses} ${gradientClass} ${className}`}
      disabled={disabled || loading}
    >
      {/* Glow Effect */}
      {variant !== 'ghost' && (
        <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]} blur-lg opacity-50 -z-10`}></div>
      )}
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center space-x-2">
        {Icon && iconPosition === 'left' && (
          <motion.div
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <Icon size={iconSizes[size]} />
          </motion.div>
        )}
        
        <span>{children}</span>
        
        {Icon && iconPosition === 'right' && (
          <motion.div
            animate={loading ? { rotate: 360 } : {}}
            transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <Icon size={iconSizes[size]} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default ModernButton;