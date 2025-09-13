import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, X, TrendingUp, Clock, Loader, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSearchSuggestions } from '../services/optimizedSearchService';
import EnhancedSearchBar from './EnhancedSearchBar';

interface SimpleSearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'hero' | 'compact';
}

const SimpleSearchBar: React.FC<SimpleSearchBarProps> = ({
  placeholder,
  className = "",
  variant = 'default'
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Popular searches for empty state (Flipkart-style)
  const popularSearches = [
    { text: 'चावल rice', type: 'trending', icon: '🌾' },
    { text: 'दूध milk', type: 'trending', icon: '🥛' },
    { text: 'बिरयानी biryani', type: 'trending', icon: '🍛' },
    { text: 'दवा medicine', type: 'trending', icon: '💊' },
    { text: 'किराना grocery', type: 'trending', icon: '🛒' },
    { text: 'सैलून salon', type: 'trending', icon: '💇‍♀️' },
    { text: 'मोबाइल mobile', type: 'trending', icon: '📱' },
    { text: 'कपड़े clothes', type: 'trending', icon: '👕' },
    { text: 'डॉक्टर doctor', type: 'trending', icon: '👨‍⚕️' },
    { text: 'रेस्टोरेंट restaurant', type: 'trending', icon: '🍽️' },
    { text: 'फार्मेसी pharmacy', type: 'trending', icon: '🏥' },
    { text: 'एटीएम ATM', type: 'trending', icon: '🏧' }
  ];

  // Recent searches (stored in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
  }
  )
  // Use the new EnhancedSearchBar component
  return (
    <EnhancedSearchBar
      placeholder={placeholder}
      className={className}
      variant={variant}
    />
  );
};

export default SimpleSearchBar;