import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Search, Star, X 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, getItems, Shop } from '../../services/firestoreService';
import { Item } from '../../types/Item';
import {
  getTrendingItems,
  addTrendingItem,
  updateTrendingItem,
  deleteTrendingItem,
  toggleTrendingItemStatus,
  setTrendingItemPriority,
  TrendingItem,
  TrendingItemInput
} from '../../services/trendingService';

const TrendingManager: React.FC = () => {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TrendingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [formData, setFormData] = useState<TrendingItemInput>({
    itemId: '',
    shopId: '',
    itemName: '',
    shopName: '',
    category: '',
    priority: 1,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.shopId) {
      fetchItemsForShop(formData.shopId);
    }
  }, [formData.shopId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trendingData, shopsData] = await Promise.all([
        getTrendingItems(),
        getShops(true) // Include hidden shops for admin
      ]);
      
      setTrendingItems(trendingData);
      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.message?.includes('Missing or insufficient permissions')) {
        toast.error('Permission error: Please check Firestore rules for trendingItems collection');
      } else {
        toast.error('Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsForShop = async (shopId: string) => {
    try {
      const itemsData = await getItems(shopId);
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId || !formData.shopId) {
      toast.error('Please select both shop and item');
      return;
    }

    try {
      if (editingItem) {
        await updateTrendingItem(editingItem.id, formData);
        toast.success('Trending item updated successfully!');
      } else {
        await addTrendingItem(formData);
        toast.success('Trending item added successfully!');
      }
      
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving trending item:', error);
      toast.error('Failed to save trending item');
    }
  };

  const handleEdit = (item: TrendingItem) => {
    setEditingItem(item);
    setFormData({
      itemId: item.itemId,
      shopId: item.shopId,
      itemName: item.itemName,
      shopName: item.shopName,
      category: item.category || '',
      priority: item.priority,
      isActive: item.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this trending item?')) return;

    try {
      await deleteTrendingItem(itemId);
      toast.success('Trending item removed successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error deleting trending item:', error);
      toast.error('Failed to remove trending item');
    }
  };

  const handleToggleStatus = async (itemId: string) => {
    try {
      await toggleTrendingItemStatus(itemId);
      toast.success('Trending item status updated!');
      await fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (itemId: string, newPriority: number) => {
    try {
      await setTrendingItemPriority(itemId, newPriority);
      toast.success('Priority updated!');
      await fetchData();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      shopId: '',
      itemName: '',
      shopName: '',
      category: '',
      priority: 1,
      isActive: true
    });
    setEditingItem(null);
    setShowForm(false);
    setItems([]);
  };

  const handleShopChange = (shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    setFormData(prev => ({
      ...prev,
      shopId,
      shopName: shop?.shopName || '',
      itemId: '',
      itemName: ''
    }));
  };

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setFormData(prev => ({
      ...prev,
      itemId,
      itemName: item?.name || '',
      category: item?.category || ''
    }));
  };

  const filteredTrendingItems = trendingItems.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-orange-500" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trending Items</h2>
            <p className="text-gray-600">Manage trending items for "Trending Near You" section</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Trending Item</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search trending items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Trending Item' : 'Add Trending Item'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Shop *
                  </label>
                  <select
                    value={formData.shopId}
                    onChange={(e) => handleShopChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a shop</option>
                    {shops.map(shop => (
                      <option key={shop.id} value={shop.id}>
                        {shop.shopName} ({shop.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Item *
                  </label>
                  <select
                    value={formData.itemId}
                    onChange={(e) => handleItemChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.shopId}
                  >
                    <option value="">Choose an item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.category && `(${item.category})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher numbers appear first</p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Items List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Trending Items ({filteredTrendingItems.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTrendingItems.length > 0 ? (
            filteredTrendingItems.map((item, index) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className="text-orange-500" size={20} />
                      <h4 className="text-lg font-semibold text-gray-900">{item.itemName}</h4>
                      <div className="flex space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Priority: {item.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Shop:</strong> {item.shopName}</p>
                      {item.category && <p><strong>Category:</strong> {item.category}</p>}
                      <p><strong>Added:</strong> {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* Priority Controls */}
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handlePriorityChange(item.id, item.priority + 1)}
                        disabled={item.priority >= 10}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Increase priority"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handlePriorityChange(item.id, item.priority - 1)}
                        disabled={item.priority <= 1}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Decrease priority"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.isActive
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={item.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trending items found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Start by adding your first trending item'}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingManager;