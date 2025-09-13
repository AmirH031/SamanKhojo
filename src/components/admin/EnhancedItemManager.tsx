import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Store, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Tag,
  Star,
  Sparkles,
  Upload,
  Download,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, Shop } from '../../services/firestoreService';
import { getItems, addItem, updateItem, deleteItem, addBulkItems } from '../../services/itemService';
import { Item, ItemType, ItemInput } from '../../types/Item';
import SmartShopSelector from './SmartShopSelector';
import EnhancedBulkUpload from './EnhancedBulkUpload';
import { generateHindiName } from '../../services/transliterationService';

const EnhancedItemManager: React.FC = () => {
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedType, setSelectedType] = useState<ItemType | ''>('');
  const [items, setItems] = useState<Item[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'shops' | 'items'>('shops');
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState<ItemInput>({
    shopId: '',
    type: 'product',
    name: '',
    description: '',
    price: '',
    category: '',
    availability: true
  });

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, selectedType, searchQuery]);

  useEffect(() => {
    if (selectedShop) {
      loadShopItems();
    }
  }, [selectedShop, selectedType]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const shopsData = await getShops(true);
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Filter by type if selected - show all shops that can have this item type
    if (selectedType) {
      if (selectedType === 'product') {
        // Products can be in any shop type
        filtered = shops;
      } else if (selectedType === 'menu') {
        // Menu items only in restaurants, cafes, hotels
        filtered = filtered.filter(shop => 
          shop.shopType === 'menu' || 
          ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '')
        );
      } else if (selectedType === 'service') {
        // Services can be in service shops or any shop offering services
        filtered = filtered.filter(shop => 
          shop.shopType === 'service' || 
          shop.serviceDetails?.length > 0
        );
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.shopName.toLowerCase().includes(query) ||
        shop.ownerName.toLowerCase().includes(query) ||
        shop.type.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query)
      );
    }

    setFilteredShops(filtered);
  };

  const loadShopItems = async () => {
    if (!selectedShop) return;

    try {
      setItemsLoading(true);
      const itemsData = await getItems(selectedShop.id, selectedType || undefined, true);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setViewMode('items');
    
    // Auto-select type based on shop characteristics
    if (selectedType === '') {
      if (shop.shopType === 'menu' || ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '')) {
        setSelectedType('menu');
      } else if (shop.shopType === 'service' || shop.serviceDetails?.length > 0) {
        setSelectedType('service');
      } else {
        setSelectedType('product');
      }
    }
  };

  const handleTypeSelect = (type: ItemType) => {
    setSelectedType(type);
    setSelectedShop(null);
    setViewMode('shops');
  };

  const handleAddItem = () => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    setFormData({
      shopId: selectedShop.id,
      type: selectedType || 'product',
      name: '',
      hindi_name: '',
      description: '',
      price: '',
      category: '',
      availability: true,
      brand_name: '',
      variety: '',
      inStock: selectedType === 'product' ? true : undefined,
      unit: (selectedType === 'menu' || selectedType === 'service') ? '' : undefined
    });
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: Item) => {
    setFormData({
      shopId: item.shopId,
      type: item.type,
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      availability: item.availability !== false,
      inStock: item.type === 'product' ? (typeof item.inStock === 'boolean' ? item.inStock : !!item.inStock) : undefined,
      hindi_name: item.hindi_name || '',
      brand_name: item.brand_name || '',
      variety: item.variety || '',
      unit: (item.type === 'menu' || item.type === 'service') ? (item.unit || '') : undefined
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await deleteItem(item.shopId, item.id);
      toast.success('Item deleted successfully');
      loadShopItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleBulkUpload = async (items: Omit<ItemInput, 'shopId'>[]) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      await addBulkItems(selectedShop.id, items);
      toast.success(`Successfully uploaded ${items.length} items!`);
      setShowBulkUpload(false);
      loadShopItems();
    } catch (error) {
      console.error('Error bulk uploading items:', error);
      toast.error('Failed to upload items');
    }
  };

  const handleNameChange = (name: string) => {
    const hindiName = generateHindiName(name);
    setFormData(prev => ({
      ...prev,
      name,
      hindi_name: hindiName
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // For products, ensure inStock is a number (1/0) for Firestore
      let submitData = { ...formData };
      if (formData.type === 'product') {
        submitData.inStock = formData.inStock === true || formData.inStock === 1 || formData.inStock === '1' ? 1 : 0;
      }
      if (editingItem) {
        await updateItem(editingItem.shopId, editingItem.id, submitData);
        toast.success('Item updated successfully');
      } else {
        await addItem(submitData);
        toast.success('Item added successfully');
      }

      setShowForm(false);
      setEditingItem(null);
      loadShopItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  // Filter items based on search
  const filteredItems = items.filter(item => {
    if (!itemSearchQuery) return true;
    const query = itemSearchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.hindi_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.brand_name?.toLowerCase().includes(query)
    );
  });

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'product': return <Package className="w-5 h-5 text-green-600" />;
      case 'menu': return <Star className="w-5 h-5 text-blue-600" />;
      case 'service': return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'product': return 'from-green-500 to-emerald-600';
      case 'menu': return 'from-blue-500 to-indigo-600';
      case 'service': return 'from-purple-500 to-violet-600';
    }
  };

  const getShopTypeIcon = (shopType: string) => {
    switch (shopType) {
      case 'product': return '🛍️';
      case 'menu': return '🍽️';
      case 'service': return '🔧';
      default: return '🏪';
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="text-blue-500" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enhanced Item Manager</h2>
            <p className="text-gray-600">Smart shop-connected item management</p>
          </div>
        </div>
        
        {selectedShop && viewMode === 'items' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
            >
              <Upload size={20} />
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Type Selector */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Item Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['product', 'menu', 'service'] as ItemType[]).map((type) => (
            <motion.button
              key={type}
              onClick={() => handleTypeSelect(type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedType === type
                  ? `border-blue-500 bg-gradient-to-r ${getTypeColor(type)} text-white shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedType === type ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {getTypeIcon(type)}
                </div>
                <div className="text-center">
                  <h4 className="font-semibold capitalize">{type}s</h4>
                  <p className={`text-sm ${selectedType === type ? 'text-white/80' : 'text-gray-600'}`}>
                    {type === 'product' && 'Physical items & inventory'}
                    {type === 'menu' && 'Restaurant menu items'}
                    {type === 'service' && 'Services & consultations'}
                  </p>
                  <p className={`text-xs mt-1 ${selectedType === type ? 'text-white/60' : 'text-gray-500'}`}>
                    {filteredShops.filter(shop => {
                      if (type === 'product') return true;
                      if (type === 'menu') return shop.shopType === 'menu' || ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '');
                      if (type === 'service') return shop.shopType === 'service' || shop.serviceDetails?.length > 0;
                      return false;
                    }).length} shops available
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {viewMode === 'items' && selectedShop && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setViewMode('shops');
              setSelectedShop(null);
            }}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Shops</span>
          </button>
          <span>•</span>
          <span className="font-medium text-gray-900">{selectedShop.shopName}</span>
          {selectedType && (
            <>
              <span>•</span>
              <span className="capitalize">{selectedType} Items</span>
            </>
          )}
        </div>
      )}

      {/* Shops View */}
      {viewMode === 'shops' && (
        <div className="space-y-6">
          {/* Smart Shop Selector */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
            <SmartShopSelector
              shops={filteredShops}
              selectedType={selectedType}
              onShopSelect={handleShopSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      )}

      {/* Items View */}
      {viewMode === 'items' && selectedShop && (
        <div className="space-y-6">
          {/* Shop Header */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  {getShopTypeIcon(selectedShop.shopType)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedShop.shopName}</h3>
                  <p className="text-gray-600">{selectedShop.ownerName} • {selectedShop.type}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedShop.shopType === 'product' ? 'bg-green-100 text-green-800' :
                      selectedShop.shopType === 'menu' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedShop.shopType} Shop
                    </span>
                    {selectedShop.isVerified && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Items` : 'All Items'}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{filteredItems.length} of {items.length} items</span>
                </div>
              </div>

              {/* Items Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">
                  {itemSearchQuery 
                    ? `No items match "${itemSearchQuery}"`
                    : `This shop doesn't have any ${selectedType || ''} items yet.`
                  }
                </p>
                {itemSearchQuery ? (
                  <button
                    onClick={() => setItemSearchQuery('')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-3"
                  >
                    Clear Search
                  </button>
                ) : null}
                <button
                  onClick={handleAddItem}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-6 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.type === 'product' ? 'bg-green-100' :
                          item.type === 'menu' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          {getTypeIcon(item.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">
                            {item.name || (item.type === 'service' && item.description 
                              ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '')
                              : 'Service Item')}
                          </h4>
                          
                          {item.hindi_name && (
                            <p className="text-sm text-gray-600">{item.hindi_name}</p>
                          )}
                          
                          <div className="flex items-center space-x-2 mt-2">
                            {item.category && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {item.category}
                              </span>
                            )}
                            {item.brand_name && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                {item.brand_name}
                              </span>
                            )}
                            {item.price && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                ₹{item.price}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.availability !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.availability !== false ? 'Available' : 'Unavailable'}
                            </span>
                          </div>

                          {/* Type-specific info */}
                          {item.type === 'product' && item.inStock !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">
                              Stock: {item.inStock} {item.unit || 'units'}
                            </p>
                          )}
                          
                          {item.type === 'service' && item.highlights && item.highlights.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-purple-600 font-medium mb-1">Service Highlights:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {item.highlights.slice(0, 2).map((highlight, idx) => (
                                  <li key={idx} className="flex items-center space-x-1">
                                    <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                                    <span>{highlight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit item"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-700">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Shop and Type Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Store size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{selectedShop?.shopName}</p>
                        <p className="text-sm text-blue-700 capitalize">{formData.type} Item</p>
                      </div>
                    </div>
                  </div>

                  {/* Item Name with Auto Hindi Generation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name {formData.type !== 'service' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={formData.type === 'service' ? 'Optional - can use description instead' : 'Enter item name'}
                        required={formData.type !== 'service'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hindi Name (Auto-generated)
                      </label>
                      <input
                        type="text"
                        value={formData.hindi_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hindi_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        placeholder="Auto-generated from English name"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically generated. Edit if needed.
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description {formData.type === 'service' ? '(Required if no name)' : ''}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        formData.type === 'service' 
                          ? 'Describe the service offered (e.g., Professional hair cutting and styling)'
                          : 'Optional description'
                      }
                    />
                  </div>

                  {/* Category and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  {/* Type-specific fields */}
                  {formData.type === 'product' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">In Stock *</label>
                        <select
                          value={formData.inStock === true || formData.inStock === 1 || formData.inStock === '1' ? 'true' : 'false'}
                          onChange={e => setFormData(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input
                          type="text"
                          value={formData.brand_name || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === 'menu' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <input
                        type="text"
                        value={formData.unit || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="plate, bowl, glass, etc."
                      />
                    </div>
                  )}

                  {/* Availability */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="availability"
                      checked={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="availability" className="text-sm font-medium text-gray-700">
                      Item is available
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUpload && selectedShop && (
          <EnhancedBulkUpload
            shopId={selectedShop.id}
            shopName={selectedShop.shopName}
            itemType={selectedType || 'product'}
            onSuccess={handleBulkUpload}
            onCancel={() => setShowBulkUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedItemManager;