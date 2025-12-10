import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAdminData, setAdminData } from '../../services/firestoreService';

interface TrendingItem {
  name: string;
  price: string;
  shopName: string;
  distance: string;
  icon: string;
}

interface HomepageSettings {
  trendingItems: TrendingItem[];
  showTrending: boolean;
  headline: string;
  description: string;
  bannerImage: string;
}

const HomepageEditor: React.FC = () => {
  const [settings, setSettings] = useState<HomepageSettings>({
    trendingItems: [],
    showTrending: false,
    headline: 'SamanKhojo',
    description: 'Khojo local dukaan. Dhoondho saman bina bhatakay.',
    bannerImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'trending'; index: number } | null>(null);
  const [newItem, setNewItem] = useState<TrendingItem>({
    name: '',
    price: '',
    shopName: '',
    distance: '',
    icon: '🛒'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getAdminData('homepage');
      if (data) {
        setSettings({
          trendingItems: data.trendingItems || [],
          showTrending: data.showTrending || false,
          headline: data.headline || 'SamanKhojo',
          description: data.description || 'Khojo local dukaan. Dhoondho saman bina bhatakay.',
          bannerImage: data.bannerImage || ''
        });
      }
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
      toast.error('Failed to load homepage settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setAdminData('homepage', settings);
      toast.success('Homepage settings saved successfully!');
    } catch (error) {
      console.error('Error saving homepage settings:', error);
      toast.error('Failed to save homepage settings');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'trending') => {
    if (!newItem.name || !newItem.price || !newItem.shopName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedSettings = { ...settings };
    updatedSettings.trendingItems = [...updatedSettings.trendingItems, newItem];

    setSettings(updatedSettings);
    setNewItem({ name: '', price: '', shopName: '', distance: '', icon: '🛒' });
    toast.success('Item added successfully!');
  };

  const removeItem = (type: 'trending', index: number) => {
    const updatedSettings = { ...settings };
    updatedSettings.trendingItems = updatedSettings.trendingItems.filter((_, i) => i !== index);
    setSettings(updatedSettings);
    toast.success('Item removed successfully!');
  };

  const updateItem = (type: 'trending', index: number, updatedItem: TrendingItem) => {
    const updatedSettings = { ...settings };
    updatedSettings.trendingItems[index] = updatedItem;
    setSettings(updatedSettings);
    setEditingItem(null);
    toast.success('Item updated successfully!');
  };

  const toggleVisibility = (type: 'trending') => {
    const updatedSettings = { ...settings };
    updatedSettings.showTrending = !updatedSettings.showTrending;
    setSettings(updatedSettings);
  };

  const commonIcons = ['🛒', '🥛', '🍚', '🧂', '🫒', '🍞', '🥔', '🧅', '🥕', '🍅', '🥬', '🌶️'];

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
          <h2 className="text-2xl font-bold text-gray-900">Homepage Editor</h2>
          <p className="text-gray-600">Customize homepage content and featured items</p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Main Content Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Headline
            </label>
            <input
              type="text"
              value={settings.headline}
              onChange={(e) => setSettings(prev => ({ ...prev, headline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image URL
            </label>
            <input
              type="url"
              value={settings.bannerImage}
              onChange={(e) => setSettings(prev => ({ ...prev, bannerImage: e.target.value }))}
              placeholder="https://localhost:5173/festival/diwali/banner.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Trending Items Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trending Items</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleVisibility('trending')}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                settings.showTrending 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {settings.showTrending ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{settings.showTrending ? 'Visible' : 'Hidden'}</span>
            </button>
          </div>
        </div>

        {/* Add New Item Form */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Add New Trending Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Price (e.g., ₹50)"
              value={newItem.price}
              onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Shop name"
              value={newItem.shopName}
              onChange={(e) => setNewItem(prev => ({ ...prev, shopName: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Distance (e.g., 500m)"
              value={newItem.distance}
              onChange={(e) => setNewItem(prev => ({ ...prev, distance: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-2">
              <select
                value={newItem.icon}
                onChange={(e) => setNewItem(prev => ({ ...prev, icon: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonIcons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <button
                onClick={() => addItem('trending')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Trending Items List */}
        <div className="space-y-2">
          {settings.trendingItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              {editingItem?.type === 'trending' && editingItem.index === index ? (
                <div className="flex-1 grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...settings.trendingItems];
                      updated[index] = { ...updated[index], name: e.target.value };
                      setSettings(prev => ({ ...prev, trendingItems: updated }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => {
                      const updated = [...settings.trendingItems];
                      updated[index] = { ...updated[index], price: e.target.value };
                      setSettings(prev => ({ ...prev, trendingItems: updated }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={item.shopName}
                    onChange={(e) => {
                      const updated = [...settings.trendingItems];
                      updated[index] = { ...updated[index], shopName: e.target.value };
                      setSettings(prev => ({ ...prev, trendingItems: updated }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    value={item.distance}
                    onChange={(e) => {
                      const updated = [...settings.trendingItems];
                      updated[index] = { ...updated[index], distance: e.target.value };
                      setSettings(prev => ({ ...prev, trendingItems: updated }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={item.icon}
                    onChange={(e) => {
                      const updated = [...settings.trendingItems];
                      updated[index] = { ...updated[index], icon: e.target.value };
                      setSettings(prev => ({ ...prev, trendingItems: updated }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {commonIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex-1 flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      {item.price} • {item.shopName} • {item.distance}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                {editingItem?.type === 'trending' && editingItem.index === index ? (
                  <button
                    onClick={() => setEditingItem(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingItem({ type: 'trending', index })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                )}
                <button
                  onClick={() => removeItem('trending', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Restock functionality removed as requested */}

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Preview</h3>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="text-xl font-bold text-gray-900 mb-2">{settings.headline}</h4>
          <p className="text-gray-600 mb-4">{settings.description}</p>
          
          {settings.showTrending && settings.trendingItems.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-gray-900 mb-2">🔥 Trending Near You</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {settings.trendingItems.slice(0, 4).map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-xs font-medium">{item.name}</div>
                    <div className="text-xs text-green-600">{item.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Restock preview removed */}
        </div>
      </div>
    </div>
  );
};

export default HomepageEditor;