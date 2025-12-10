import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  initializeDefaultCategories,
  Category,
  CategoryInput,
  validateCategory
} from '../../services/categoryService';
import { validateShopCategories } from '../../services/shopCategoryService';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryInput>({
    name: '',
    hindi_name: '',
    icon: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validateCategory(formData);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    setLoading(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast.success('Category updated successfully!');
      } else {
        await addCategory(formData);
        toast.success('Category added successfully!');
      }
      
      await fetchCategories();
      
      // Validate and sync shop categories after category changes
      try {
        await validateShopCategories();
        toast.success('Shop categories synchronized successfully!');
      } catch (error) {
        console.error('Error syncing shop categories:', error);
        toast.warn('Category saved but shop synchronization failed');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      hindi_name: category.hindi_name || '',
      icon: category.icon || '',
      description: category.description || '',
      isActive: category.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory(categoryId);
      toast.success('Category deleted successfully!');
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleSyncShopCategories = async () => {
    if (!confirm('This will validate and sync all shop categories. Continue?')) return;

    setLoading(true);
    try {
      await validateShopCategories();
      toast.success('Shop categories synchronized successfully!');
    } catch (error) {
      console.error('Error syncing shop categories:', error);
      toast.error('Failed to sync shop categories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully!`);
      await fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Failed to update category status');
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will add default categories if none exist. Continue?')) return;

    try {
      setLoading(true);
      await initializeDefaultCategories();
      toast.success('Default categories initialized successfully!');
      await fetchCategories();
    } catch (error) {
      console.error('Error initializing default categories:', error);
      toast.error('Failed to initialize default categories');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    try {
      const currentCategory = categories[currentIndex];
      const targetCategory = categories[newIndex];

      // Swap sort orders
      await updateCategory(currentCategory.id, { sortOrder: targetCategory.sortOrder });
      await updateCategory(targetCategory.id, { sortOrder: currentCategory.sortOrder });

      toast.success('Category order updated successfully!');
      await fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      hindi_name: '',
      icon: '',
      description: '',
      isActive: true
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading && categories.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-600">Manage shop categories for better organization</p>
        </div>
        <div className="flex space-x-3">
          {categories.length === 0 && (
            <button
              onClick={handleInitializeDefaults}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Plus size={20} />
              <span>Initialize Defaults</span>
            </button>
          )}
          <button
            onClick={handleSyncShopCategories}
            disabled={loading}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <ArrowUp size={20} />
            <span>Sync Shops</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics & Mobile"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hindi Name
                </label>
                <input
                  type="text"
                  value={formData.hindi_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, hindi_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., इलेक्ट्रॉनिक्स और मोबाइल"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 📱"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active Category</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this category..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
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

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Categories ({categories.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {categories.map((category, index) => (
            <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                      {category.hindi_name && (
                        <p className="text-sm text-gray-600">{category.hindi_name}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        Order: {category.sortOrder}
                      </span>
                    </div>
                  </div>

                  {category.description && (
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  )}

                  <div className="text-xs text-gray-500">
                    Created: {category.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleReorder(category.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => handleReorder(category.id, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`p-2 rounded-lg transition-colors ${
                      category.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No categories found.</p>
            <button
              onClick={handleInitializeDefaults}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Initialize Default Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;