import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Trash2, 
  Settings, 
  Package, 
  Clock, 
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ProductAlert {
  id: string;
  productId: string;
  productName: string;
  shopName: string;
  shopId: string;
  originalSearchQuery: string;
  alertType: 'back_in_stock' | 'new_availability' | 'price_drop';
  createdAt: Date;
  triggeredAt?: Date;
  delivered: boolean;
  priority: 'high' | 'medium' | 'low';
  price?: number;
  status: 'active' | 'triggered' | 'dismissed';
}

interface AlertSettings {
  enableAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  maxAlertsPerProduct: number;
  autoDeleteAfterDays: number;
}

const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    enableAlerts: true,
    emailNotifications: true,
    pushNotifications: false,
    alertFrequency: 'immediate',
    maxAlertsPerProduct: 3,
    autoDeleteAfterDays: 30
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchAlerts();
      fetchSettings();
    }
  }, [user?.uid]);

  const fetchAlerts = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/${user.uid}/all`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAlerts(data.alerts || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/${user.uid}/settings`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings({ ...settings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Failed to fetch alert settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    if (!user?.uid) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/user/${user.uid}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setSettings(updatedSettings);
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        setSelectedAlerts(prev => {
          const newSet = new Set(prev);
          newSet.delete(alertId);
          return newSet;
        });
        toast.success('Alert deleted');
      } else {
        throw new Error('Failed to delete alert');
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const deleteSelectedAlerts = async () => {
    if (selectedAlerts.size === 0) return;

    try {
      const promises = Array.from(selectedAlerts).map(alertId => deleteAlert(alertId));
      await Promise.all(promises);
      setSelectedAlerts(new Set());
      toast.success(`${selectedAlerts.size} alerts deleted`);
    } catch (error) {
      toast.error('Failed to delete some alerts');
    }
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.status === filter;
    const matchesSearch = !searchQuery || 
      alert.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.originalSearchQuery.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'triggered': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'back_in_stock': return <Package className="text-green-600" size={16} />;
      case 'new_availability': return <Bell className="text-blue-600" size={16} />;
      case 'price_drop': return <AlertCircle className="text-orange-600" size={16} />;
      default: return <Bell className="text-gray-600" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Alert Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enable Alerts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-900">Product Alerts</h3>
              <p className="text-sm text-gray-600">Get notified when products become available</p>
            </div>
            <button
              onClick={() => updateSettings({ enableAlerts: !settings.enableAlerts })}
              className="flex items-center"
            >
              {settings.enableAlerts ? (
                <ToggleRight className="text-blue-600" size={32} />
              ) : (
                <ToggleLeft className="text-gray-400" size={32} />
              )}
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h3 className="font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive alerts via email</p>
            </div>
            <button
              onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
              className="flex items-center"
              disabled={!settings.enableAlerts}
            >
              {settings.emailNotifications && settings.enableAlerts ? (
                <ToggleRight className="text-blue-600" size={32} />
              ) : (
                <ToggleLeft className="text-gray-400" size={32} />
              )}
            </button>
          </div>

          {/* Alert Frequency */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Alert Frequency</h3>
            <select
              value={settings.alertFrequency}
              onChange={(e) => updateSettings({ alertFrequency: e.target.value as any })}
              disabled={!settings.enableAlerts}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>

          {/* Auto Delete */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Auto Delete After</h3>
            <select
              value={settings.autoDeleteAfterDays}
              onChange={(e) => updateSettings({ autoDeleteAfterDays: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Management */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Your Alerts</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredAlerts.length}
            </span>
          </div>

          {selectedAlerts.size > 0 && (
            <button
              onClick={deleteSelectedAlerts}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              <span>Delete Selected ({selectedAlerts.size})</span>
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {['all', 'active', 'triggered', 'dismissed'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => toggleAlertSelection(alert.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getAlertTypeIcon(alert.alertType)}
                        <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                        {alert.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                            HIGH
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Shop: <span className="font-medium">{alert.shopName}</span></p>
                        <p>Original search: "<span className="font-medium">{alert.originalSearchQuery}</span>"</p>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                          </span>
                          {alert.triggeredAt && (
                            <span className="flex items-center space-x-1">
                              <CheckCircle size={14} className="text-green-600" />
                              <span>Triggered: {new Date(alert.triggeredAt).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <BellOff className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any product alerts yet. Search for products to start getting notified when they become available."
                  : `No ${filter} alerts found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;