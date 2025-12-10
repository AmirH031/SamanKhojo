import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface AnalyticsData {
  totalShops: number;
  totalItems: number;
  totalBookings: number;
  totalReviews: number;
  dailyStats: DailyStats[];
  topShops: TopShop[];
  topSearches: TopSearch[];
  topBookedItems: TopBookedItem[];
  recentActivity: RecentActivity[];
}

export interface DailyStats {
  date: string;
  bookings: number;
  searches: number;
  newUsers: number;
  reviews: number;
}

export interface TopShop {
  id: string;
  name: string;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
}

export interface TopSearch {
  query: string;
  count: number;
  lastSearched: Date;
}

export interface TopBookedItem {
  itemName: string;
  shopName: string;
  bookingCount: number;
  lastBooked: Date;
}

export interface RecentActivity {
  type: 'booking' | 'review' | 'search' | 'signup';
  description: string;
  timestamp: Date;
  userId?: string;
  shopId?: string;
}

// Get comprehensive analytics data
export const getAnalyticsData = async (days: number = 30): Promise<AnalyticsData> => {
  try {
    const [
      totalShops,
      totalItems,
      totalBookings,
      totalReviews,
      dailyStats,
      topShops,
      topSearches,
      topBookedItems,
      recentActivity
    ] = await Promise.all([
      getTotalShops(),
      getTotalItems(),
      getTotalBookings(),
      getTotalReviews(),
      getDailyStats(days),
      getTopShops(),
      getTopSearches(),
      getTopBookedItems(),
      getRecentActivity()
    ]);

    return {
      totalShops,
      totalItems,
      totalBookings,
      totalReviews,
      dailyStats,
      topShops,
      topSearches,
      topBookedItems,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

// Get total counts
const getTotalShops = async (): Promise<number> => {
  const shopsRef = collection(db, 'shops');
  const snapshot = await getDocs(shopsRef);
  return snapshot.size;
};

const getTotalItems = async (): Promise<number> => {
  // Use collection group to count all items across all shops
  const { collectionGroup } = await import('firebase/firestore');
  const itemsRef = collectionGroup(db, 'items');
  const snapshot = await getDocs(itemsRef);
  return snapshot.size;
};

const getTotalBookings = async (): Promise<number> => {
  const bookingsRef = collection(db, 'bookings');
  const snapshot = await getDocs(bookingsRef);
  return snapshot.size;
};

const getTotalReviews = async (): Promise<number> => {
  // Count reviews across all shops
  const shopsRef = collection(db, 'shops');
  const shopsSnapshot = await getDocs(shopsRef);
  
  let totalReviews = 0;
  for (const shopDoc of shopsSnapshot.docs) {
    const reviewsRef = collection(db, 'shops', shopDoc.id, 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
    totalReviews += reviewsSnapshot.size;
  }
  
  return totalReviews;
};

// Get daily statistics
const getDailyStats = async (days: number): Promise<DailyStats[]> => {
  const stats: DailyStats[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Get bookings for this date
    const bookingsRef = collection(db, 'bookings');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookingsQuery = query(
      bookingsRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay))
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    // Get searches for this date (from logs)
    const logsRef = collection(db, 'logs');
    const searchQuery = query(
      logsRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      where('type', '==', 'incoming')
    );
    const searchSnapshot = await getDocs(searchQuery);
    
    // Get new users for this date
    const usersRef = collection(db, 'users');
    const usersQuery = query(
      usersRef,
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay))
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    stats.push({
      date: dateStr,
      bookings: bookingsSnapshot.size,
      searches: searchSnapshot.size,
      newUsers: usersSnapshot.size,
      reviews: 0 // TODO: Implement review counting by date
    });
  }
  
  return stats.reverse(); // Oldest first
};

// Get top shops by bookings and reviews
const getTopShops = async (): Promise<TopShop[]> => {
  try {
    const shopsRef = collection(db, 'shops');
    const shopsSnapshot = await getDocs(shopsRef);
    
    const shopStats: TopShop[] = [];
    
    for (const shopDoc of shopsSnapshot.docs) {
      const shopData = shopDoc.data();
      
      // Get booking count for this shop
      const bookingsRef = collection(db, 'bookings');
      const bookingsQuery = query(bookingsRef, where('shopId', '==', shopDoc.id));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Get reviews for this shop
      const reviewsRef = collection(db, 'shops', shopDoc.id, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);
      
      shopStats.push({
        id: shopDoc.id,
        name: shopData.shopName,
        totalBookings: bookingsSnapshot.size,
        averageRating: shopData.averageRating || 0,
        totalReviews: reviewsSnapshot.size
      });
    }
    
    // Sort by total bookings + reviews
    return shopStats
      .sort((a, b) => (b.totalBookings + b.totalReviews) - (a.totalBookings + a.totalReviews))
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting top shops:', error);
    return [];
  }
};

// Get top search queries
const getTopSearches = async (): Promise<TopSearch[]> => {
  try {
    const logsRef = collection(db, 'logs');
    const q = query(
      logsRef,
      where('type', '==', 'incoming'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    const snapshot = await getDocs(q);
    
    const searchCounts: { [key: string]: { count: number; lastSearched: Date } } = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.message) {
        const query = data.message.toLowerCase().trim();
        if (query.length > 2) {
          if (!searchCounts[query]) {
            searchCounts[query] = { count: 0, lastSearched: new Date() };
          }
          searchCounts[query].count++;
          const timestamp = data.timestamp?.toDate() || new Date();
          if (timestamp > searchCounts[query].lastSearched) {
            searchCounts[query].lastSearched = timestamp;
          }
        }
      }
    });
    
    return Object.entries(searchCounts)
      .map(([query, data]) => ({
        query,
        count: data.count,
        lastSearched: data.lastSearched
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting top searches:', error);
    return [];
  }
};

// Get top booked items
const getTopBookedItems = async (): Promise<TopBookedItem[]> => {
  try {
    const analyticsRef = collection(db, 'bookingAnalytics');
    const q = query(analyticsRef, orderBy('count', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    const topItems: TopBookedItem[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get shop name
      const shopRef = doc(db, 'shops', data.shopId);
      const shopSnapshot = await getDoc(shopRef);
      const shopName = shopSnapshot.exists() ? shopSnapshot.data()?.shopName : 'Unknown Shop';
      
      topItems.push({
        itemName: data.itemName,
        shopName,
        bookingCount: data.count,
        lastBooked: data.lastBookedAt?.toDate() || new Date()
      });
    }
    
    return topItems;
  } catch (error) {
    console.error('Error getting top booked items:', error);
    return [];
  }
};

// Get recent activity
const getRecentActivity = async (): Promise<RecentActivity[]> => {
  try {
    const activities: RecentActivity[] = [];
    
    // Recent bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(bookingsRef, orderBy('timestamp', 'desc'), limit(5));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    bookingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        type: 'booking',
        description: `New booking at ${data.shopName}`,
        timestamp: data.timestamp?.toDate() || new Date(),
        userId: data.uid,
        shopId: data.shopId
      });
    });
    
    // Recent reviews
    const shopsRef = collection(db, 'shops');
    const shopsSnapshot = await getDocs(query(shopsRef, limit(10)));
    
    for (const shopDoc of shopsSnapshot.docs) {
      const reviewsRef = collection(db, 'shops', shopDoc.id, 'reviews');
      const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'), limit(2));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      reviewsSnapshot.docs.forEach(reviewDoc => {
        const reviewData = reviewDoc.data();
        activities.push({
          type: 'review',
          description: `${reviewData.userName} reviewed ${shopDoc.data().shopName}`,
          timestamp: reviewData.createdAt?.toDate() || new Date(),
          userId: reviewData.userId,
          shopId: shopDoc.id
        });
      });
    }
    
    // Recent searches
    const logsRef = collection(db, 'logs');
    const searchQuery = query(
      logsRef,
      where('type', '==', 'incoming'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const searchSnapshot = await getDocs(searchQuery);
    
    searchSnapshot.docs.forEach(doc => {
      const data = doc.data();
      activities.push({
        type: 'search',
        description: `Search: "${data.message}"`,
        timestamp: data.timestamp?.toDate() || new Date(),
        userId: data.phoneNumber
      });
    });
    
    // Sort by timestamp and return latest 20
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

// Export analytics data as CSV
export const exportAnalyticsCSV = async (): Promise<void> => {
  try {
    const data = await getAnalyticsData(30);
    
    // Create CSV content
    const csvContent = [
      // Header
      'Date,Bookings,Searches,New Users,Reviews',
      // Data rows
      ...data.dailyStats.map(stat => 
        `${stat.date},${stat.bookings},${stat.searches},${stat.newUsers},${stat.reviews}`
      )
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    throw error;
  }
};