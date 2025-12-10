# Complete Project Structure - SamanKhojo Platform

## 📁 Full Project File Structure

```
SamanKhojo/
├── src/
│   ├── components/                    # Main UI Components (40+ files)
│   │   ├── admin/                     # Admin Dashboard Components (30+ files)
│   │   ├── common/                    # Shared Components
│   │   ├── search/                    # Search-specific Components
│   │   ├── shop/                      # Shop-specific Components
│   │   └── [40+ component files]     # Root level components
│   ├── config/                        # Configuration Files
│   ├── contexts/                      # React Context Providers
│   ├── hooks/                         # Custom React Hooks
│   ├── pages/                         # Page Components (13 files)
│   ├── services/                      # API & Business Logic (25+ files)
│   ├── styles/                        # CSS & Styling
│   ├── types/                         # TypeScript Type Definitions
│   ├── utils/                         # Utility Functions
│   ├── App.tsx                        # Main App Component
│   ├── main.tsx                       # App Entry Point
│   └── index.css                      # Global Styles
├── server/                            # Backend Server
│   ├── routes/                        # API Routes
│   ├── middleware/                    # Server Middleware
│   ├── firebaseAdmin.js              # Firebase Admin SDK
│   └── server.js                      # Express Server
├── public/                            # Static Assets
└── [config files]                    # Build & deployment configs
```

## 🧩 Main Components Folder Analysis (src/components/)

### **Core Navigation & Layout Components**

#### `Navbar.tsx` - Main Navigation Bar
- **Purpose**: Desktop navigation with logo, menu items, language selector
- **Connections**: 
  - Uses `useAuth` context for user state
  - Imports `LanguageSelector`, `BagIcon` components
  - Connects to routing system
- **Features**: Responsive design, user profile display, bag count

#### `MobileNavbar.tsx` - Mobile Navigation
- **Purpose**: Mobile-optimized navigation with bottom tab bar
- **Connections**: Similar to Navbar but mobile-specific layout
- **Features**: Touch-friendly interface, swipe gestures

#### `Footer.tsx` - Site Footer
- **Purpose**: Footer with links, contact info, language selector
- **Connections**: Uses translation system, social media links
- **Features**: Multi-language support, responsive grid layout

### **Authentication & User Management**

#### `AuthModal.tsx` - Authentication Modal
- **Purpose**: Login/signup modal with Google and guest options
- **Connections**:
  - Uses `useAuth` context for authentication
  - Connects to `authService` for login operations
  - Links to terms and privacy pages
- **Features**: 
  - Google OAuth integration
  - Guest account creation
  - Terms acceptance checkbox
  - Animated UI with Framer Motion

#### `ProfileSetupModal.tsx` - User Profile Setup
- **Purpose**: Collects user information after authentication
- **Connections**: Works with `AuthModal` and `authService`
- **Features**: Name, phone number collection, validation

#### `ProtectedRoute.tsx` - Route Protection
- **Purpose**: Protects routes requiring authentication
- **Connections**: Uses `useAuth` context, redirects to login
- **Features**: Loading states, automatic redirects

#### `AdminProtectedRoute.tsx` - Admin Route Protection
- **Purpose**: Protects admin-only routes
- **Connections**: Uses `useAdminAuth` hook, `userRoleService`
- **Features**: Role-based access control, email verification check

#### `AdminClaimsHandler.tsx` - Admin Permission Management
- **Purpose**: Handles admin permission refresh scenarios
- **Connections**: Works with Firebase Auth claims system
- **Features**: Permission refresh, sign-out flow, error handling

### **Search & Discovery Components**

#### `EnhancedSearchBar.tsx` - Advanced Search Interface
- **Purpose**: Unified search across all entity types with Reference ID support
- **Connections**:
  - Uses `searchService` for API calls
  - Connects to `referenceId` utilities
  - Integrates with navigation system
- **Features**:
  - Real-time suggestions
  - Reference ID lookup (PRD-MAN-024 format)
  - Recent searches storage
  - Cross-entity search results
  - Keyboard navigation support

#### `UnifiedSearchBar.tsx` - Simplified Search
- **Purpose**: Basic search functionality for specific pages
- **Connections**: Lighter version of EnhancedSearchBar
- **Features**: Quick search, basic suggestions

