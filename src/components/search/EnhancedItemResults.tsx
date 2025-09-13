import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Clock, 
  ShoppingCart, 
  Phone, 
  Tag,
  Shield,
  Award,
  Zap,
  Package,
  Utensils,
  Wrench
} from 'lucide-react';
import { SearchResult } from '../../services/enhancedSearchService';

interface EnhancedItemResultsProps {
  results: SearchResult[];
  query: string;
  onItemClick?: (result: SearchResult) => void;
}

const EnhancedItemResults: React.FC<EnhancedItemResultsProps> = ({
  results,
  query,
  onItemClick
}) => {
  const navigate = useNavigate();

  const handleItemClick = (result: SearchResult) => {
    if (onItemClick) {
      onItemClick(result);
    } else {
      navigate(`/shop/${result.shop.id}?item=${result.item.id}`);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getMatchTypeColor = (matchType: string): string => {
    switch (matchType) {
      case 'name': return 'bg-green-100 text-green-800';
      case 'brand': return 'bg-blue-100 text-blue-800';
      case 'category': return 'bg-purple-100 text-purple-800';
      case 'tags': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Package size={16} className="text-green-600" />;
      case 'menu': return <Utensils size={16} className="text-blue-600" />;
      case 'service': return <Wrench size={16} className="text-purple-600" />;
      default: return <Package size={16} className="text-gray-600" />;
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    const type = result.item.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    product: 'Products',
    menu: 'Menu Items',
    service: 'Services'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
            {getItemTypeIcon(type)}
            <h4 className="font-medium text-gray-900">{typeLabels[type as keyof typeof typeLabels]}</h4>
            <span className="text-sm text-gray-500">({typeResults.length})</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {typeResults.map((result, index) => (
              <motion.div
                key={`${result.item.id}-${result.shop.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleItemClick(result)}
                className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex space-x-3">
                  {/* Item Image/Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {result.item.imageUrl ? (
                        <img
                          src={result.item.imageUrl}
                          alt={result.item.name || 'Item'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xl">
                          {result.item.type === 'menu' ? '🍽️' : 
                           result.item.type === 'service' ? '🔧' : '📦'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                          {result.item.name || (result.item.type === 'service' && result.item.highlights && result.item.highlights.length > 0 
                            ? result.item.highlights[0] 
                            : 'Service Available')}
                        </h5>
                        
                        {/* Match Type Badge */}
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getMatchTypeColor(result.matchType)}`}>
                          {result.matchType === 'name' ? 'Name' :
                           result.matchType === 'brand' ? 'Brand' :
                           result.matchType === 'category' ? 'Category' :
                           result.matchType === 'tags' ? 'Tag' : 'Description'}
                        </span>
                      </div>

                      {/* Price */}
                      {result.priceInfo && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {formatPrice(result.priceInfo.current)}
                          </div>
                          {result.priceInfo.hasDiscount && result.priceInfo.discount && (
                            <span className="text-xs text-red-600 font-medium">
                              {result.priceInfo.discount}% OFF
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Item Description */}
                    {result.item.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {result.item.description}
                      </p>
                    )}

                    {/* Service Highlights */}
                    {result.item.type === 'service' && result.item.highlights && result.item.highlights.length > 0 && (
                      <div className="mb-2">
                        <ul className="text-xs text-gray-600 space-y-1">
                          {result.item.highlights.slice(0, 2).map((highlight, idx) => (
                            <li key={idx} className="flex items-center space-x-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {result.item.brand_name && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {result.item.brand_name}
                        </span>
                      )}
                      {result.item.category && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {result.item.category}
                        </span>
                      )}
                      {result.item.variety && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          {result.item.variety}
                        </span>
                      )}
                    </div>

                    {/* Attractive Features */}
                    {result.attractiveFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {result.attractiveFeatures.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            <Zap size={8} />
                            <span>{feature}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Shop Information */}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs">🏪</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {result.shop.shopName}
                          </span>
                          
                          {result.shop.isVerified && (
                            <Shield size={10} className="text-blue-600" title="Verified" />
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {result.shop.averageRating && (
                            <div className="flex items-center space-x-1">
                              <Star size={10} className="text-yellow-500 fill-current" />
                              <span>{result.shop.averageRating}</span>
                            </div>
                          )}
                          
                          {result.shop.distance && (
                            <div className="flex items-center space-x-1">
                              <MapPin size={10} />
                              <span>{result.shop.distance.toFixed(1)}km</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/shop/${result.shop.id}`);
                          }}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          View Shop
                        </button>

                        {/* Stock/Availability Status */}
                        <div className="text-xs">
                          {result.item.type === 'product' && result.item.inStock !== undefined && (
                            <span className={`px-2 py-1 rounded-full ${
                              result.item.inStock > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.item.inStock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          )}
                          {result.item.type === 'menu' && (
                            <span className={`px-2 py-1 rounded-full ${
                              result.item.availability 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.item.availability ? 'Available' : 'Not Available'}
                            </span>
                          )}
                          {result.item.type === 'service' && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedItemResults;