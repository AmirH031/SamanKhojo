import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  delay?: number;
}

const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = false,
  gradient = false,
  onClick,
  delay = 0
}) => {
  const baseClasses = "relative overflow-hidden rounded-3xl shadow-lg border border-white/30 transition-all duration-500";
  const hoverClasses = hover ? "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]" : "";
  const glowClasses = glow ? "animate-glow" : "";
  const gradientClasses = gradient ? "bg-gradient-to-br from-white/90 via-white/80 to-white/70" : "bg-white/80";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        type: "spring", 
        bounce: 0.3,
        duration: 0.6
      }}
      whileHover={hover ? { y: -8, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        ${baseClasses} 
        ${hoverClasses} 
        ${glowClasses} 
        ${gradientClasses}
        ${clickableClasses}
        ${className}
        backdrop-blur-xl
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-50"></div>
      
      {/* Floating Orbs */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
};

export default ModernCard;