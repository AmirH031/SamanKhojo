import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Mic, 
  X, 
  TrendingUp, 
  Clock, 
  Loader, 
  MapPin,
  Sparkles,
  Zap,
  ArrowRight,
  Store,
  Package,
  Utensils,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { 
  getSearchSuggestions, 
  saveRecentSearch, 
  getRecentSearches, 
  clearRecentSearches 
} from '../services/searchService';

interface SearchSuggestion {
  text: string;
  type: 'item' | 'shop' | 'location' | 'food' | 'service';
  category?: string;
  icon?: string;
}

interface UnifiedSearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
  showVoice?: boolean;
  autoFocus?: boolean;
}

const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  placeholder,
  className = "",
  variant = 'default',
  showVoice = true,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Enhanced popular searches with intelligent categorization
  const popularSearches: SearchSuggestion[] = [
    // Food items
    { text: 'pizza', type: 'food', category: 'Italian', icon: '🍕' },
    { text: 'biryani', type: 'food', category: 'Indian', icon: '🍛' },
    { text: 'burger', type: 'food', category: 'Fast Food', icon: '🍔' },
    { text: 'dosa', type: 'food', category: 'South Indian', icon: '🥞' },
    
    // General products
    { text: 'rice चावल', type: 'item', category: 'Grocery', icon: '🌾' },
    { text: 'milk दूध', type: 'item', category: 'Dairy', icon: '🥛' },
    { text: 'medicine दवा', type: 'item', category: 'Health', icon: '💊' },
    { text: 'mobile मोबाइल', type: 'item', category: 'Electronics', icon: '📱' },
    
    // Services
    { text: 'haircut', type: 'service', category: 'Beauty', icon: '✂️' },
    { text: 'repair', type: 'service', category: 'Technical', icon: '🔧' },
    { text: 'doctor', type: 'service', category: 'Health', icon: '👨‍⚕️' },
    
    // Shops
    { text: 'grocery store', type: 'shop', category: 'Shopping', icon: '🛒' },
    { text: 'restaurant', type: 'shop', category: 'Food', icon: '🍽️' },
    { text: 'pharmacy', type: 'shop', category: 'Health', icon: '🏥' },
    
    // Location-based
    { text: 'near me', type: 'location', category: 'Location', icon: '📍' },
    { text: 'nearby shops', type: 'location', category: 'Location', icon: '🏪' }
  ];

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Optimized debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 1) {
        setSuggestions([]);
        setShowSuggestions(isFocused);
        setLoading(false);
        return;
      }

      try {
        const backendSuggestions = await getSearchSuggestions(searchQuery);
        setSuggestions(backendSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        // Fallback to local suggestions
        const localSuggestions = getLocalSuggestions(searchQuery);
        setSuggestions(localSuggestions);
        setShowSuggestions(true);
      } finally {
        setLoading(false);
      }
    }, 200)
  ).current;

  useEffect(() => {
    setRecentSearches(getRecentSearches());

    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    saveRecentSearch(searchQuery.trim());
    setRecentSearches(getRecentSearches());
    
    // Navigate to unified search results page
    const params = new URLSearchParams({ q: searchQuery });
    navigate(`/search?${params.toString()}`);
    
    setShowSuggestions(false);
    setIsFocused(false);
    setQuery(''); // Clear the search input after search
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 1 && value.length <= 50) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(isFocused);
      setLoading(false);
    }
  };

  const getLocalSuggestions = (searchQuery: string): SearchSuggestion[] => {
    const lowerQuery = searchQuery.toLowerCase();
    return popularSearches
      .filter(search => search.text.toLowerCase().includes(lowerQuery))
      .slice(0, 6);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (query.length >= 1 || recentSearches.length > 0 || popularSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setIsFocused(false);
    }, 200);
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice search not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      setTimeout(() => handleSearch(transcript), 500);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice search failed. Please try again.');
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: 'relative',
          input: 'w-full pl-12 pr-32 py-4 md:py-6 text-lg md:text-xl rounded-2xl md:rounded-3xl bg-white/98 backdrop-blur-2xl border-2 border-white/60 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-2xl transition-all',
          searchIcon: 'absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400',
          rightSection: 'absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2'
        };
      case 'compact':
        return {
          container: 'relative',
          input: 'w-full pl-9 pr-20 py-3 text-sm rounded-xl bg-white/95 backdrop-blur-md border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all',
          searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400',
          rightSection: 'absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'
        };
      default:
        return {
          container: 'relative',
          input: 'w-full pl-10 pr-24 py-3 md:py-4 text-base md:text-lg rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg transition-all',
          searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400',
          rightSection: 'absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2'
        };
    }
  };

  const styles = getVariantStyles();

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'item': return <Package size={16} className="text-blue-600" />;
      case 'food': return <Utensils size={16} className="text-orange-600" />;
      case 'service': return <Wrench size={16} className="text-purple-600" />;
      case 'shop': return <Store size={16} className="text-green-600" />;
      case 'location': return <MapPin size={16} className="text-red-600" />;
      default: return <Search size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="relative">
        <div className={styles.searchIcon}>
          <Search />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || t('home.searchPlaceholder')}
          className={styles.input}
          maxLength={100}
        />

        <div className={styles.rightSection}>
          {loading && <Loader className="h-4 w-4 text-gray-400 animate-spin" />}

          {showVoice && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startVoiceSearch}
              disabled={isListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              title="Voice Search"
            >
              <Mic size={variant === 'compact' ? 14 : 18} />
            </motion.button>
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(isFocused);
                inputRef.current?.focus();
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={variant === 'compact' ? 14 : 18} />
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch(query)}
            disabled={!query.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Search"
          >
            {variant === 'hero' ? (
              <ArrowRight size={20} />
            ) : (
              <Search size={variant === 'compact' ? 14 : 18} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Enhanced Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 bg-white/98 backdrop-blur-2xl border border-gray-200/50 rounded-2xl shadow-2xl mt-3 max-h-80 overflow-y-auto z-50"
          >
            <div className="p-4">
              {/* Backend Search Suggestions */}
              {query.length >= 1 && suggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-gray-100/50 mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-semibold">Smart Suggestions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {loading && <Loader className="animate-spin h-3 w-3" />}
                      <span className="text-indigo-600 font-semibold">✨ AI Powered</span>
                    </div>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={`suggestion-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="w-full text-left px-3 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all flex items-center space-x-3 group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center shadow-sm">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                          {suggestion.text}
                        </span>
                        <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                      </div>
                      <Zap className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-gray-100/50 mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span className="font-semibold">Recent</span>
                    </div>
                    <button
                      onClick={() => {
                        clearRecentSearches();
                        setRecentSearches([]);
                      }}
                      className="text-red-500 hover:text-red-600 font-semibold text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.slice(0, 4).map((search, index) => (
                    <motion.button
                      key={`recent-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(search)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-xl transition-all flex items-center space-x-3 group"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{search}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {query.length === 0 && (
                <div>
                  <div className="flex items-center px-3 py-2 text-xs text-gray-500 border-b border-gray-100/50 mb-3">
                    <TrendingUp className="h-3 w-3 mr-2" />
                    <span className="font-semibold">Trending</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {popularSearches.slice(0, 8).map((search, index) => (
                      <motion.button
                        key={`popular-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestionClick(search.text)}
                        className="w-full text-left px-3 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 rounded-xl transition-all flex items-center space-x-3 group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm">{search.icon}</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                            {search.text}
                          </span>
                          <div className="text-xs text-gray-500">{search.category}</div>
                        </div>
                        <TrendingUp className="h-3 w-3 text-orange-500 group-hover:text-orange-600" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* No suggestions message */}
              {query.length >= 1 && suggestions.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No suggestions found</p>
                  <p className="text-xs">Try searching for shops, items, or services</p>
                </div>
              )}

              {/* Quick Actions */}
              {query.length === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSuggestionClick('near me')}
                      className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    >
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Near Me</span>
                    </button>
                    <button
                      onClick={() => handleSuggestionClick('restaurants')}
                      className="flex items-center space-x-2 p-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    >
                      <span className="text-lg">🍽️</span>
                      <span className="text-sm font-semibold text-orange-700">Food</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default UnifiedSearchBar;