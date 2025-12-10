import React from 'react';
import { motion } from 'framer-motion';
import { Package, Star, ShoppingCart, Heart } from 'lucide-react';
import { Item } from '../types/Item';

interface ItemCardProps {
  item: Item;
  onAddToBag?: (item: Item) => void;
  onToggleFavorite?: (item: Item) => void;
  className?: string;
  showRecommendationReason?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  onAddToBag, 
  onToggleFavorite, 
  className = '',
  showRecommendationReason = false
}) => {
  const renderPriceDisplay = () => {
    if (item.type === 'product' && item.priceRange && Array.isArray(item.priceRange)) {
      const [min, max] = item.priceRange;
      const packsCount = item.packs?.length || 1;
      
      if (packsCount === 1) {
        return (
          <div className="price-display text-sm text-gray-800 font-medium">
            ₹{min} (1 package size)
          </div>
        );
      } else {
        return (
          <div className="price-display text-sm text-gray-800 font-medium">
            ₹{min} - ₹{max} (Available in {packsCount} package sizes)
          </div>
        );
      }
    }
    
    // Fallback for legacy price display
    if (item.price) {
      return (
        <div className="price-display text-sm text-gray-800 font-medium">
          ₹{item.price}
        </div>
      );
    }
    
    return null;
  };

  const renderVarieties = () => {
    if (item.variety && Array.isArray(item.variety) && item.variety.length > 0) {
      return (
        <div className="variety-tags mt-1 text-xs text-gray-500">
          {item.variety.join(', ')}
        </div>
      );
    }
    
    // Fallback for legacy string variety
    if (item.variety && typeof item.variety === 'string') {
      return (
        <div className="variety-tags mt-1 text-xs text-gray-500">
          {item.variety}
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${className}`}
    >
      {/* Item Image */}
      <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-gray-400" />
          </div>
        )}
        
        {/* Availability Badge */}
        {item.availability === false && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Out of Stock
          </div>
        )}
        
        {/* Featured Badge */}
        {item.isFeatured && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
        
        {/* AI Recommendation Badge */}
        {(item as any).source === 'ai' && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            AI Pick
          </div>
        )}
        
        {/* Confidence Score for Recommendations */}
        {(item as any).confidence && (item as any).confidence > 0.8 && (
          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
            {Math.round((item as any).confidence * 100)}% Match
          </div>
        )}
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(item);
          }}
          className="absolute bottom-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors"
        >
          <Heart size={14} className="text-gray-600" />
        </button>
      </div>

      {/* Item Details */}
      <div className="p-3">
        {/* Item Name */}
        <div className="mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
            {item.name}
          </h3>
          {item.hindi_name && (
            <p className="text-xs text-gray-500 line-clamp-1">
              {item.hindi_name}
            </p>
          )}
        </div>

        {/* Brand Name */}
        {item.brand_name && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {item.brand_name}
          </div>
        )}

        {/* Price Display */}
        {renderPriceDisplay()}

        {/* Varieties */}
        {renderVarieties()}

        {/* Category */}
        {item.category && (
          <div className="text-xs text-gray-500 mt-1">
            {item.category}
          </div>
        )}

        {/* Stock Info for Products */}
        {item.type === 'product' && item.inStock !== undefined && (
          <div className="text-xs text-gray-500 mt-1">
            Stock: {item.inStock > 0 ? `${item.inStock} units` : 'Out of stock'}
          </div>
        )}

        {/* Rating */}
        {item.rating && (
          <div className="flex items-center space-x-1 mt-2">
            <Star size={12} className="fill-current text-yellow-500" />
            <span className="text-xs text-gray-600">{item.rating}</span>
            {item.reviewCount && (
              <span className="text-xs text-gray-500">({item.reviewCount})</span>
            )}
          </div>
        )}

        {/* Recommendation Reason */}
        {showRecommendationReason && (item as any).reason && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            <div className="flex items-start">
              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="line-clamp-2">{(item as any).reason}</span>
            </div>
          </div>
        )}

        {/* Stock Status */}
        {(item as any).stock !== undefined && (
          <div className="mt-2">
            {(item as any).stock === 0 ? (
              <div className="text-xs text-red-600 font-medium">Out of Stock</div>
            ) : (item as any).stock <= 10 ? (
              <div className="text-xs text-orange-600 font-medium">
                Only {(item as any).stock} left!
              </div>
            ) : (
              <div className="text-xs text-green-600 font-medium">In Stock</div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {item.isPopular && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Popular
              </span>
            )}
            {(item as any).source === 'trending' && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Trending
              </span>
            )}
            {item.deliveryTime && (
              <span className="text-xs text-gray-500">
                {item.deliveryTime}
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToBag?.(item);
            }}
            disabled={item.availability === false || (item as any).stock === 0}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ItemCard;