import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Package, 
  Star, 
  Sparkles,
  Filter,
  Search,
  Download,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { 
  Item, 
  ItemInput, 
  ItemType,
  isProduct,
  isMenu,
  isService,
  validateItem,
  normalizeItemData
} from '../../types/Item';
import { 
  getItems,
  addItem, 
  updateItem, 
  deleteItem, 
  addBulkItems 
} from '../../services/itemService';
import { getShops, Shop } from '../../services/firestoreService';
import { generateHindiName, parseItemCSV, getDefaultCategories } from '../../services/itemService';

// Deprecation notice component
const DeprecationNotice: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"
  >
    <div className="flex items-start space-x-3">
      <AlertTriangle className="text-amber-600 mt-1" size={20} />
      <div>
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Legacy Item Manager</h3>
        <p className="text-amber-800 text-sm mb-3">
          This is the legacy item manager. For better shop-connected item management, 
          please use the new <strong>Enhanced Item Manager</strong> which provides:
        </p>
        <ul className="text-amber-700 text-sm space-y-1 mb-4">
          <li>• Smart shop-type filtering and auto-selection</li>
          <li>• Integrated shop and item management workflow</li>
          <li>• Better category linking and validation</li>
          <li>• Improved mobile-first UI design</li>
        </ul>
        <div className="bg-amber-100 rounded-lg p-3">
          <p className="text-amber-800 text-xs font-medium">
            💡 Recommendation: Switch to Enhanced Item Manager for the best experience
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);
const ItemManager: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // Filters
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [selectedType, setSelectedType] = useState<ItemType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<ItemInput>({
  shopId: '',
  type: 'product',
  name: '',
  description: '',
  price: '',
  category: '',
  availability: true,
  inStock: true // default for products
  });

  // Bulk upload state
  const [csvData, setCsvData] = useState('');
  const [bulkShopId, setBulkShopId] = useState('');
  const [bulkType, setBulkType] = useState<ItemType>('product');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedShop || selectedType) {
      loadData();
    }
  }, [selectedShop, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const shopsData = await getShops(true); // Include hidden shops for admin
      setShops(shopsData);
      
      // Load items for all shops if admin
      if (shopsData.length > 0) {
        const allItemsPromises = shopsData.map(shop => 
          getItems(shop.id, selectedType || undefined, true) // Include unavailable items for admin
        );
        const allItemsArrays = await Promise.all(allItemsPromises);
        const allItems = allItemsArrays.flat();
        setItems(allItems);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const errors = validateItem(formData);
      if (errors.length > 0) {
        toast.error(`Validation errors: ${errors.join(', ')}`);
        return;
      }

      if (editingItem) {
        await updateItem(editingItem.shopId, editingItem.id, formData);
        toast.success('Item updated successfully');
      } else {
        await addItem(formData);
        toast.success('Item added successfully');
      }

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      shopId: item.shopId,
      type: item.type,
      name: item.name,
      description: item.description || '',
      price: item.price || '',
      category: item.category || '',
      availability: item.availability !== false,
      inStock: isProduct(item) ? !!item.inStock : undefined,
      hindi_name: item.hindi_name || '',
      brand_name: item.brand_name || '',
      variety: item.variety || '',
      unit: item.type === 'menu' || item.type === 'service' ? (item.unit || '') : undefined
    });
    setShowForm(true);
  };

  const handleDelete = async (item: Item) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItem(item.shopId, item.id);
      toast.success('Item deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleBulkUpload = async () => {
    try {
      if (!csvData.trim() || !bulkShopId) {
        toast.error('Please provide CSV data and select a shop');
        return;
      }

      const parsedItems = parseItemCSV(csvData, bulkType);
      await addBulkItems(bulkShopId, parsedItems);
      
      toast.success(`Successfully uploaded ${parsedItems.length} items`);
      setShowBulkUpload(false);
      setCsvData('');
      setBulkShopId('');
      loadData();
    } catch (error) {
      console.error('Error bulk uploading:', error);
      toast.error(`Bulk upload failed: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      shopId: '',
      type: 'product',
      name: '',
      description: '',
      price: '',
      category: '',
      availability: true,
      inStock: true
    });
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      hindi_name: prev.hindi_name || generateHindiName(name)
    }));
  };

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4 text-green-600" />;
      case 'menu': return <Star className="w-4 h-4 text-blue-600" />;
      case 'service': return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'product': return 'bg-green-100 text-green-800';
      case 'menu': return 'bg-blue-100 text-blue-800';
      case 'service': return 'bg-purple-100 text-purple-800';
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedShop && item.shopId !== selectedShop) return false;
    if (selectedType && item.type !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.hindi_name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const generateCSVTemplate = (type: ItemType) => {
    // Required: name; Optional: hindi_name, category, type, variety, brand_name, price, unit, availability, inStock (required for products)
    // For products: inStock is required (boolean), unit is not included
    const baseHeaders = ['name'];
    const optionalHeaders = ['hindi_name', 'category', 'type', 'variety', 'brand_name', 'price', 'availability'];
    if (type === 'product') {
      return baseHeaders.concat(optionalHeaders).concat(['inStock']).join(',') + '\n';
    } else {
      return baseHeaders.concat(optionalHeaders).concat(['unit', 'inStock']).join(',') + '\n';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deprecation Notice */}
      <DeprecationNotice />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="text-blue-500" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Legacy Item Manager</h2>
            <p className="text-gray-600">Basic item management (consider upgrading to Enhanced Item Manager)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.shopName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ItemType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="product">Products</option>
              <option value="menu">Menu Items</option>
              <option value="service">Services</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const shop = shops.find(s => s.id === item.shopId);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name || (item.type === 'service' && item.description 
                            ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '')
                            : 'Service Item')}
                        </div>
                        {item.hindi_name && (
                          <div className="text-sm text-gray-500">{item.hindi_name}</div>
                        )}
                        {item.type === 'service' && item.description && !item.name && (
                          <div className="text-xs text-purple-600 mt-1">
                            Service Description
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {shop?.shopName || 'Unknown Shop'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price ? `₹${item.price}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.availability !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.availability !== false ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items found matching your criteria
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop *
                    </label>
                    <select
                      value={formData.shopId}
                      onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Shop</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.shopName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ItemType }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="product">Product</option>
                      <option value="menu">Menu Item</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name {formData.type !== 'service' ? '*' : '(Optional for services)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required={formData.type !== 'service'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.type === 'service' ? 'Optional - leave empty to use description as name' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hindi Name
                  </label>
                  <input
                    type="text"
                    value={formData.hindi_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hindi_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Type-specific fields */}
                {formData.type === 'product' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        value={formData.inStock || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, inStock: parseInt(e.target.value) || 0 }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variety
                      </label>
                      <input
                        type="text"
                        value={formData.variety || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {(formData.type === 'menu' || formData.type === 'service') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., plate, bowl, glass"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {formData.type === 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In Stock
                    </label>
                    <select
                      value={formData.inStock === true ? 'true' : 'false'}
                      onChange={e => setFormData(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                )}

                {formData.type === 'service' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Description / Key Point
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Describe the service or key point about this shop (e.g., 'Professional hair cutting and styling', 'Mobile repair with warranty', 'Home delivery available')"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Add a single service or key point about what this shop offers
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="availability"
                    checked={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="availability" className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bulk Upload Items</h3>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop *
                    </label>
                    <select
                      value={bulkShopId}
                      onChange={(e) => setBulkShopId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Shop</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.shopName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Type *
                    </label>
                    <select
                      value={bulkType}
                      onChange={(e) => setBulkType(e.target.value as ItemType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="product">Products</option>
                      <option value="menu">Menu Items</option>
                      <option value="service">Services</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CSV Data *
                    </label>
                    <button
                      onClick={() => {
                        const template = generateCSVTemplate(bulkType);
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${bulkType}_template.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={10}
                    placeholder="Paste your CSV data here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">CSV Format Instructions:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• First row should contain column headers</li>
                    <li>• Required column: <b>name</b></li>
                    <li>• For products: <b>inStock</b> is required (true/false), <b>unit</b> is not used</li>
                    <li>• Optional columns: hindi_name, category, type, variety, brand_name, price, availability, unit (for menu/services), inStock (for menu/services)</li>
                    <li>• Use comma (,) as field separator</li>
                    <li>• Hindi names will be auto-generated if not provided</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!csvData.trim() || !bulkShopId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Items
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ItemManager;