### **Shop & Item Display Components**

#### `ShopCard.tsx` - Shop Display Card
- **Purpose**: Displays shop information in card format
- **Connections**:
  - Uses `firestoreService` for shop data
  - Connects to `bagService` for add-to-bag functionality
  - Uses `AuthModal` for authentication prompts
  - Integrates with location services
- **Features**:
  - Multiple view modes (grid, list, ecommerce)
  - Shop type differentiation (product, menu, service, office)
  - Service details display for service shops
  - Office details for public facilities
  - Distance calculation and display
  - Rating and review integration
  - Add to bag functionality
  - WhatsApp contact integration

#### `ItemCard.tsx` - Item Display Card
- **Purpose**: Displays individual items (products, menu items, services)
- **Connections**:
  - Uses Item type definitions
  - Connects to bag service for add-to-bag
  - Supports recommendation system
- **Features**:
  - Price range display for products
  - Variety and brand information
  - Stock status indicators
  - AI recommendation badges
  - Confidence scoring for recommendations
  - Multi-language support (Hindi names)

### **Shopping & Commerce Components**

#### `BagIcon.tsx` - Shopping Bag Indicator
- **Purpose**: Shows bag item count with real-time updates
- **Connections**:
  - Uses `useAuth` for user state
  - Connects to bag API for count updates
  - Links to bag page
- **Features**:
  - Real-time count updates
  - Loading indicators
  - Animated badge display

#### `RecommendationsSection.tsx` - Product Recommendations
- **Purpose**: Displays personalized product recommendations
- **Connections**: Uses recommendation algorithms, item data
- **Features**: AI-powered suggestions, user preference learning

### **Festival & Theming Components**

#### `FestivalBanner.tsx` - Dynamic Festival Banner
- **Purpose**: Displays active festival promotions and themes
- **Connections**:
  - Uses `festivalService` for festival data
  - Connects to asset management system
  - Integrates with theming system
- **Features**:
  - Dynamic background assets (images/videos)
  - Animated decorations and sparkles
  - Custom overlay code support
  - Sticker/decoration positioning
  - Border styling options (gradient, glow, neon)
  - Dismissible with localStorage persistence

#### `FestivalHeroSection.tsx` - Festival Hero Display
- **Purpose**: Large festival promotional section
- **Connections**: Similar to FestivalBanner but for hero sections
- **Features**: Full-width festival promotions

### **User Interface & Interaction Components**

#### `LanguageSelector.tsx` - Language Switching
- **Purpose**: Allows users to switch between languages
- **Connections**:
  - Uses i18n translation system
  - Stores preference in localStorage
  - Updates global language state
- **Features**: Dropdown with flag icons, smooth transitions

#### `MobileLanguageSelector.tsx` - Mobile Language Switch
- **Purpose**: Mobile-optimized language selector
- **Connections**: Same as LanguageSelector but mobile UI
- **Features**: Touch-friendly interface

#### `NetworkStatus.tsx` - Connection Status
- **Purpose**: Shows online/offline status
- **Connections**: Monitors network connectivity
- **Features**: Automatic reconnection, status indicators

#### `ErrorBoundary.tsx` - Error Handling
- **Purpose**: Catches and displays React errors gracefully
- **Connections**: Wraps components to catch errors
- **Features**: Error reporting, retry functionality, fallback UI

### **Content & Information Components**

#### `HomepageBanner.tsx` - Homepage Promotional Banner
- **Purpose**: Main homepage promotional content
- **Connections**: Uses admin-configurable content
- **Features**: Dynamic content, call-to-action buttons

#### `StandaloneBannerDisplay.tsx` - Standalone Banner System
- **Purpose**: Displays configurable banners throughout the app
- **Connections**: Uses banner management system
- **Features**: Position-based display, scheduling

#### `ProductAlertBanner.tsx` - Product Alert System
- **Purpose**: Shows product availability alerts
- **Connections**: Uses alert management system
- **Features**: Dismissible alerts, product-specific notifications

### **Review & Rating Components**

#### `ReviewForm.tsx` - Review Submission Form
- **Purpose**: Allows users to submit shop/item reviews
- **Connections**:
  - Uses `ratingService` for API calls
  - Requires authentication
  - Connects to shop/item data
- **Features**: Star ratings, text reviews, validation

