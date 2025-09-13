import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { getRecentSearches, clearRecentSearches, RecentSearch } from '../services/recentSearchService';

interface RecentSearchesProps {
  onSearchClick: (query: string) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSearchClick }) => {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const handleClearAll = () => {
    clearRecentSearches();
    setSearches([]);
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="text-blue-500" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searches.map((search, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSearchClick(search.query)}
            className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-full text-sm font-medium transition-colors group"
          >
            <span>"{search.query}"</span>
            <span className="text-xs text-blue-600">({search.results} results)</span>
          </motion.button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        💡 Tip: Click on any recent search to search again instantly
      </div>
    </motion.div>
  );
};

export default RecentSearches;