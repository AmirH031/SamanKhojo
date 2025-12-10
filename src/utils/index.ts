/**
 * Consolidated utility functions
 * Combines all utility files for better tree-shaking
 */

// Time utilities
export const formatTime = (time: string): string => {
  if (!time) return '';
  
  let hours: number, minutes: number;
  
  if (time.includes(':')) {
    const [h, m] = time.split(':');
    hours = parseInt(h);
    minutes = parseInt(m);
  } else if (time.length === 4) {
    hours = parseInt(time.slice(0, 2));
    minutes = parseInt(time.slice(2));
  } else {
    return time;
  }
  
  if (isNaN(hours) || isNaN(minutes)) return time;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHour}:${displayMinutes} ${ampm}`;
};

export const isShopOpen = (openingTime: string, closingTime: string): boolean => {
  if (!openingTime || !closingTime) return true;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const parseTime = (time: string): number => {
    let hours: number, minutes: number;
    
    if (time.includes(':')) {
      const [h, m] = time.split(':');
      hours = parseInt(h);
      minutes = parseInt(m);
    } else if (time.length === 4) {
      hours = parseInt(time.slice(0, 2));
      minutes = parseInt(time.slice(2));
    } else {
      return 0;
    }
    
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
  };
  
  const openMinutes = parseTime(openingTime);
  const closeMinutes = parseTime(closingTime);
  
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
  }
  
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

export const getShopStatus = (openingTime: string, closingTime: string) => {
  if (!openingTime || !closingTime) {
    return { 
      status: 'Hours not available', 
      isOpen: true,
      formattedHours: ''
    };
  }
  
  const isOpen = isShopOpen(openingTime, closingTime);
  const formattedHours = `${formatTime(openingTime)} - ${formatTime(closingTime)}`;
  
  return {
    status: isOpen ? 'Open now' : 'Closed',
    isOpen,
    formattedHours
  };
};

// Distance utilities
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away`;
  }
  return `${distanceKm}km away`;
};

// Display utilities
export const getDisplayName = (
  name: string | undefined, 
  hindiName: string | undefined, 
  currentLanguage: string
): string => {
  if (currentLanguage === 'hi' && hindiName && hindiName.trim()) {
    return hindiName;
  }
  return name || '';
};

export const shouldDisplay = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'number' && isNaN(value)) return false;
  return true;
};

export const formatPrice = (price: string | number | undefined): string | null => {
  if (!shouldDisplay(price)) return null;
  
  if (typeof price === 'number') {
    if (price <= 0) return null;
    return `₹${price.toFixed(2).replace(/\.00$/, '')}`;
  }
  
  const priceStr = String(price);
  const cleanPrice = priceStr.trim();
  
  if (!cleanPrice || cleanPrice === '0' || cleanPrice === '0.00') return null;
  
  if (cleanPrice && !cleanPrice.startsWith('₹')) {
    return `₹${cleanPrice}`;
  }
  
  return cleanPrice;
};

// Retry utilities
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (error.code === 'permission-denied' || 
          error.code === 'unauthenticated' ||
          error.message?.includes('offline')) {
        throw error;
      }

      if (attempt === maxRetries) break;

      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{9,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Storage utilities with expiration
export const setStorageWithExpiry = (key: string, value: any, ttlMs: number): void => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttlMs
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Failed to set storage:', error);
  }
};

export const getStorageWithExpiry = <T>(key: string): T | null => {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch {
    return null;
  }
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Image optimization
export const optimizeImageUrl = (url: string, width?: number, quality?: number): string => {
  if (!url) return '';
  
  if (url.includes('pexels.com')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (quality) params.append('q', Math.min(quality, 80).toString());
    params.append('auto', 'compress');
    params.append('cs', 'tinysrgb');
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  return url;
};

// Error handling
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// URL utilities
export const buildUrl = (path: string, params?: Record<string, string>): string => {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Simple transliteration for admin forms
export const generateHindiName = (englishName: string): string => {
  if (!englishName) return '';
  
  // Basic transliteration map for common words
  const transliterationMap: Record<string, string> = {
    'shop': 'दुकान',
    'store': 'स्टोर',
    'market': 'मार्केट',
    'general': 'जनरल',
    'medical': 'मेडिकल',
    'electronics': 'इलेक्ट्रॉनिक्स',
    'mobile': 'मोबाइल',
    'grocery': 'किराना',
    'kirana': 'किराना',
    'super': 'सुपर',
    'mega': 'मेगा',
    'mini': 'मिनी'
  };
  
  const lowerName = englishName.toLowerCase();
  
  // Check for exact matches
  if (transliterationMap[lowerName]) {
    return transliterationMap[lowerName];
  }
  
  // Check for partial matches
  for (const [english, hindi] of Object.entries(transliterationMap)) {
    if (lowerName.includes(english)) {
      return hindi;
    }
  }
  
  // Return original if no translation found
  return englishName;
};