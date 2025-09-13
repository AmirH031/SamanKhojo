import { getOptimizedShops } from './optimizedSearchService';
import { api } from './api';

export interface TrendingItem {
  name: string;
  price?: number; // Optional price as number for consistency
  shopName: string;
  distance: string;
  icon: string;
}

export interface PopularShop {
  name: string;
  rating: number;
  bookings: number;
  distance: string;
}

export interface HomepageSettings {
  trendingItems: TrendingItem[];
  showTrending: boolean;
}

export const getHomepageSettings = async (): Promise<HomepageSettings> => {
  try {
    const response = await api.get<HomepageSettings>('/admin-data/homepage');
    return response;
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return {
      trendingItems: [],
      showTrending: false
    };
  }
};

export const updateHomepageSettings = async (settings: HomepageSettings): Promise<void> => {
  try {
    await api.post('/admin-data/homepage', settings);
  } catch (error) {
    console.error('Error updating homepage settings:', error);
    throw error;
  }
};

export const getTrendingItems = async (): Promise<TrendingItem[]> => {
  try {
    const settings = await getHomepageSettings();
    return settings.showTrending ? settings.trendingItems : [];
  } catch (error) {
    console.error('Error getting trending items:', error);
    return [];
  }
};

// Removed restock functionality as requested

export const getPopularShops = async (): Promise<PopularShop[]> => {
  try {
    // Get featured shops as popular shops
    const shops = await getOptimizedShops();
    return shops
      .filter(shop => shop.isFeatured)
      .map(shop => ({
        name: shop.shopName,
        rating: shop.ratings.length > 0 
          ? Math.round((shop.ratings.reduce((sum, r) => sum + r, 0) / shop.ratings.length) * 10) / 10
          : 4.5,
        bookings: Math.floor(Math.random() * 50 + 10),
        distance: Math.floor(Math.random() * 2000 + 300) + "m"
      }))
      .slice(0, 3);
  } catch (error) {
    console.error('Error getting popular shops:', error);
    return [];
  }
};