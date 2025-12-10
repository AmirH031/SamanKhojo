import React, { Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load heavy components to reduce initial bundle size
export const LazyAdminDashboard = React.lazy(() => import('../pages/AdminDashboard'));
export const LazyShopDetails = React.lazy(() => import('../pages/ShopDetails'));
export const LazyBagPage = React.lazy(() => import('../pages/BagPage'));

// Loading component for lazy-loaded components
export const LazyLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
        <p className="text-gray-600">Please wait while we load the content...</p>
      </div>
    </motion.div>
  </div>
);

// HOC for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage?: string
) => {
  return (props: P) => (
    <Suspense fallback={<LazyLoadingSpinner message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload components for better UX
export const preloadComponents = () => {
  // Preload search when user starts typing
  let searchPreloaded = false;
  const preloadSearch = () => {
    if (!searchPreloaded) {
      import('../pages/UnifiedSearchResults');
      searchPreloaded = true;
    }
  };
  
  // Listen for search-related interactions
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'search') {
      preloadSearch();
    }
  });
  
  // Preload admin dashboard for authenticated users (check via API)
  import('../services/firebase').then(({ auth }) => {
    if (auth.currentUser) {
      import('../services/userRoleService').then(({ getUserRole }) => {
        getUserRole().then(role => {
          if (role.isAdmin) {
            import('../pages/AdminDashboard');
          }
        }).catch(() => {
          // Ignore errors in preloading
        });
      });
    }
  });
};