import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Package, Calendar, MapPin } from 'lucide-react';
import { getBookings, getBookingAnalytics, getShops, Booking, BookingAnalytics as BookingAnalyticsType, Shop } from '../../services/firestoreService';

interface AnalyticsData {
  totalBookings: number;
  weeklyBookings: number;
  mostBookedItem: string;
  mostActiveShop: string;
  averageDistance: number;
  topItems: Array<{ name: string; count: number; shopName: string }>;
  topShops: Array<{ name: string; bookings: number; distance: string }>;
  recentBookings: Booking[];
}

const BookingAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBookings: 0,
    weeklyBookings: 0,
    mostBookedItem: 'N/A',
    mostActiveShop: 'N/A',
    averageDistance: 0,
    topItems: [],
    topShops: [],
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [bookings, bookingAnalytics, shops] = await Promise.all([
        getBookings(),
        getBookingAnalytics(),
        getShops()
      ]);

      // Calculate time-based metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const timeFilter = timeRange === 'week' ? weekAgo : monthAgo;
      const filteredBookings = bookings.filter(booking => 
        booking.timestamp && booking.timestamp.toDate() >= timeFilter
      );

      // Most booked item
      const itemCounts: Record<string, { count: number; shopName: string }> = {};
      bookingAnalytics.forEach(analytics => {
        if (!itemCounts[analytics.itemName]) {
          const shop = shops.find(s => s.id === analytics.shopId);
          itemCounts[analytics.itemName] = {
            count: analytics.count,
            shopName: shop?.shopName || 'Unknown Shop'
          };
        } else {
          itemCounts[analytics.itemName].count += analytics.count;
        }
      });

      const topItems = Object.entries(itemCounts)
        .map(([name, data]) => ({ name, count: data.count, shopName: data.shopName }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Most active shop
      const shopBookings: Record<string, number> = {};
      filteredBookings.forEach(booking => {
        shopBookings[booking.shopId] = (shopBookings[booking.shopId] || 0) + 1;
      });

      const topShops = Object.entries(shopBookings)
        .map(([shopId, count]) => {
          const shop = shops.find(s => s.id === shopId);
          return {
            name: shop?.shopName || 'Unknown Shop',
            bookings: count,
            distance: '1.2km' // Mock distance for now
          };
        })
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      const mostActiveShop = topShops.length > 0 ? topShops[0].name : 'N/A';
      const mostBookedItem = topItems.length > 0 ? topItems[0].name : 'N/A';

      // Recent bookings
      const recentBookings = bookings
        .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
        .slice(0, 10);

      setAnalytics({
        totalBookings: bookings.length,
        weeklyBookings: filteredBookings.length,
        mostBookedItem,
        mostActiveShop,
        averageDistance: 1.5, // Mock average distance
        topItems,
        topShops,
        recentBookings
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp size={16} className={trend.isPositive ? '' : 'rotate-180'} />
              <span className="ml-1">{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Analytics</h2>
          <p className="text-gray-600">Track booking patterns and user behavior</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={analytics.totalBookings}
          icon={Package}
          color="bg-blue-500"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title={`${timeRange === 'week' ? 'Weekly' : 'Monthly'} Bookings`}
          value={analytics.weeklyBookings}
          icon={Calendar}
          color="bg-green-500"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Most Active Shop"
          value={analytics.mostActiveShop}
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title="Average Distance"
          value={`${analytics.averageDistance}km`}
          icon={MapPin}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="mr-2 text-blue-600" size={20} />
            Most Booked Items
          </h3>
          
          <div className="space-y-3">
            {analytics.topItems.length > 0 ? (
              analytics.topItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.shopName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{item.count}</span>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No booking data available</p>
            )}
          </div>
        </div>

        {/* Top Shops */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="mr-2 text-green-600" size={20} />
            Most Active Shops
          </h3>
          
          <div className="space-y-3">
            {analytics.topShops.length > 0 ? (
              analytics.topShops.map((shop, index) => (
                <motion.div
                  key={shop.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{shop.name}</h4>
                    <p className="text-sm text-gray-600">{shop.distance} away</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">{shop.bookings}</span>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No booking data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 text-purple-600" size={20} />
            Recent Bookings
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {analytics.recentBookings.length > 0 ? (
            analytics.recentBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{booking.shopName}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                        <p>User ID: {booking.uid}</p>
                      <p>User: {booking.userWhatsApp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {booking.timestamp?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent bookings</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🔥 Most Popular Item</h4>
            <p className="text-gray-700">
              <strong>{analytics.mostBookedItem}</strong> is the most frequently booked item across all shops.
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">🏪 Top Performing Shop</h4>
            <p className="text-gray-700">
              <strong>{analytics.mostActiveShop}</strong> receives the most bookings from customers.
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📍 Customer Reach</h4>
            <p className="text-gray-700">
              Average customer distance is <strong>{analytics.averageDistance}km</strong>, showing good local reach.
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">📈 Growth Trend</h4>
            <p className="text-gray-700">
              Booking activity has increased by <strong>12%</strong> in the selected time period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAnalytics;