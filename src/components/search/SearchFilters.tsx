import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  MapPin, 
  DollarSign, 
  Tag, 
  Store, 
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SearchFilters } from '../../services/enhancedSearchService';


interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: Array<{ id: string; name: string; count: number }>;
  onClose?: () => void;
}

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['price', 'category']));
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const clearFilters = () => {
    const cleared: SearchFilters = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = () => {
    return Object.keys(localFilters).some(key => {
      const value = localFilters[key as keyof SearchFilters];
      return value !== undefined && value !== null;
    });
  };

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: string;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {icon}
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <FilterSection
        title="Price Range"
        icon={<DollarSign size={18} className="text-green-600" />}
        sectionKey="price"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="₹0"
                value={localFilters.priceRange?.min || ''}
                onChange={(e) => {
                  const min = e.target.value ? parseFloat(e.target.value) : undefined;
                  updateFilters({
                    priceRange: {
                      min: min || 0,
                      max: localFilters.priceRange?.max || 10000
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="₹10000"
                value={localFilters.priceRange?.max || ''}
                onChange={(e) => {
                  const max = e.target.value ? parseFloat(e.target.value) : undefined;
                  updateFilters({
                    priceRange: {
                      min: localFilters.priceRange?.min || 0,
                      max: max || 10000
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          {/* Quick Price Ranges */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under ₹50', min: 0, max: 50 },
              { label: '₹50-₹200', min: 50, max: 200 },
              { label: '₹200-₹500', min: 200, max: 500 },
              { label: 'Above ₹500', min: 500, max: 10000 }
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => updateFilters({ priceRange: { min: range.min, max: range.max } })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  localFilters.priceRange?.min === range.min && localFilters.priceRange?.max === range.max
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Category Filter */}
      <FilterSection
        title="Categories"
        icon={<Tag size={18} className="text-purple-600" />}
        sectionKey="category"
      >
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={localFilters.category === category.name}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilters({ category: category.name });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex-1">{category.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {category.count}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Shop Type Filter */}
      <FilterSection
        title="Shop Types"
        icon={<Store size={18} className="text-blue-600" />}
        sectionKey="shopType"
      >
        <div className="space-y-2">
          {[
            { id: 'grocery', name: 'Grocery Store', icon: '🛒' },
            { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
            { id: 'cafe', name: 'Cafe', icon: '☕' },
            { id: 'hotel', name: 'Hotel', icon: '🏨' },
            { id: 'stationery', name: 'Stationery', icon: '📝' },
            { id: 'mobile', name: 'Mobile Shop', icon: '📱' },
            { id: 'clinic', name: 'Clinic', icon: '🏥' },
            { id: 'cosmetic', name: 'Cosmetic Store', icon: '💄' },
            { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
            { id: 'electronics', name: 'Electronics', icon: '📱' },
            { id: 'clothing', name: 'Clothing', icon: '👕' },
            { id: 'hardware', name: 'Hardware', icon: '🔧' },
            { id: 'bakery', name: 'Bakery', icon: '🍞' },
            { id: 'beauty salon', name: 'Beauty Salon', icon: '💇' },
            { id: 'barber shop', name: 'Barber Shop', icon: '✂️' },
            { id: 'spa', name: 'Spa', icon: '🧖' },
            { id: 'fitness', name: 'Fitness Center', icon: '💪' },
            { id: 'education', name: 'Education', icon: '📚' }
          ].map((shopType) => (
            <label key={shopType.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="shopType"
                checked={localFilters.shopType === shopType.id}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilters({ shopType: shopType.id });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-lg">{shopType.icon}</span>
              <span className="text-sm text-gray-700">{shopType.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability Filter */}
      <FilterSection
        title="Availability"
        icon={<Settings size={18} className="text-gray-600" />}
        sectionKey="availability"
      >
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={localFilters.availability === true}
              onChange={() => updateFilters({ availability: true })}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Available only</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={localFilters.availability === false}
              onChange={() => updateFilters({ availability: false })}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Include unavailable</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={localFilters.availability === undefined}
              onChange={() => updateFilters({ availability: undefined })}
              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">All items</span>
          </label>
        </div>
      </FilterSection>

      {/* Sort Options */}
      <FilterSection
        title="Sort By"
        icon={<Settings size={18} className="text-gray-600" />}
        sectionKey="sort"
      >
        <div className="space-y-2">
          {[
            { value: 'relevance', label: 'Relevance' },
            { value: 'price_low', label: 'Price: Low to High' },
            { value: 'price_high', label: 'Price: High to Low' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'popularity', label: 'Most Popular' },
            { value: 'distance', label: 'Nearest First' }
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="sortBy"
                checked={localFilters.sortBy === option.value}
                onChange={() => updateFilters({ sortBy: option.value as any })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default SearchFiltersComponent;