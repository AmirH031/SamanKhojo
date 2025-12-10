import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Package, Languages, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { addItem, updateItem, getShops, Shop } from '../../services/firestoreService';
import { autoTransliterate, isValidHindiText } from '../../services/transliterationService';

interface ItemFormProps {
  item?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    hindi_name: '',
    category: '',
    category_hindi: '',
    type: 'product',
    variety: '',
    brand_name: '',
    shopId: '',
    price: '',
    unit: 'kg',
    isAvailable: true,
    // New ProductItem fields
    packs: '',
    priceRange: '',
    inStock: ''
  });
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualHindiEdit, setManualHindiEdit] = useState(false);
  const [manualCategoryEdit, setManualCategoryEdit] = useState(false);

  useEffect(() => {
    fetchShops();
    
    if (item) {
      setFormData({
        name: item.name || '',
        hindi_name: item.hindi_name || '',
        category: item.category || '',
        category_hindi: item.category_hindi || '',
        type: item.type || 'product',
        variety: Array.isArray(item.variety) ? item.variety.join(', ') : (item.variety || ''),
        brand_name: item.brand_name || '',
        shopId: item.shopId || '',
        price: item.price || '',
        unit: item.unit || 'kg',
        isAvailable: item.isAvailable !== false,
        // New ProductItem fields
        packs: Array.isArray(item.packs) ? item.packs.join(', ') : (item.packs || ''),
        priceRange: Array.isArray(item.priceRange) ? `${item.priceRange[0]}-${item.priceRange[1]}` : (item.priceRange || ''),
        inStock: item.inStock || ''
      });
      
      // If editing existing item, consider hindi fields as manually edited
      if (item.hindi_name) setManualHindiEdit(true);
      if (item.category_hindi) setManualCategoryEdit(true);
    }
  }, [item]);

  const fetchShops = async () => {
    try {
      const shopsData = await getShops();
      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  // Auto-transliterate name to Hindi
  useEffect(() => {
    if (!manualHindiEdit && formData.name.trim()) {
      const transliterated = autoTransliterate(formData.name);
      if (transliterated && isValidHindiText(transliterated)) {
        setFormData(prev => ({ ...prev, hindi_name: transliterated }));
      }
    }
  }, [formData.name, manualHindiEdit]);

  // Auto-transliterate category to Hindi
  useEffect(() => {
    if (!manualCategoryEdit && formData.category.trim()) {
      const transliterated = autoTransliterate(formData.category);
      if (transliterated && isValidHindiText(transliterated)) {
        setFormData(prev => ({ ...prev, category_hindi: transliterated }));
      }
    }
  }, [formData.category, manualCategoryEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    
    if (!formData.shopId) {
      toast.error('Please select a shop');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        ...formData,
        name: formData.name.trim(),
        hindi_name: formData.hindi_name.trim() || undefined,
        category: formData.category.trim() || undefined,
        category_hindi: formData.category_hindi.trim() || undefined,
        type: formData.type.trim() || 'product',
        variety: formData.variety.trim() || undefined,
        brand_name: formData.brand_name.trim() || undefined,
        price: formData.price.trim() || undefined,
        // New ProductItem fields
        packs: formData.packs.trim() || undefined,
        priceRange: formData.priceRange.trim() || undefined,
        inStock: formData.inStock.trim() || undefined
      };

      if (item?.id) {
        await updateItem(item.id, itemData);
        toast.success('Item updated successfully!');
      } else {
        await addItem(itemData);
        toast.success('Item added successfully!');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Grocery', 'Kirana', 'Food', 'Snacks', 'Beverages', 'Dairy', 
    'Fruits', 'Vegetables', 'Spices', 'Oil', 'Rice', 'Flour', 
    'Sugar', 'Tea', 'Coffee', 'Biscuits', 'Soap', 'Shampoo', 
    'Cosmetics', 'Medicine', 'Stationery', 'Toys', 'Electronics', 
    'Hardware', 'Electrical', 'Mobile Accessories', 'Plastic Items', 
    'Frozen Items'
  ];

  const units = ['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'box', 'bottle'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="text-blue-600" size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop *
          </label>
          <select
            value={formData.shopId}
            onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a shop...</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.shopName} - {shop.address}
              </option>
            ))}
          </select>
        </div>

        {/* Item Name with Auto-transliteration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name (English) *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sugar, Rice, Oil"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <span>Hindi Name</span>
                <Languages size={14} className="text-blue-500" />
                {!manualHindiEdit && formData.name && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Auto-generated
                  </span>
                )}
              </div>
            </label>
            <input
              type="text"
              value={formData.hindi_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, hindi_name: e.target.value }));
                setManualHindiEdit(true);
              }}
              placeholder="हिंदी नाम (Auto-filled)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="auto"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-transliterated from English name. Edit manually if needed.
            </p>
          </div>
        </div>

        {/* Category with Auto-transliteration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <span>Category (Hindi)</span>
                <Languages size={14} className="text-blue-500" />
                {!manualCategoryEdit && formData.category && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Auto-generated
                  </span>
                )}
              </div>
            </label>
            <input
              type="text"
              value={formData.category_hindi}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, category_hindi: e.target.value }));
                setManualCategoryEdit(true);
              }}
              placeholder="श्रेणी (Auto-filled)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="auto"
            />
          </div>
        </div>

        {/* Item Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="product">Product</option>
            <option value="menu">Menu Item</option>
            <option value="service">Service</option>
          </select>
        </div>

        {/* ProductItem Specific Fields */}
        {formData.type === 'product' && (
          <>
            {/* Variety (Multi-value) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variety (Multiple values)
              </label>
              <input
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                placeholder="e.g., Moong, Masur, Tuvar (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter multiple varieties separated by commas
              </p>
            </div>

            {/* Packs (Multi-value) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Sizes *
              </label>
              <input
                type="text"
                value={formData.packs}
                onChange={(e) => setFormData(prev => ({ ...prev, packs: e.target.value }))}
                placeholder="e.g., Small, Medium, Large (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={formData.type === 'product'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter package sizes separated by commas
              </p>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range *
                </label>
                <input
                  type="text"
                  value={formData.priceRange}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                  placeholder="e.g., 50-90"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.type === 'product'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: min-max (e.g., 50-90)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={formData.inStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.value }))}
                  placeholder="e.g., 100"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.type === 'product'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be >= 0
                </p>
              </div>
            </div>
          </>
        )}

        {/* Legacy fields for non-product types */}
        {formData.type !== 'product' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variety
              </label>
              <input
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                placeholder="e.g., Basmati, Toor Dal, Green"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 50"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        </div>

        {/* Brand and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name
            </label>
            <input
              type="text"
              value={formData.brand_name}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
              placeholder="e.g., Tata, Amul, Patanjali"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="₹50"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
            Item is currently available
          </label>
        </div>

        {/* Transliteration Info */}
        {formData.hindi_name && !manualHindiEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Languages size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Auto-transliteration Active
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Hindi name is automatically generated. You can edit it manually if needed.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={16} />
                <span>{item ? 'Update Item' : 'Add Item'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ItemForm;