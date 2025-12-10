import React from 'react';
import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';

interface CategoryInfo {
  name: string;
  items: any[];
  icon: string;
  count: number;
}

interface CategoryCardProps {
  category: CategoryInfo;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  index, 
  isSelected, 
  onClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer group ${
        isSelected ? 'z-10' : ''
      }`}
    >
      {/* Main Card */}
      <div className={`
        relative bg-gradient-to-br from-blue-50 to-indigo-100 
        rounded-2xl p-4 border-2 transition-all duration-300
        ${isSelected 
          ? 'border-blue-500 shadow-xl bg-gradient-to-br from-blue-100 to-indigo-200' 
          : 'border-white/50 hover:border-blue-300 shadow-lg hover:shadow-xl'
        }
      `}>
        {/* Folder Tab Effect */}
        <div className={`
          absolute -top-2 left-4 px-3 py-1 rounded-t-lg text-xs font-medium
          ${isSelected 
            ? 'bg-blue-500 text-white' 
            : 'bg-white/80 text-gray-600 group-hover:bg-blue-100'
          }
        `}>
          Folder
        </div>

        {/* Icon Section */}
        <div className="flex items-center justify-center mb-3">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${isSelected 
              ? 'bg-white/90 shadow-md' 
              : 'bg-white/70 group-hover:bg-white/90'
            }
          `}>
            {category.icon}
          </div>
        </div>

        {/* Category Info */}
        <div className="text-center">
          <h3 className={`
            font-semibold text-sm mb-1 capitalize
            ${isSelected ? 'text-blue-900' : 'text-gray-800'}
          `}>
            {category.name}
          </h3>
          
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
            <Package size={12} />
            <span>{category.count} items</span>
          </div>
        </div>

        {/* Expand Indicator */}
        <motion.div
          animate={{ rotate: isSelected ? 90 : 0 }}
          className="absolute top-2 right-2"
        >
          <ChevronRight 
            size={16} 
            className={isSelected ? 'text-blue-600' : 'text-gray-400'} 
          />
        </motion.div>

        {/* Selection Glow Effect */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30"
          />
        )}
      </div>

      {/* Folder Shadow Effect */}
      <div className={`
        absolute inset-0 rounded-2xl -z-10 transform translate-y-1 translate-x-1
        ${isSelected 
          ? 'bg-blue-200/50' 
          : 'bg-gray-200/30 group-hover:bg-blue-200/40'
        }
      `} />
    </motion.div>
  );
};

export default CategoryCard;