#### `ReviewsList.tsx` - Review Display List
- **Purpose**: Displays reviews for shops/items
- **Connections**: Fetches and displays review data
- **Features**: Pagination, helpful votes, moderation

#### `ShopRatingForm.tsx` - Shop-specific Rating Form
- **Purpose**: Specialized form for shop ratings
- **Connections**: Similar to ReviewForm but shop-focused
- **Features**: Shop-specific rating criteria

### **Utility & Helper Components**

#### `LazyComponents.tsx` - Lazy Loading Wrapper
- **Purpose**: Implements lazy loading for performance
- **Connections**: Wraps heavy components
- **Features**: Loading states, error boundaries

#### `CustomOverlayRenderer.tsx` - Custom Overlay System
- **Purpose**: Renders custom overlays and modals
- **Connections**: Used by various modal systems
- **Features**: Flexible overlay positioning, animations

#### `ReferenceIdRouter.tsx` - Reference ID Navigation
- **Purpose**: Handles navigation based on Reference IDs
- **Connections**:
  - Uses `referenceId` utilities
  - Connects to routing system
  - Integrates with search system
- **Features**: Direct ID-based navigation, entity type detection

## 🔧 Services Layer (src/services/)

### **Core API Services**

#### `api.ts` - Centralized API Client
- **Purpose**: Main API client with authentication and error handling
- **Features**:
  - Automatic token management
  - Request/response interceptors
  - Timeout handling
  - Error standardization
- **Exports**: 
  - `api` - Main client instance
  - `authApi` - Authentication endpoints
  - `shopsApi` - Shop-related endpoints
  - `searchApi` - Search endpoints
  - `itemsApi` - Item management
  - `ratingsApi` - Rating system
  - `feedbackApi` - Feedback system
  - `userApi` - User management
  - `festivalApi` - Festival system
  - `adminApi` - Admin operations

#### `firestoreService.ts` - Firebase Database Operations
- **Purpose**: Direct Firestore database operations
- **Features**:
  - CRUD operations for all entities
  - Real-time data synchronization
  - Admin permission checking
  - File upload handling
- **Key Functions**:
  - Shop management (getShops, addShop, updateShop, deleteShop)
  - Search operations (searchShops)
  - Booking system (addBooking, getBookings)
  - Analytics (getBookingAnalytics)
  - Distance calculations (getShopsNearby)

### **Authentication Services**

#### `authService.ts` - User Authentication
- **Purpose**: Handles all authentication operations
- **Features**:
  - Google OAuth integration
  - Anonymous/guest accounts
  - Profile management
  - Device fingerprinting
  - Account merging
- **Key Functions**:
  - `signInWithGoogle()` - Google authentication
  - `signInAsGuest()` - Guest account creation
  - `createUserProfile()` - Profile setup
  - `findExistingUser()` - Duplicate account detection
  - `mergeWithExistingProfile()` - Account consolidation

#### `adminAuthService.ts` - Admin Authentication
- **Purpose**: Admin-specific authentication utilities
- **Features**: Backend role validation, permission checking
- **Key Functions**:
  - `isAdmin()` - Admin status check
  - `validateAdminAccess()` - Comprehensive access validation

#### `userRoleService.ts` - Role Management
- **Purpose**: User role and permission management
- **Features**: Backend role validation, claims management

### **Search & Discovery Services**

#### `searchService.ts` - Unified Search System
- **Purpose**: Advanced search with Reference ID support
- **Features**:
  - Cross-entity search (shops, products, services, offices)
  - Reference ID direct lookup
  - Search suggestions and autocomplete
  - Related items discovery
  - "Did you mean" suggestions
  - Recent searches management
- **Key Functions**:
  - `performUniversalSearch()` - Main search function
  - `searchByReferenceId()` - Direct ID lookup
  - `getSearchSuggestions()` - Autocomplete suggestions
  - `getRelatedItems()` - Related content discovery

#### `enhancedSearchService.ts` - Advanced Search Features
- **Purpose**: Enhanced search capabilities
- **Features**: AI-powered search, semantic matching

### **Commerce & Shopping Services**

#### `bagService.ts` - Shopping Bag Management
- **Purpose**: Shopping cart functionality
- **Features**:
  - Add/remove items
  - Quantity management
  - Shop grouping
  - WhatsApp integration for orders
