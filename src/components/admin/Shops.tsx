import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Phone, Star, Upload, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, addShop, updateShop, deleteShop, Shop } from '../../services/firestoreService';
import { getCurrentLocation } from '../../services/locationService';
import { getActiveCategories, Category } from '../../services/categoryService';
import { getCategorySuggestions } from '../../services/shopCategoryService';
import { generateHindiName } from '../../utils';
import AdminClaimsHandler from '../AdminClaimsHandler';


// Helper function to format time
const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const Shops: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    hindi_shopName: '',
    ownerName: '',
    type: '',
    shopType: 'product' as 'product' | 'menu' | 'service',

    serviceDetails: [] as string[],
    address: '',
    phone: '',
    openingTime: '',
    closingTime: '',
    mapLink: '',
    isOpen: true,
    isFeatured: false,
    isVerified: false,
    isHidden: false,
    location: { lat: 0, lng: 0 }
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [showAdminClaimsHandler, setShowAdminClaimsHandler] = useState(false);

  useEffect(() => {
    fetchShops();
    fetchCategories();
    fetchCategorySuggestions();
  }, []);

  const fetchCategorySuggestions = async () => {
    try {
      const suggestions = await getCategorySuggestions('');
      setCategorySuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching category suggestions:', error);
    }
  };

  const fetchShops = async () => {
    try {
      const shopsData = await getShops(true); // Include hidden shops for admin
      setShops(shopsData);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getActiveCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        location: {
          lat: location.latitude,
          lng: location.longitude
        }
      }));
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleShopNameChange = (shopName: string) => {
    const hindiName = generateHindiName(shopName);
    setFormData(prev => ({
      ...prev,
      shopName,
      hindi_shopName: hindiName
    }));
  };
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }
    
    if (!formData.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }
    
    if (!formData.type.trim()) {
      errors.type = 'Shop category is required';
    }

    if (!formData.shopType) {
      errors.shopType = 'Shop type is required';
    }
    

    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.openingTime) {
      errors.openingTime = 'Opening time is required';
    }
    
    if (!formData.closingTime) {
      errors.closingTime = 'Closing time is required';
    }
    
    if (formData.location.lat === 0 && formData.location.lng === 0) {
      errors.location = 'Location coordinates are required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);

    try {
      // Clean the form data to ensure no undefined values
      const cleanFormData = {
        ...formData,
        shopName: formData.shopName.trim(),
        hindi_shopName: formData.hindi_shopName?.trim() || '',
        ownerName: formData.ownerName.trim(),
        type: formData.type.trim(),
        shopType: formData.shopType,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        mapLink: formData.mapLink.trim(),
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        isOpen: Boolean(formData.isOpen),
        isFeatured: Boolean(formData.isFeatured),
        isVerified: Boolean(formData.isVerified),
        isHidden: Boolean(formData.isHidden),
        location: {
          lat: Number(formData.location.lat) || 0,
          lng: Number(formData.location.lng) || 0
        },

        serviceDetails: formData.shopType === 'service' ? formData.serviceDetails.filter(detail => detail.trim()) : undefined,
        items: [] // Remove items field as requested
      };

      if (editingShop) {
        await updateShop(editingShop.id, cleanFormData, imageFile || undefined);
        toast.success('Shop updated successfully!');
      } else {
        await addShop(cleanFormData, imageFile || undefined);
        toast.success('Shop added successfully!');
      }
      
      await fetchShops();
      resetForm();
    } catch (error) {
      console.error('Error saving shop:', error);
      
      if (error instanceof Error && error.message === 'ADMIN_CLAIMS_REQUIRED') {
        setShowAdminClaimsHandler(true);
      } else {
        toast.error('Failed to save shop');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      shopName: shop.shopName || '',
      hindi_shopName: shop.hindi_shopName || '',
      ownerName: shop.ownerName || '',
      type: shop.type || '',
      shopType: shop.shopType || 'product',

      serviceDetails: shop.serviceDetails || [],
      address: shop.address || '',
      phone: shop.phone || '',
      openingTime: shop.openingTime || '',
      closingTime: shop.closingTime || '',
      mapLink: shop.mapLink || '',
      isOpen: shop.isOpen !== undefined ? shop.isOpen : true,
      isFeatured: shop.isFeatured !== undefined ? shop.isFeatured : false,
      isVerified: shop.isVerified !== undefined ? shop.isVerified : false,
      isHidden: shop.isHidden !== undefined ? shop.isHidden : false,
      location: shop.location || { lat: 0, lng: 0 }
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) return;

    try {
      await deleteShop(shopId);
      toast.success('Shop deleted successfully!');
      await fetchShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
      
      if (error instanceof Error && error.message === 'ADMIN_CLAIMS_REQUIRED') {
        setShowAdminClaimsHandler(true);
      } else {
        toast.error('Failed to delete shop');
      }
    }
  };

  const handleToggleHidden = async (shop: Shop) => {
    try {
      await updateShop(shop.id, { isHidden: !shop.isHidden });
      toast.success(`Shop ${shop.isHidden ? 'unhidden' : 'hidden'} successfully!`);
      await fetchShops();
    } catch (error) {
      console.error('Error toggling shop visibility:', error);
      
      if (error instanceof Error && error.message === 'ADMIN_CLAIMS_REQUIRED') {
        setShowAdminClaimsHandler(true);
      } else {
        toast.error('Failed to update shop visibility');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      shopName: '',
      hindi_shopName: '',
      ownerName: '',
      type: '',
      shopType: 'product',
  
      serviceDetails: [],
      address: '',
      phone: '',
      openingTime: '',
      closingTime: '',
      mapLink: '',
      isOpen: true,
      isFeatured: false,
      isVerified: false,
      isHidden: false,
      location: { lat: 0, lng: 0 }
    });
    setImageFile(null);
    setFormErrors({});
    setEditingShop(null);
    setShowForm(false);
  };



  if (loading && shops.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
          <p className="text-gray-600">Manage registered shops and their information</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Shop</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingShop ? 'Edit Shop' : 'Add New Shop'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                All fields marked with * are required
              </p>
            </div>
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
                  Shop Name *
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.shopName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {formErrors.shopName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.shopName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hindi Shop Name (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.hindi_shopName}
                  onChange={(e) => setFormData(prev => ({ ...prev, hindi_shopName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Auto-generated from English name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically generated. Edit if needed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.ownerName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {formErrors.ownerName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ownerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Category *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="categories"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formErrors.type 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Select or type shop category"
                    required
                  />
                  <datalist id="categories">
                    {categorySuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion}>
                        {suggestion}
                      </option>
                    ))}
                  </datalist>
                  {!formErrors.type && (
                    <div className="text-xs text-gray-500 mt-1">
                      Select from existing categories or type a new one
                    </div>
                  )}
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Type *
                </label>
                <select
                  value={formData.shopType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    shopType: e.target.value as 'product' | 'menu' | 'service',
                    serviceDetails: e.target.value === 'service' ? prev.serviceDetails : []
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="product">🛍️ Product - Sells physical items</option>
                  <option value="menu">🍽️ Menu - Restaurant/Food service</option>
                  <option value="service">🔧 Service - Provides services</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.shopType === 'product' && 'Shop sells physical products like groceries, electronics, etc.'}
                  {formData.shopType === 'menu' && 'Restaurant or food service with menu items'}
                  {formData.shopType === 'service' && 'Service provider like salon, repair, etc.'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.phone 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time *
                </label>
                <input
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.openingTime 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {formErrors.openingTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.openingTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time *
                </label>
                <input
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.closingTime 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {formErrors.closingTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.closingTime}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Link
                </label>
                <input
                  type="url"
                  value={formData.mapLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, mapLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>



            {/* Service Details - Only for Service Type Shops */}
            {formData.shopType === 'service' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Details / Key Points *
                </label>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-purple-800 font-medium mb-1">💡 Pro Tip:</p>
                  <p className="text-xs text-purple-700">
                    Add detailed service descriptions. These will be displayed as an attractive poster when customers visit your shop page.
                  </p>
                </div>
                <div className="space-y-3">
                  {formData.serviceDetails.map((detail, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={detail}
                        onChange={(e) => {
                          const newDetails = [...formData.serviceDetails];
                          newDetails[index] = e.target.value;
                          setFormData(prev => ({ ...prev, serviceDetails: newDetails }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Service detail ${index + 1} (e.g., "Professional hair cutting and styling with modern techniques", "Mobile screen repair with 6-month warranty")`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newDetails = formData.serviceDetails.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, serviceDetails: newDetails }));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        serviceDetails: [...prev.serviceDetails, ''] 
                      }));
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus size={16} />
                    <span>Add Service Detail</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Add detailed descriptions of your services. These will be displayed as an attractive service poster to customers.
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  formErrors.address 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
              )}
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.lat}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, lat: parseFloat(e.target.value) || 0 }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.location 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.lng}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, lng: parseFloat(e.target.value) || 0 }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    formErrors.location 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {gettingLocation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <MapPin size={16} />
                      <span>📍 Use My Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {formErrors.location && (
              <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>



            {/* Status Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Shop is Open</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Featured Shop</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Verified Shop</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isHidden}
                  onChange={(e) => setFormData(prev => ({ ...prev, isHidden: e.target.checked }))}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Hide Shop</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingShop ? 'Update Shop' : 'Add Shop')}
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

      {/* Shops List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Registered Shops ({shops.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {shops.map((shop) => (
            <div key={shop.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{shop.shopName}</h4>
                    {shop.hindi_shopName && (
                      <span className="text-sm text-gray-600">({shop.hindi_shopName})</span>
                    )}
                    <div className="flex space-x-2">
                      {shop.isFeatured && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          Featured
                        </span>
                      )}
                      {shop.isVerified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Verified
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        shop.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shop.isOpen ? 'Open' : 'Closed'}
                      </span>
                      {shop.isHidden && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Owner:</strong> {shop.ownerName}</p>
                    <p><strong>Category:</strong> <span className="capitalize">{shop.type || 'Not specified'}</span></p>
                    <div className="flex items-center space-x-2">
                      <strong>Shop Type:</strong>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        shop.shopType === 'product' ? 'bg-blue-100 text-blue-800' :
                        shop.shopType === 'menu' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        <span>
                          {shop.shopType === 'product' ? '🛍️' : 
                           shop.shopType === 'menu' ? '🍽️' : '🔧'}
                        </span>
                        <span className="capitalize">{shop.shopType || 'Product'}</span>
                      </span>
                    </div>

                    {shop.shopType === 'service' && shop.serviceDetails && shop.serviceDetails.length > 0 && (
                      <div>
                        <strong>Service Details:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {shop.serviceDetails.slice(0, 3).map((detail, index) => (
                            <li key={index} className="text-xs text-gray-600">{detail}</li>
                          ))}
                          {shop.serviceDetails.length > 3 && (
                            <li className="text-xs text-gray-500">+{shop.serviceDetails.length - 3} more details</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {shop.openingTime && shop.closingTime && (
                      <p><strong>Hours:</strong> {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}</p>
                    )}
                    <div className="flex items-center space-x-1">
                      <Phone size={14} />
                      <span>{shop.phone}</span>
                    </div>
                    <div className="flex items-start space-x-1">
                      <MapPin size={14} className="mt-0.5" />
                      <span className="line-clamp-2">{shop.address}</span>
                    </div>
                    <p><strong>Location:</strong> {shop.location.lat.toFixed(6)}, {shop.location.lng.toFixed(6)}</p>
                    {shop.ratings && shop.ratings.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star size={14} className="text-yellow-500" />
                        <span>
                          {(shop.ratings.reduce((sum, r) => sum + r, 0) / shop.ratings.length).toFixed(1)} 
                          ({shop.ratings.length} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleHidden(shop)}
                    className={`p-2 rounded-lg transition-colors ${
                      shop.isHidden 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-orange-600 hover:bg-orange-50'
                    }`}
                    title={shop.isHidden ? 'Unhide shop' : 'Hide shop'}
                  >
                    {shop.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleEdit(shop)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {shops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No shops registered yet.</p>
          </div>
        )}
      </div>

      {/* Admin Claims Handler */}
      <AdminClaimsHandler
        isOpen={showAdminClaimsHandler}
        onClose={() => setShowAdminClaimsHandler(false)}
        onSuccess={() => {
          setShowAdminClaimsHandler(false);
          // Retry the last operation or just refresh the page
          window.location.reload();
        }}
      />
    </div>
  );
};

export default Shops;