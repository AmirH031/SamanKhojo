import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Brain, Sparkles } from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalCategories: number;
  filteredCount: number;
  nluEnabled?: boolean;
  onNluToggle?: (enabled: boolean) => void;
  showNluResults?: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCategories,
  filteredCount,
  nluEnabled = false,
  onNluToggle,
  showNluResults = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg"
    >
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories, items, types..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 placeholder-gray-500"
        />
      </div>

      {/* Filter and Sort Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="count">Sort by Item Count</option>
              <option value="az">A to Z</option>
              <option value="za">Z to A</option>
            </select>
          </div>

          {/* NLU Toggle */}
          {onNluToggle && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNluToggle(!nluEnabled)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  nluEnabled 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">Smart Search</span>
                {showNluResults && (
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {searchQuery ? (
            <span>
              {filteredCount} of {totalCategories} categories
            </span>
          ) : (
            <span>
              {totalCategories} categories
            </span>
          )}
        </div>
      </div>

      {/* Active Search Indicator */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium">
              Searching for: "{searchQuery}"
            </span>
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchAndFilter;