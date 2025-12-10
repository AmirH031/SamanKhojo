import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Languages, DollarSign, Package, FileText } from 'lucide-react';
import { Item, ItemInput, validateItem } from '../../types/Item';
import { generateHindiName } from '../../services/itemService';

// Legacy type aliases for backward compatibility
type MenuItem = Item;
type MenuItemInput = ItemInput;

interface MenuItemFormProps {
  shopId: string;
  item?: MenuItem | null;
  onSubmit: (data: MenuItemInput) => Promise<void>;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  shopId,
  item,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<MenuItemInput>({
    shopId,
    name: '',
    hindi_name: '',
    description: '',
    category: '',
    price: '',
    isAvailable: true
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoTransliterating, setAutoTransliterating] = useState(false);

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        shopId: item.shopId,
        name: item.name,
        hindi_name: item.hindi_name || '',
        description: item.description || '',
        category: item.category || '',
        price: item.price || '',
        isAvailable: item.isAvailable
      });
    }
  }, [item]);

  // Real-time Hindi transliteration
  useEffect(() => {
    if (formData.name && formData.name.trim() !== '') {
      // Only auto-generate if hindi_name is empty
      const shouldAutoGenerate = !formData.hindi_name || formData.hindi_name.trim() === '';
      
      if (shouldAutoGenerate) {
        setAutoTransliterating(true);
        const timeoutId = setTimeout(() => {
          try {
            const hindiName = generateHindiName(formData.name);
            if (hindiName && hindiName.trim() !== '') {
              setFormData(prev => ({ ...prev, hindi_name: hindiName }));
            }
          } catch (error) {
            console.error('Error generating Hindi name:', error);
          } finally {
            setAutoTransliterating(false);
          }
        }, 500); // Slightly longer delay to avoid too many calls

        return () => clearTimeout(timeoutId);
      }
    } else {
      // Clear Hindi name if English name is empty
      if (formData.hindi_name) {
        setFormData(prev => ({ ...prev, hindi_name: '' }));
      }
    }
  }, [formData.name]); // Only depend on formData.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = validateItem({ ...formData, type: 'menu' });
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setErrors([error.message || 'Failed to save menu item']);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MenuItemInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]); // Clear errors when user starts typing
  };

  const commonCategories = [
    'Starters',
    'Soups',
    'Main Course',
    'Rice & Biryani',
    'Bread',
    'Desserts',
    'Beverages',
    'Chinese',
    'Indian',
    'Continental',
    'Snacks'
  ];

  return (
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center space-x-3">
            <Package size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {item ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <p className="text-orange-100 text-sm">
                {item ? 'Update menu item details' : 'Add new item to restaurant menu'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error Display */}
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name (English) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Butter Chicken, Masala Dosa"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Hindi Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Languages size={16} className="inline mr-2" />
                Hindi Name (Auto-generated)
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={formData.hindi_name}
                    onChange={(e) => handleInputChange('hindi_name', e.target.value)}
                    placeholder="Auto-generated from English name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  {autoTransliterating && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.name) {
                      const hindiName = generateHindiName(formData.name);
                      setFormData(prev => ({ ...prev, hindi_name: hindiName }));
                    }
                  }}
                  className="px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                  title="Regenerate Hindi name"
                >
                  <Languages size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Automatically generated from English name. You can edit if needed or click the button to regenerate.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex space-x-2">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {commonCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Or type custom category"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-2" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the item, ingredients, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description?.length || 0}/500 characters
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Price (₹) - Optional
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="e.g., 250 (leave empty for 'Price on request')"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional field. Leave empty to show "Price on request" to customers.
              </p>
            </div>

            {/* Availability */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Item is available for ordering
                </span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{item ? 'Update Item' : 'Add Item'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuItemForm;