- **Key Functions**:
  - `addToBag()` - Add items to cart
  - `getBagItems()` - Retrieve cart contents
  - `confirmBooking()` - Process orders
  - `clearBag()` - Empty cart

#### `itemService.ts` - Item Management
- **Purpose**: Product/menu/service item operations
- **Features**:
  - CRUD operations
  - Bulk operations
  - Category management
  - Search within items

### **Location & Mapping Services**

#### `locationService.ts` - Location Services
- **Purpose**: GPS and location-based features
- **Features**:
  - Current location detection
  - Distance calculations
  - Nearby shop discovery
  - Address geocoding

### **Content Management Services**

#### `festivalService.ts` - Festival & Theming
- **Purpose**: Dynamic festival themes and content
- **Features**:
  - Active festival detection
  - Asset management
  - Theme application
  - Seasonal content

#### `assetManagementService.ts` - Asset Management
- **Purpose**: File and media asset handling
- **Features**: Upload, storage, optimization, CDN integration

#### `standaloneBannerService.ts` - Banner Management
- **Purpose**: Configurable banner system
- **Features**: Position-based banners, scheduling, targeting

### **Analytics & Insights Services**

#### `analyticsService.ts` - Business Analytics
- **Purpose**: Usage analytics and business insights
- **Features**: User behavior tracking, conversion metrics

#### `userActivityService.ts` - User Activity Tracking
- **Purpose**: User interaction monitoring
- **Features**: Activity logging, engagement metrics

### **Communication Services**

#### `feedbackService.ts` - Feedback System
- **Purpose**: User feedback collection and management
- **Features**: Feedback submission, admin review, categorization

#### `reviewService.ts` - Review & Rating System
- **Purpose**: Shop and item review management
- **Features**: Review submission, moderation, helpful votes

### **Utility Services**

#### `transliterationService.ts` - Language Support
- **Purpose**: Hindi transliteration and language support
- **Features**: Automatic Hindi name generation, script conversion

#### `i18nService.ts` - Internationalization
- **Purpose**: Multi-language support
- **Features**: Translation management, locale switching

#### `referenceIdService.ts` - Reference ID System
- **Purpose**: Unique identifier system for all entities
- **Features**: ID generation, validation, routing

## 🎯 Key File Connections & Data Flow

### **Authentication Flow**
```
AuthModal → authService → Firebase Auth → userRoleService → Profile Creation
```

### **Search Flow**
```
EnhancedSearchBar → searchService → API/Firestore → Results Display
```

### **Shopping Flow**
```
ItemCard → bagService → API → WhatsApp Integration → Order Confirmation
```

### **Admin Flow**
```
AdminLogin → adminAuthService → AdminDashboard → Admin Components → API
```

### **Festival System Flow**
```
FestivalBanner → festivalService → Asset Management → Dynamic Theming
```

## 🔄 Component Interaction Patterns

### **State Management**
- **Contexts**: AuthContext, FestivalContext for global state
- **Hooks**: Custom hooks for specific functionality (useAdminAuth, useBag)
- **Local State**: Component-level state with useState/useEffect

### **API Integration**
- **Centralized**: All API calls go through `api.ts` client
- **Authentication**: Automatic token injection
- **Error Handling**: Standardized error responses
- **Fallbacks**: Local Firestore fallbacks when API unavailable

### **Real-time Updates**
- **Firebase**: Real-time listeners for live data
- **Polling**: Periodic updates for non-critical data
- **WebSocket**: Future enhancement for real-time features

## 🛡️ Security Architecture

### **Frontend Security**
- Route protection with authentication checks
- Role-based component rendering
- Input validation and sanitization
- XSS protection with proper escaping

### **Backend Security**
- JWT token validation on all protected routes
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration

### **Data Security**
- Encrypted data transmission (HTTPS)
- Secure token storage
- Personal data protection
- Audit logging for admin actions

## 📱 Responsive Design System

### **Breakpoints**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### **Component Adaptations**
- Navbar → MobileNavbar for mobile
- Grid layouts adapt to screen size
- Touch-friendly interfaces on mobile
- Optimized images for different screen densities

This comprehensive structure shows how SamanKhojo is built as a scalable, maintainable platform with clear separation of concerns, robust security, and excellent user experience across all device types.