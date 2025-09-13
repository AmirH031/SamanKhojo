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
  TrendingUp,
  Shield,
  Award,
  Zap
} from 'lucide-react';
import { SearchResult } from '../../services/enhancedSearchService';

interface EnhancedSearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onItemClick?: (result: SearchResult) => void;
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  results,
  loading,
  query,
  onItemClick
}) => {
  const navigate = useNavigate();

  const handleItemClick = (result: SearchResult) => {
    if (onItemClick) {
      onItemClick(result);
    } else {
      // Navigate to shop details page
      navigate(`/shop/${result.shop.id}`);
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any items matching "{query}". Try adjusting your search terms.
          </p>
          <div className="text-sm text-gray-500">
            <p>Try searching for:</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {['rice', 'flour', 'oil', 'vegetables', 'medicine'].map((suggestion) => (
                <span key={suggestion} className="bg-gray-100 px-3 py-1 rounded-full">
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const typeIcons = {
    product: '📦',
    menu: '🍽️',
    service: '🔧'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Found {results.length} items for "{query}"
        </p>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {Object.entries(groupedResults).map(([type, items]) => (
            <span key={type} className="flex items-center space-x-1">
              <span>{typeIcons[type as keyof typeof typeIcons]}</span>
              <span>{items.length} {typeLabels[type as keyof typeof typeLabels]}</span>
            </span>
          ))}
        </div>
      </div>

      {Object.entries(groupedResults).map(([type, typeResults]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
            <span className="text-lg">{typeIcons[type as keyof typeof typeIcons]}</span>
            <h3 className="font-semibold text-gray-900">{typeLabels[type as keyof typeof typeLabels]}</h3>
            <span className="text-sm text-gray-500">({typeResults.length})</span>
          </div>
          
          {typeResults.map((result, index) => (
        <motion.div
          key={`${result.item.id}-${result.shop.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleItemClick(result)}
          className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex space-x-4">
            {/* Item Image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden">
                {result.item.imageUrl ? (
                  <img
                    src={result.item.imageUrl}
                    alt={result.item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl">
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
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {result.item.name || (result.item.type === 'service' && result.item.highlights && result.item.highlights.length > 0 
                      ? result.item.highlights[0] 
                      : 'Service Available')}
                    {result.item.hindi_name && (
                      <span className="text-sm text-gray-500 ml-2">({result.item.hindi_name})</span>
                    )}
                  </h3>
                  
                  {/* Match Type Badge */}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getMatchTypeColor(result.matchType)}`}>
                    {result.matchType === 'name' ? 'Name Match' :
                     result.matchType === 'brand' ? 'Brand Match' :
                     result.matchType === 'category' ? 'Category Match' :
                     result.matchType === 'tags' ? 'Tag Match' : 'Description Match'}
                  </span>
                </div>

                {/* Price */}
                {result.priceInfo && (
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(result.priceInfo.current)}
                      </span>
                      {result.priceInfo.hasDiscount && result.priceInfo.original && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(result.priceInfo.original)}
                        </span>
                      )}
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
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {result.item.description}
                </p>
              )}

              {/* Service Highlights */}
              {result.item.type === 'service' && result.item.highlights && result.item.highlights.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-700 mb-1">Service Highlights:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.item.highlights.slice(0, 3).map((highlight, idx) => (
                      <li key={idx} className="flex items-center space-x-1">
                        <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Item Details */}
              <div className="flex flex-wrap gap-2 mb-3">
                {result.item.brand_name && (
                  <span className="inline-flex items-center space-x-1 text-xs text-gray-600">
                    <Tag size={12} />
                    <span>{result.item.brand_name}</span>
                  </span>
                )}
                {result.item.category && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {result.item.category}
                  </span>
                )}
                {result.item.variety && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    {result.item.variety}
                  </span>
                )}
                {result.item.unit && (
                  <span className="text-xs text-gray-600">
                    per {result.item.unit}
                  </span>
                )}
              </div>

              {/* Attractive Features */}
              {result.attractiveFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {result.attractiveFeatures.map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      <Zap size={10} />
                      <span>{feature}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Shop Information */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs">🏪</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {result.shop.shopName}
                      </span>
                    </div>
                    
                    {result.shop.isVerified && (
                      <Shield size={14} className="text-blue-600" title="Verified Shop" />
                    )}
                    {result.shop.isFeatured && (
                      <Award size={14} className="text-orange-600" title="Featured Shop" />
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {result.shop.averageRating && (
                      <div className="flex items-center space-x-1">
                        <Star size={12} className="text-yellow-500 fill-current" />
                        <span>{result.shop.averageRating}</span>
                      </div>
                    )}
                    
                    {result.shop.distance && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{result.shop.distance.toFixed(1)} km</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <Clock size={12} />
                      <span className={result.shop.isOpen ? 'text-green-600' : 'text-red-600'}>
                        {result.shop.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shop Address */}
                <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                  <MapPin size={10} />
                  <span className="truncate">{result.shop.address}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/shop/${result.shop.id}`);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    View Shop
                  </button>
                  
                  {result.shop.phone && (
                    <a
                      href={`tel:${result.shop.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors flex items-center space-x-1"
                    >
                      <Phone size={10} />
                      <span>Call</span>
                    </a>
                  )}

                  {/* Add to Bag Button */}
                  {(result.item.type === 'product' || result.item.type === 'menu') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to bag logic here
                        console.log('Add to bag:', result.item);
                      }}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors flex items-center space-x-1"
                    >
                      <ShoppingCart size={10} />
                      <span>Add to Bag</span>
                    </button>
                  )}

                  {/* Contact Service Button */}
                  {result.item.type === 'service' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Contact service logic here
                        console.log('Contact service:', result.item);
                      }}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors flex items-center space-x-1"
                    >
                      <Clock size={10} />
                      <span>Contact Service</span>
                    </button>
                  )}
                </div>

                {/* Stock/Availability Status */}
                <div className="text-xs">
                  {result.item.type === 'product' && result.item.inStock !== undefined && (
                    <span className={`px-2 py-1 rounded-full ${
                      result.item.inStock > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.item.inStock > 0 ? `${result.item.inStock} in stock` : 'Out of stock'}
                    </span>
                  )}
                  {result.item.type === 'menu' && (
                    <span className={`px-2 py-1 rounded-full ${
                      result.item.availability 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.item.availability ? 'Available' : 'Not available'}
                    </span>
                  )}
                  {result.item.type === 'service' && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Service Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EnhancedSearchResults;