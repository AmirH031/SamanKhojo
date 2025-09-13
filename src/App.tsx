import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { validateConfig } from './config/app';

import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopsPage from './pages/ShopsPage';
import AdminLogin from './pages/AdminLogin';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import FeedbackPage from './pages/FeedbackPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import HowToUsePage from './pages/HowToUsePage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ProfileSetupModal from './components/ProfileSetupModal';
import NetworkStatus from './components/NetworkStatus';
import { 
  LazyAdminDashboard, 
  LazyEnhancedSearch, 
  LazyShopDetails, 
  LazyBagPage,
  withLazyLoading
} from './components/LazyComponents';

// Validate configuration on app start
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.error('Missing required environment variables:', configValidation.missingVars);
}
// Wrap lazy components with loading states
const AdminDashboard = withLazyLoading(LazyAdminDashboard, "Loading Admin Dashboard...");
const EnhancedSearch = withLazyLoading(LazyEnhancedSearch, "Loading Search...");
const ShopDetails = withLazyLoading(LazyShopDetails, "Loading Shop Details...");
const BagPage = withLazyLoading(LazyBagPage, "Loading Bag...");

// Layout component without auth hook
const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <Outlet />
      <MobileNavbar />
      <Footer />
      <NetworkStatus />
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Global Profile Setup Modal - moved to AuthWrapper */}
    </div>
  );
};

// Auth wrapper component that uses the auth hook
const AuthWrapper = () => {
  const { needsProfileSetup } = useAuth();
  
  return (
    <>
      <Layout />
      <ProfileSetupModal
        isOpen={needsProfileSetup}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    </>
  );
};

// Router configuration with future flags
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "shops",
        element: <ShopsPage />
      },
      {
        path: "search",
        element: <EnhancedSearch />
      },
      {
        path: "bag",
        element: <BagPage />
      },
      {
        path: "admin",
        element: <AdminLogin />
      },
      {
        path: "admin/login",
        element: <AdminLogin />
      },
      {
        path: "admin/dashboard",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        )
      },
      {
        path: "shop/:id",
        element: <ShopDetails />
      },
      {
        path: "bag",
        element: <BagPage />
      },
      {
        path: "profile",
        element: <ProfilePage />
      },
      {
        path: "contact",
        element: <ContactPage />
      },
      {
        path: "feedback",
        element: <FeedbackPage />
      },
      {
        path: "about",
        element: <AboutPage />
      },
      {
        path: "terms",
        element: <TermsPage />
      },
      {
        path: "privacy",
        element: <PrivacyPage />
      },
      {
        path: "how-to-use",
        element: <HowToUsePage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      },
      {
        path: "support",
        element: <SupportPage />
      }
    ]
  }
], {
  basename: "/SamanKhojo",
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
});

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;