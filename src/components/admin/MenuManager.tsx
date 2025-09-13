import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit, Trash2, Upload, ChefHat, Package, Eye, EyeOff, Languages 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, Shop } from '../../services/firestoreService';
import { Item, ItemInput } from '../../types/Item';
import { 
  getAllItems, addItem, updateItem, deleteItem, addBulkItems
} from '../../services/itemService';

// Legacy type aliases for backward compatibility
type MenuItem = Item;
type MenuItemInput = ItemInput;
import MenuItemForm from './MenuItemForm';
import MenuBulkUpload from './MenuBulkUpload.tsx';

const MenuManager: React.FC = () => {
  // ---------------- STATE ----------------
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // ---------------- EFFECTS ----------------
  useEffect(() => { fetchShops(); }, []);
  useEffect(() => { if (selectedShopId) fetchMenuItems(); }, [selectedShopId]);
  useEffect(() => { filterItems(); }, [menuItems, searchTerm, categoryFilter, showUnavailable]);

  // ---------------- FETCH ----------------
  const fetchShops = async () => {
    try {
      const shopsData = await getShops();
      const foodShops = shopsData.filter(shop => ['restaurant', 'cafe', 'hotel'].includes(shop.type));
      setShops(foodShops);
      if (foodShops.length > 0) setSelectedShopId(foodShops[0].id);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    }
  };

  const fetchMenuItems = async () => {
    if (!selectedShopId) return;
    setLoading(true);
    try {
      const items = await getAllItems(selectedShopId, 'menu');
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CRUD ----------------
  const handleAddItem = async (itemData: MenuItemInput) => {
    try {
      await addItem({ ...itemData, type: 'menu' });
      toast.success('Menu item added successfully!');
      setShowForm(false);
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      toast.error(error.message || 'Failed to add menu item');
    }
  };

  const handleUpdateItem = async (itemData: MenuItemInput) => {
    if (!editingItem) return;
    try {
      await updateItem(editingItem.id, { ...itemData, type: 'menu' });
      toast.success('Menu item updated successfully!');
      setEditingItem(null);
      setShowForm(false);
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      toast.error(error.message || 'Failed to update menu item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteItem(itemId);
      toast.success('Menu item deleted successfully!');
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Failed to delete menu item');
    }
  };

  const handleBulkUpload = async (items: Omit<MenuItemInput, 'shopId'>[]) => {
    try {
      await addBulkItems(selectedShopId, items.map(item => ({ ...item, type: 'menu' })));
      toast.success(`Successfully uploaded ${items.length} menu items!`);
      setShowBulkUpload(false);
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error bulk uploading menu items:', error);
      toast.error(error.message || 'Failed to upload menu items');
    }
  };

  // ---------------- FILTER ----------------
  const filterItems = () => {
    let filtered = menuItems;
    if (!showUnavailable) filtered = filtered.filter(item => item.isAvailable);
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.hindi_name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    if (categoryFilter) filtered = filtered.filter(item => item.category === categoryFilter);
    setFilteredItems(filtered);
  };

  const getUniqueCategories = () => {
    const categories = new Set(menuItems.map(item => item.category).filter(Boolean));
    return Array.from(categories);
  };

  const selectedShop = shops.find(shop => shop.id === selectedShopId);

  // ---------------- UI ----------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChefHat className="text-orange-500" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
            <p className="text-gray-600">Manage restaurant menus with bilingual support</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
          >
            <Upload size={18} />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Shop Selection with Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Restaurant</h3>
          <span className="text-sm text-gray-500">{shops.length} restaurants</span>
        </div>
        
        <div className="space-y-4">
          {/* Shop Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shop Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
            {shops
              .filter(shop => 
                shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((shop) => (
                <motion.div
                  key={shop.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedShopId(shop.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedShopId === shop.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {shop.shopName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{shop.shopName}</h4>
                      <p className="text-sm text-gray-500 truncate">{shop.address}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full capitalize">
                          {shop.type}
                        </span>
                        {selectedShopId === shop.id && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </div>

      {/* Menu Items Management */}
      {selectedShopId && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          {/* Header with Stats */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Package className="text-blue-500" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Menu Items - {selectedShop?.shopName}
                  </h3>
                  <p className="text-gray-600">
                    {menuItems.length} total items • {filteredItems.length} showing
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowUnavailable(!showUnavailable)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    showUnavailable 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showUnavailable ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="text-sm">
                    {showUnavailable ? 'Hide' : 'Show'} Unavailable
                  </span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Available: {menuItems.filter(i => i.isAvailable).length}</span>
                <span>Categories: {getUniqueCategories().length}</span>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || categoryFilter 
                    ? 'Try adjusting your filters' 
                    : 'Start by adding your first menu item'
                  }
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-xl border-2 p-4 hover:shadow-lg transition-all ${
                        item.isAvailable ? 'border-gray-200' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                          {item.hindi_name && (
                            <p className="text-sm text-gray-600 mb-2 flex items-center">
                              <Languages size={14} className="mr-1" />
                              {item.hindi_name}
                            </p>
                          )}
                          {item.category && (
                            <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full mb-2">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowForm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.price && (
                            <span className="font-bold text-green-600">₹{item.price}</span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.isAvailable 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Menu Item Form Modal */}
      <AnimatePresence>
        {showForm && (
          <MenuItemForm
            shopId={selectedShopId}
            item={editingItem}
            onSubmit={editingItem ? handleUpdateItem : handleAddItem}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUpload && (
          <MenuBulkUpload
            shopId={selectedShopId}
            shopName={selectedShop?.shopName || ''}
            onUpload={handleBulkUpload}
            onCancel={() => setShowBulkUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuManager;
