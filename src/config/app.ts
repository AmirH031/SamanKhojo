/**
 * Centralized application configuration
 * Only contains client-safe values
 */

// Firebase client configuration (safe for frontend)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// API configuration - uses relative paths in dev, full URL in production
export const apiConfig = {
  baseUrl: import.meta.env.DEV 
    ? '/api' // Relative path - will be proxied by Vite in development
    : `${import.meta.env.VITE_API_BASE_URL}/api`, // Use environment variable for production
  timeout: 30000,
  retryAttempts: 5
};

// App configuration
export const appConfig = {
  name: 'SamanKhojo',
  version: '1.0.0',
  description: 'Smart Local Shop Discovery Platform',
  supportedLanguages: ['en', 'hi', 'bn'],
  defaultLanguage: 'en',
  maxCartItems: 50,
  maxSearchResults: 100,
  searchDebounceMs: 300,
  cacheExpiryMs: 300000, // 5 minutes
  locationTimeout: 10000,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
};

// Feature flags
export const features = {
  voiceSearch: true,
  locationServices: true,
  offlineMode: true,
  analytics: true,
  pushNotifications: false,
  darkMode: false
};

// Validation rules
export const validation = {
  minNameLength: 2,
  maxNameLength: 100,
  minPhoneLength: 10,
  maxPhoneLength: 15,
  minPasswordLength: 6,
  maxDescriptionLength: 500,
  minReviewLength: 10,
  maxReviewLength: 1000
};

// UI constants
export const ui = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  maxContentWidth: '7xl',
  defaultPageSize: 20,
  animationDuration: 300
};

// External service URLs (public)
export const externalUrls = {
  github: 'https://github.com/amirh031/SamanKhojo',
  instagram: 'https://instagram.com/samankhojo',
  youtube: 'https://youtube.com/@samankhojo',
  whatsappSupport: 'https://wa.me/919876543210',
  supportEmail: 'mailto:support@samankhojo.com'
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

export const validateConfig = (): { isValid: boolean; missingVars: string[] } => {
  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
};

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;