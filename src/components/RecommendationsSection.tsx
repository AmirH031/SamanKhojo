import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ShopCard } from './ShopCard';
import ItemCard from './ItemCard';
import axios from 'axios';

interface RecommendationItem {
  id: string;
  name: string;
  price: number;
  category: string;
  shopId: string;
  stock: number;
  rating?: number;
  image?: string;
  reason?: string;
  confidence?: number;
  finalScore?: number;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  value: number;
  type: string;
  category: string;
  validUntil: string;
}

interface RecommendationsData {
  personalized: RecommendationItem[];
  trending: RecommendationItem[];
  promotions: Promotion[];
  newArrivals: RecommendationItem[];
  isPersonalized: boolean;
}

const RecommendationsSection: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'new'>('personalized');

  useEffect(() => {
    // Temporarily disabled API calls - will be enabled in future update
    setLoading(false);
    setRecommendations({
      personalized: [],
      trending: [],
      promotions: [],
      newArrivals: [],
      isPersonalized: false
    });
  }, [user]);

  const fetchRecommendations = async () => {
    // API calls temporarily disabled - will be enabled in future update
    console.log('Recommendations API temporarily disabled');
  };

  const trackInteraction = async (type: string, itemId: string, additionalData: any = {}) => {
    // Tracking temporarily disabled - will be enabled in future update
    console.log('Interaction tracking temporarily disabled:', { type, itemId, additionalData });
  };

  const handleItemClick = (item: RecommendationItem) => {
    trackInteraction('view', item.id, {
      itemName: item.name,
      category: item.category,
      price: item.price,
      source: activeTab
    });
  };

  const handleAddToBag = (item: RecommendationItem) => {
    trackInteraction('add_to_bag', item.id, {
      itemName: item.name,
      category: item.category,
      price: item.price,
      quantity: 1
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          <div className="text-blue-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recommendations Coming Soon!</h3>
          <p className="text-gray-500">We're working on personalized recommendations for you.</p>
        </div>
      </div>
    );
  }

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'personalized':
        return recommendations.personalized;
      case 'trending':
        return recommendations.trending;
      case 'new':
        return recommendations.newArrivals;
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {recommendations.isPersonalized ? 'Recommended for You' : 'Discover Products'}
          </h2>
          
          {recommendations.isPersonalized && (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Personalized
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {recommendations.isPersonalized && recommendations.personalized.length > 0 && (
            <button
              onClick={() => setActiveTab('personalized')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'personalized'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For You ({recommendations.personalized.length})
            </button>
          )}
          
          {recommendations.trending.length > 0 && (
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trending ({recommendations.trending.length})
            </button>
          )}
          
          {recommendations.newArrivals.length > 0 && (
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'new'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Arrivals ({recommendations.newArrivals.length})
            </button>
          )}
        </div>
      </div>

      {/* Promotions Banner */}
      {recommendations.promotions.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Special Offers</h3>
              <p className="text-sm text-gray-600">
                {recommendations.promotions[0].title} - {recommendations.promotions[0].description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {recommendations.promotions[0].type === 'percentage' ? `${recommendations.promotions[0].value}% OFF` : `₹${recommendations.promotions[0].value} OFF`}
              </div>
              <div className="text-xs text-gray-500">
                Valid until {recommendations.promotions[0].validUntil 
                  ? new Date(recommendations.promotions[0].validUntil.seconds 
                      ? recommendations.promotions[0].validUntil.seconds * 1000 
                      : recommendations.promotions[0].validUntil
                    ).toLocaleDateString()
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="p-6">
        {currentItems.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer"
              >
                <ItemCard 
                  item={item}
                  onAddToBag={() => handleAddToBag(item)}
                  showRecommendationReason={activeTab === 'personalized'}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 7.414V9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
            <p className="text-gray-500">
              {activeTab === 'personalized' 
                ? 'Start shopping to get personalized recommendations!'
                : 'Check back later for new items.'}
            </p>
          </div>
        )}
      </div>

      {/* Search Help Hint */}
      {recommendations.isPersonalized && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Need help finding something specific?
            </div>
            <button 
              onClick={() => {
                // Navigate to search page
                window.location.href = '/search';
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Search Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;