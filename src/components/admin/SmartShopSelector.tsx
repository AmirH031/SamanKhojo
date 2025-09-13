import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Search, Filter, Grid, List } from 'lucide-react';
import { Shop } from '../../services/firestoreService';
import { ItemType } from '../../types/Item';

interface SmartShopSelectorProps {
  shops: Shop[];
  selectedType: ItemType | '';
  onShopSelect: (shop: Shop) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SmartShopSelector: React.FC<SmartShopSelectorProps> = ({
  shops,
  selectedType,
  onShopSelect,
  searchQuery,
  onSearchChange
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

  useEffect(() => {
    let filtered = shops;

    // Filter by type if selected
    if (selectedType) {
      filtered = filtered.filter(shop => shop.shopType === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.shopName.toLowerCase().includes(query) ||
        shop.ownerName.toLowerCase().includes(query) ||
        shop.type.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query)
      );
    }

    setFilteredShops(filtered);
  }, [shops, selectedType, searchQuery]);

  const getShopTypeIcon = (shopType: string) => {
    switch (shopType) {
      case 'product': return '🛍️';
      case 'menu': return '🍽️';
      case 'service': return '🔧';
      default: return '🏪';
    }
  };

  const getShopTypeColor = (shopType: string) => {
    switch (shopType) {
      case 'product': return 'from-green-500 to-emerald-600';
      case 'menu': return 'from-blue-500 to-indigo-600';
      case 'service': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">
            Select Shop {selectedType && `(${selectedType} shops)`}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredShops.length} of {shops.length}
          </span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search shops..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Shops Display */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
          : 'space-y-3'
      } max-h-96 overflow-y-auto`}>
        {filteredShops.map((shop, index) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onShopSelect(shop)}
            className={`bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group ${
              viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
            }`}
          >
            <div className={viewMode === 'list' ? 'flex items-center space-x-4 flex-1' : 'space-y-3'}>
              <div className={`${viewMode === 'list' ? 'w-12 h-12' : 'w-16 h-16 mx-auto'} bg-gradient-to-br ${getShopTypeColor(shop.shopType)} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                {getShopTypeIcon(shop.shopType)}
              </div>
              
              <div className={viewMode === 'list' ? 'flex-1' : 'text-center'}>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {shop.shopName}
                </h4>
                <p className="text-sm text-gray-600">{shop.ownerName}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shop.shopType === 'product' ? 'bg-green-100 text-green-800' :
                    shop.shopType === 'menu' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {shop.shopType}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{shop.type}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredShops.length === 0 && (
        <div className="text-center py-8">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No shops found</h3>
          <p className="text-sm text-gray-600">
            {selectedType 
              ? `No ${selectedType} shops found${searchQuery ? ` matching "${searchQuery}"` : ''}`
              : searchQuery 
              ? `No shops found matching "${searchQuery}"`
              : 'No shops available'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartShopSelector;