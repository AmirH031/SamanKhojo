import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';

import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopsPage from './pages/ShopsPage';
import UnifiedSearchResults from './pages/UnifiedSearchResults';
import AdminLogin from './pages/AdminLogin';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';
import FeedbackPage from './pages/FeedbackPage';
import AboutPage from './pages/AboutPage';
import TermsPrivacyPage from './pages/TermsPrivacyPage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';


import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FestivalProvider, useFestival } from './contexts/FestivalContext';

import AdminProtectedRoute from './components/AdminProtectedRoute';
import ProfileSetupModal from './components/ProfileSetupModal';
import NetworkStatus from './components/NetworkStatus';
import CustomOverlayRenderer from './components/CustomOverlayRenderer';
import AdminDashboard from './pages/AdminDashboard';
import ShopDetails from './pages/ShopDetails';
import BagPage from './pages/BagPage';




// Direct imports for now (lazy loading removed for simplicity)

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

// Festival overlay wrapper component
const FestivalOverlayWrapper = () => {
  const { activeFestival } = useFestival();
  
  return (
    <>
      <Layout />
      <CustomOverlayRenderer festival={activeFestival} />
    </>
  );
};

// Auth wrapper component that uses the auth hook
const AuthWrapper = () => {
  const { needsProfileSetup } = useAuth();

  return (
    <>
      <FestivalOverlayWrapper />
      <ProfileSetupModal
        isOpen={needsProfileSetup}
        onClose={() => { }}
        onSuccess={() => { }}
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
        <FestivalProvider>
          <AuthWrapper />
        </FestivalProvider>
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
        element: <UnifiedSearchResults />
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
        element: <TermsPrivacyPage />
      },
      {
        path: "privacy",
        element: <TermsPrivacyPage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      },

      {
        path: "support",
        element: <SupportPage />
      },

    ]
  }
]);

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;