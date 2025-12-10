/**
 * Enhanced Unified Search Bar Component
 * Supports Reference ID search, keyword search, and cross-entity results
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Star,
  Package,
  Store,
  Wrench,
  Building,
  Utensils
} from 'lucide-react';
import { 
  performUniversalSearch,
  getSearchSuggestions,
  searchByReferenceId,
  getRelatedItems,
  saveRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  SearchResult,
  SearchSuggestion
} from '../../services/searchService';
import { isValidReferenceId, getReferenceIdPath } from '../../utils/referenceId';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface UnifiedSearchBarProps {
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  showRecentSearches?: boolean;
  maxResults?: number;
  className?: string;
}

const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  placeholder = "Search products, shops, services... or enter Reference ID (e.g., PRD-MAN-024)",
  onResultSelect,
  showRecentSearches = true,
  maxResults = 10,
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches on mount
  useEffect(() => {
    if (showRecentSearches) {
      setRecentSearches(getRecentSearches());
    }
  }, [showRecentSearches]);

  // Handle search input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults([]);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Check if it's a Reference ID first
      if (isValidReferenceId(query.toUpperCase())) {
        const directResult = await searchByReferenceId(query.toUpperCase());
        if (directResult) {
          setResults([directResult]);
          setSuggestions([]);
          return;
        }
      }

      // Get suggestions and results in parallel
      const [searchResults, searchSuggestions] = await Promise.all([
        performUniversalSearch(query),
        getSearchSuggestions(query)
      ]);

      setResults(searchResults.slice(0, maxResults));
      setSuggestions(searchSuggestions.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigate to result page using Reference ID
      const path = getReferenceIdPath(result.referenceId);
      navigate(path);
    }
    
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + suggestions.length + (showRecentSearches ? recentSearches.length : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        } else if (selectedIndex >= results.length && selectedIndex < results.length + suggestions.length) {
          const suggestion = suggestions[selectedIndex - results.length];
          setQuery(suggestion.text);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'shop': return <Store size={16} className="text-blue-500" />;
      case 'product': return <Package size={16} className="text-green-500" />;
      case 'menu': return <Utensils size={16} className="text-orange-500" />;
      case 'service': return <Wrench size={16} className="text-purple-500" />;
      case 'office': return <Building size={16} className="text-gray-500" />;
      default: return <Search size={16} className="text-gray-400" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || showRecentSearches) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
          >
            {/* Recent Searches */}
            {!query && showRecentSearches && recentSearches.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock size={14} className="mr-1" />
                    Recent Searches
                  </h4>
                  <button
                    onClick={() => {
                      clearRecentSearches();
                      setRecentSearches([]);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((recentQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(recentQuery)}
                      className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                    >
                      {recentQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 px-2 py-1 mb-1">
                  Search Results
                </h4>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors ${
                      selectedIndex === index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getEntityIcon(result.type)}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {highlightMatch(result.name, query)}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {result.referenceId}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        {result.category && (
                          <span>{result.category}</span>
                        )}
                        {result.district && (
                          <span className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {result.district}
                          </span>
                        )}
                        {result.isFeatured && (
                          <span className="flex items-center text-yellow-600">
                            <Star size={12} className="mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {result.matchScore && (
                      <div className="text-xs text-gray-400">
                        {Math.round(result.matchScore * 10)}% match
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 px-2 py-1 mb-1 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  Suggestions
                </h4>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion.text)}
                    className={`w-full flex items-center p-2 hover:bg-gray-50 rounded transition-colors ${
                      selectedIndex === results.length + index ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="mr-2">{suggestion.icon || '🔍'}</span>
                    <span className="text-sm text-gray-700">{suggestion.text}</span>
                    {suggestion.category && (
                      <span className="ml-auto text-xs text-gray-500">{suggestion.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && !isLoading && results.length === 0 && suggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No results found for "{query}"</p>
                <p className="text-xs mt-1">Try different keywords or check the Reference ID format</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedSearchBar;