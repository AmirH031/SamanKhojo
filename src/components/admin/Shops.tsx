import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Phone, Star, Upload, X, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, addShop, updateShop, deleteShop, Shop, OfficeDetails } from '../../services/firestoreService';
import { getCurrentLocation } from '../../services/locationService';
import { getActiveCategories, Category } from '../../services/categoryService';
import { getCategorySuggestions } from '../../services/shopCategoryService';
import { generateHindiName } from '../../utils';
import { generateNewReferenceId } from '../../services/referenceIdService';
import { ENTITY_PREFIXES } from '../../utils/referenceId';
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
  const [formStep, setFormStep] = useState<'type' | 'details'>('type');
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    hindi_shopName: '',
    ownerName: '',
    type: '',
    shopType: 'product' as 'product' | 'menu' | 'service' | 'office',
    district: 'Mandsaur',
    referenceId: '',
    // Advanced Settings - Meta fields
    meta: {
      priority: 5,
      showOnHome: false,
      featuredLabel: '',
      tags: [] as string[],
      languages: [] as string[],
      aiKeywords: [] as string[],
      landmark: '',
      dataSource: 'Official' as 'Official' | 'User Submitted' | 'Field Survey' | 'Other'
    },
    officeDetails: {
      facilityType: 'government_office' as 'government_office' | 'private_office' | 'public_toilet' | 'public_garden' | 'telecom_office' | 'bank' | 'atm' | 'hospital' | 'school' | 'other',
      department: '',
      services: [] as string[],
      workingDays: [] as string[],
      openTime: '',
      closeTime: '',
      contactPerson: '',
      description: '',
      facilities: [] as string[]
    },
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showAdminClaimsHandler, setShowAdminClaimsHandler] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

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

  // Function to get facility category based on facility type
  const getFacilityCategoryFromType = (facilityType: string): string => {
    const facilityTypeToCategory: { [key: string]: string } = {
      'government_office': 'Government Office',
      'private_office': 'Private Office',
      'public_toilet': 'Public Toilet',
      'public_garden': 'Public Garden/Park',
      'telecom_office': 'Telecom Office',
      'bank': 'Bank',
      'atm': 'ATM',
      'hospital': 'Hospital/Clinic',
      'school': 'School/Educational',
      'other': 'Other Public Facility'
    };
    return facilityTypeToCategory[facilityType] || facilityType;
  };

  // Handle facility type change and auto-populate category
  const handleFacilityTypeChange = (facilityType: string) => {
    const category = getFacilityCategoryFromType(facilityType);
    setFormData(prev => ({
      ...prev,
      officeDetails: { ...prev.officeDetails, facilityType: facilityType as any },
      type: category // Auto-populate the category field
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }

    // Owner name is required for all shop types except office
    if (formData.shopType !== 'office' && !formData.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }

    if (!formData.type.trim()) {
      errors.type = 'Shop category is required';
    }
    if (!formData.shopType) {
      errors.shopType = 'Shop type is required';
    }
    // Office-specific validation
    if (formData.shopType === 'office') {
      if (!formData.officeDetails.facilityType) {
        errors.facilityType = 'Facility type is required';
      }
      if (formData.officeDetails.workingDays.length === 0) {
        errors.workingDays = 'At least one working day is required';
      }
      if (!formData.officeDetails.openTime) {
        errors.officeOpenTime = 'Opening time is required';
      }
      if (!formData.officeDetails.closeTime) {
        errors.officeCloseTime = 'Closing time is required';
      }
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
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
      // Generate Reference ID for new shops
      let referenceId = formData.referenceId;
      if (!editingShop && !referenceId) {
        referenceId = await generateNewReferenceId('SHOP', formData.district);
      }

      // Clean the form data to ensure no undefined values
      const cleanFormData = {
        ...formData,
        shopName: formData.shopName.trim(),
        hindi_shopName: formData.hindi_shopName?.trim() || '',
        ownerName: formData.shopType !== 'office' ? formData.ownerName.trim() : '',
        type: formData.type.trim(),
        shopType: formData.shopType,
        district: formData.district.trim(),
        referenceId,
        address: formData.address.trim(),
        mapLink: formData.mapLink.trim(),
        isOpen: Boolean(formData.isOpen),
        isFeatured: Boolean(formData.isFeatured),
        isVerified: Boolean(formData.isVerified),
        isHidden: Boolean(formData.isHidden),
        location: {
          lat: Number(formData.location.lat) || 0,
          lng: Number(formData.location.lng) || 0
        },
        officeDetails: formData.shopType === 'office' ? {
          ...formData.officeDetails,
          services: formData.officeDetails.services?.filter(service => service.trim()) || []
        } : undefined,
        items: [], // Remove items field as requested
        meta: {
          priority: Number(formData.meta.priority) || 5,
          showOnHome: Boolean(formData.meta.showOnHome),
          featuredLabel: formData.meta.featuredLabel.trim(),
          tags: formData.meta.tags.filter(tag => tag.trim()),
          languages: formData.meta.languages,
          aiKeywords: formData.meta.aiKeywords.filter(keyword => keyword.trim()),
          landmark: formData.meta.landmark.trim(),
          dataSource: formData.meta.dataSource
        }
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
    // For office shops, ensure category matches facility type
    let categoryType = shop.type || '';
    if (shop.shopType === 'office' && shop.officeDetails?.facilityType) {
      categoryType = getFacilityCategoryFromType(shop.officeDetails.facilityType);
    }
    setFormData({
      shopName: shop.shopName || '',
      hindi_shopName: shop.hindi_shopName || '',
      ownerName: shop.ownerName || '',
      type: categoryType,
      shopType: shop.shopType || 'product',
      district: shop.district || 'Mandsaur',
      referenceId: shop.referenceId || '',
      officeDetails: shop.officeDetails || {
        facilityType: 'government_office',
        department: '',
        services: [],
        workingDays: [],
        openTime: '',
        closeTime: '',
        contactPerson: '',
        description: '',
        facilities: []
      },
      address: shop.address || '',
      phone: shop.phone || '',
      openingTime: shop.openingTime || '',
      closingTime: shop.closingTime || '',
      mapLink: shop.mapLink || '',
      isOpen: shop.isOpen !== undefined ? shop.isOpen : true,
      isFeatured: shop.isFeatured !== undefined ? shop.isFeatured : false,
      isVerified: shop.isVerified !== undefined ? shop.isVerified : false,
      isHidden: shop.isHidden !== undefined ? shop.isHidden : false,
      location: shop.location || { lat: 0, lng: 0 },
      meta: shop.meta || {
        priority: 5,
        showOnHome: false,
        featuredLabel: '',
        tags: [],
        languages: [],
        aiKeywords: [],
        landmark: '',
        dataSource: 'Official'
      }
    });
    setFormErrors({});
    setFormStep('details'); // Go directly to details when editing
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
      district: 'Mandsaur',
      referenceId: '',
      officeDetails: {
        facilityType: 'government_office',
        department: '',
        services: [],
        workingDays: [],
        openTime: '',
        closeTime: '',
        contactPerson: '',
        description: '',
        facilities: []
      },
      address: '',
      phone: '',
      openingTime: '',
      closingTime: '',
      mapLink: '',
      isOpen: true,
      isFeatured: false,
      isVerified: false,
      isHidden: false,
      location: { lat: 0, lng: 0 },
      meta: {
        priority: 5,
        showOnHome: false,
        featuredLabel: '',
        tags: [],
        languages: [],
        aiKeywords: [],
        landmark: '',
        dataSource: 'Official'
      }
    });
    setShowAdvancedSettings(false);
    setImageFile(null);
    setFormErrors({});
    setEditingShop(null);
    setFormStep('type');
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
          <h2 className="text-2xl font-bold text-gray-900">Business & Facility Management</h2>
          <p className="text-gray-600">Manage shops, restaurants, services, and public facilities</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Entry</span>
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
                {editingShop ? 'Edit Entry' : 'Add New Entry'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {formStep === 'type' ? 'Select the type of entry you want to add' : 'All fields marked with * are required'}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Step 1: Type Selection */}
          {formStep === 'type' && !editingShop && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-medium text-gray-900 mb-4">What would you like to add?</h4>
                <p className="text-gray-600">Choose the type of business or facility</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, shopType: 'product' }));
                    setFormStep('details');
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-3xl mb-3">🛍️</div>
                  <h5 className="font-semibold text-gray-900 mb-2">Product Shop</h5>
                  <p className="text-sm text-gray-600">Sells physical items like groceries, electronics, clothing, etc.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, shopType: 'menu' }));
                    setFormStep('details');
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-3xl mb-3">🍽️</div>
                  <h5 className="font-semibold text-gray-900 mb-2">Restaurant/Food Service</h5>
                  <p className="text-sm text-gray-600">Restaurants, cafes, food stalls with menu items</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, shopType: 'service' }));
                    setFormStep('details');
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-3xl mb-3">🔧</div>
                  <h5 className="font-semibold text-gray-900 mb-2">Service Provider</h5>
                  <p className="text-sm text-gray-600">Provides services like salon, repair, medical, etc.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, shopType: 'office' }));
                    setFormStep('details');
                  }}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-3xl mb-3">🏛️</div>
                  <h5 className="font-semibold text-gray-900 mb-2">Public Facility</h5>
                  <p className="text-sm text-gray-600">Offices, toilets, gardens, banks, ATMs, hospitals, etc.</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details Form */}
          {(formStep === 'details' || editingShop) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back button for new entries */}
              {!editingShop && (
                <button
                  type="button"
                  onClick={() => setFormStep('type')}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
                >
                  ← Back to type selection
                </button>
              )}

              {/* Dynamic form title based on type */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {formData.shopType === 'product' && '🛍️'}
                    {formData.shopType === 'menu' && '🍽️'}
                    {formData.shopType === 'service' && '🔧'}
                    {formData.shopType === 'office' && '🏛️'}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {formData.shopType === 'product' && 'Product Shop Details'}
                      {formData.shopType === 'menu' && 'Restaurant Details'}
                      {formData.shopType === 'service' && 'Service Provider Details'}
                      {formData.shopType === 'office' && 'Public Facility Details'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.shopType === 'product' && 'Enter information for your product shop'}
                      {formData.shopType === 'menu' && 'Enter information for your restaurant or food service'}
                      {formData.shopType === 'service' && 'Enter information for your service business'}
                      {formData.shopType === 'office' && 'Enter information for the public facility'}
                    </p>
                  </div>
                </div>

                {/* Shop Name */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.shopType === 'office' ? 'Facility Name' :
                      formData.shopType === 'service' ? 'Business Name' :
                        formData.shopType === 'menu' ? 'Restaurant Name' : 'Shop Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => handleShopNameChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.shopName
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    placeholder={
                      formData.shopType === 'office' ? 'e.g., City Public Library' :
                        formData.shopType === 'service' ? 'e.g., Quick Hair Salon' :
                          formData.shopType === 'menu' ? 'e.g., Tasty Bites Restaurant' : 'e.g., Fresh Grocery Store'
                    }
                    required
                  />
                  {formErrors.shopName && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.shopName}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hindi Name (Auto-generated)
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

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City Name *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Mandsaur">Mandsaur</option>
                    <option value="Bhanpura">Bhanpura</option>
                    <option value="Garoth">Garoth</option>
                    <option value="Malhargarh">Malhargarh</option>
                    <option value="Sitamau">Sitamau</option>
                    <option value="Shamgarh">Shamgarh</option>
                    <option value="Suwasra">Suwasra</option>
                    <option value="Daloda">Daloda</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for generating Reference ID
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    value={formData.referenceId || (editingShop ? 'Will be auto-generated' : 'Will be auto-generated after save')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingShop ? 'Auto-generated unique identifier (cannot be changed)' : 'Unique identifier will be generated automatically when you save'}
                  </p>
                </div>

                {/* Owner Name - Only for non-office shops */}
                {formData.shopType !== 'office' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.ownerName
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      placeholder="e.g., Rajesh Kumar"
                      required
                    />
                    {formErrors.ownerName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.ownerName}</p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.shopType === 'office' ? 'Facility Category' :
                      formData.shopType === 'service' ? 'Service Category' :
                        formData.shopType === 'menu' ? 'Cuisine Type' : 'Shop Category'} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list={formData.shopType !== 'office' ? "categories" : undefined}
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.type
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                        } ${formData.shopType === 'office' ? 'bg-gray-50' : ''}`}
                      placeholder={
                        formData.shopType === 'office' ? 'Auto-populated from Facility Type' :
                          formData.shopType === 'service' ? 'e.g., Beauty & Wellness, Repair Services' :
                            formData.shopType === 'menu' ? 'e.g., Indian, Chinese, Fast Food' : 'e.g., Grocery, Electronics, Clothing'
                      }
                      readOnly={formData.shopType === 'office'}
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
                        {formData.shopType === 'office'
                          ? 'Automatically populated when you select a Facility Type above'
                          : 'Select from existing categories or type a new one'
                        }
                      </div>
                    )}
                    {formErrors.type && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
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

              {/* Public Facility Details - Only for Office Type Shops */}
              {formData.shopType === 'office' && (
                <div className="space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">🏛️ Public Facility Details</h3>
                    <p className="text-sm text-blue-700">
                      Configure facility information including type, services, and operating hours
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facility Type *
                      </label>
                      <select
                        value={formData.officeDetails.facilityType}
                        onChange={(e) => handleFacilityTypeChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.facilityType
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                      >
                        <option value="government_office">🏛️ Government Office</option>
                        <option value="private_office">🏢 Private Office</option>
                        <option value="public_toilet">🚻 Public Toilet</option>
                        <option value="public_garden">🌳 Public Garden/Park</option>
                        <option value="telecom_office">📡 Telecom Office</option>
                        <option value="bank">🏦 Bank</option>
                        <option value="atm">🏧 ATM</option>
                        <option value="hospital">🏥 Hospital/Clinic</option>
                        <option value="school">🏫 School/Educational</option>
                        <option value="other">🏢 Other Public Facility</option>
                      </select>
                      {formErrors.facilityType && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.facilityType}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department/Office Name
                      </label>
                      <input
                        type="text"
                        value={formData.officeDetails.department || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          officeDetails: { ...prev.officeDetails, department: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Collector Office, Municipal Corporation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opening Time *
                      </label>
                      <input
                        type="time"
                        value={formData.officeDetails.openTime || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          officeDetails: { ...prev.officeDetails, openTime: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.officeOpenTime
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        required
                      />
                      {formErrors.officeOpenTime && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.officeOpenTime}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Closing Time *
                      </label>
                      <input
                        type="time"
                        value={formData.officeDetails.closeTime || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          officeDetails: { ...prev.officeDetails, closeTime: e.target.value }
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.officeCloseTime
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        required
                      />
                      {formErrors.officeCloseTime && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.officeCloseTime}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Days *
                    </label>
                    <div className={`grid grid-cols-4 md:grid-cols-7 gap-2 p-3 border rounded-lg ${formErrors.workingDays
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                      }`}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.officeDetails.workingDays?.includes(day) || false}
                            onChange={(e) => {
                              const currentDays = formData.officeDetails.workingDays || [];
                              const newDays = e.target.checked
                                ? [...currentDays, day]
                                : currentDays.filter(d => d !== day);
                              setFormData(prev => ({
                                ...prev,
                                officeDetails: { ...prev.officeDetails, workingDays: newDays }
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                    {formErrors.workingDays && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.workingDays}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Services Offered
                    </label>
                    <div className="space-y-2">
                      {formData.officeDetails.services?.map((service, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={service}
                            onChange={(e) => {
                              const newServices = [...(formData.officeDetails.services || [])];
                              newServices[index] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                officeDetails: { ...prev.officeDetails, services: newServices }
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Birth Certificate, License Renewal"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newServices = formData.officeDetails.services?.filter((_, i) => i !== index) || [];
                              setFormData(prev => ({
                                ...prev,
                                officeDetails: { ...prev.officeDetails, services: newServices }
                              }));
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
                          const newServices = [...(formData.officeDetails.services || []), ''];
                          setFormData(prev => ({
                            ...prev,
                            officeDetails: { ...prev.officeDetails, services: newServices }
                          }));
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Plus size={16} />
                        <span>Add Service</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Facilities
                    </label>
                    <div className="space-y-2">
                      {formData.officeDetails.facilities?.map((facility, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={facility}
                            onChange={(e) => {
                              const newFacilities = [...(formData.officeDetails.facilities || [])];
                              newFacilities[index] = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                officeDetails: { ...prev.officeDetails, facilities: newFacilities }
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Wheelchair Access, Parking, WiFi"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFacilities = formData.officeDetails.facilities?.filter((_, i) => i !== index) || [];
                              setFormData(prev => ({
                                ...prev,
                                officeDetails: { ...prev.officeDetails, facilities: newFacilities }
                              }));
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
                          const newFacilities = [...(formData.officeDetails.facilities || []), ''];
                          setFormData(prev => ({
                            ...prev,
                            officeDetails: { ...prev.officeDetails, facilities: newFacilities }
                          }));
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Plus size={16} />
                        <span>Add Facility</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.officeDetails.contactPerson || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        officeDetails: { ...prev.officeDetails, contactPerson: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Officer Name, Designation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.officeDetails.description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        officeDetails: { ...prev.officeDetails, description: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the facility and its primary functions"
                    />
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.address
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.location
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.location
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

              {/* Advanced Settings Section - Only for Office Type */}
              {formData.shopType === 'office' && (
                <div className="border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium mb-4"
                  >
                    <span>Advanced Settings ⚙️</span>
                    <span className="text-sm text-gray-500">
                      {showAdvancedSettings ? '(Click to hide)' : '(Optional - Click to expand)'}
                    </span>
                  </button>

                  {showAdvancedSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 bg-gray-50 rounded-lg p-6"
                    >
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">👁️ Visibility & Display Control</h4>
                        <p className="text-sm text-gray-600 mb-4">Control how this entry appears on the platform</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority/Rank */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority / Rank
                            <span className="ml-1 text-gray-400 cursor-help" title="Controls homepage sort order (1 = highest priority)">?</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.meta.priority}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              meta: { ...prev.meta, priority: parseInt(e.target.value) || 5 }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 5"
                          />
                          <p className="text-xs text-gray-500 mt-1">Controls homepage sort order (1 = highest priority)</p>
                        </div>

                        {/* Featured Badge Label */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Featured Badge Label
                            <span className="ml-1 text-gray-400 cursor-help" title="Optional badge text to display on featured listings">?</span>
                          </label>
                          <input
                            type="text"
                            value={formData.meta.featuredLabel}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              meta: { ...prev.meta, featuredLabel: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Govt Office, Public Service, Top Rated"
                          />
                          <p className="text-xs text-gray-500 mt-1">Optional badge text to display on featured listings</p>
                        </div>

                        {/* Show on Homepage */}
                        <div className="md:col-span-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.meta.showOnHome}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                meta: { ...prev.meta, showOnHome: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
                            <span className="ml-1 text-gray-400 cursor-help" title="Toggle to feature this office on the homepage highlights">?</span>
                          </label>
                          <p className="text-xs text-gray-500 mt-1 ml-6">Toggle to feature this entry on the homepage highlights</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">📍 Additional Metadata</h4>
                        <p className="text-sm text-gray-600 mb-4">Extra information for better user experience</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nearby Landmark */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nearby Landmark
                            <span className="ml-1 text-gray-400 cursor-help" title="Helps users locate the facility more easily">?</span>
                          </label>
                          <input
                            type="text"
                            value={formData.meta.landmark}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              meta: { ...prev.meta, landmark: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Opposite Civil Hospital, Near Bus Stand"
                          />
                          <p className="text-xs text-gray-500 mt-1">Helps users locate the facility more easily</p>
                        </div>

                        {/* Data Source */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data Source
                            <span className="ml-1 text-gray-400 cursor-help" title="Indicates the origin of this facility data">?</span>
                          </label>
                          <select
                            value={formData.meta.dataSource}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              meta: { ...prev.meta, dataSource: e.target.value as any }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Official">Official</option>
                            <option value="User Submitted">User Submitted</option>
                            <option value="Field Survey">Field Survey</option>
                            <option value="Other">Other</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Indicates the origin of this facility data</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingShop ? 'Update Entry' : 'Add Entry')}
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
          )}
        </motion.div>
      )}

      {/* Shops List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Registered Entries ({shops.length})
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
                      <span className={`px-2 py-1 rounded-full text-xs ${shop.isOpen
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
                    <p><strong>Category:</strong> <span className="capitalize">{shop.type || 'Not specified'}</span></p>

                    {/* Owner Name - Only for non-office shops */}
                    {shop.shopType !== 'office' && shop.ownerName && (
                      <p><strong>Owner:</strong> {shop.ownerName}</p>
                    )}

                    <div className="flex items-center space-x-2">
                      <strong>Shop Type:</strong>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${shop.shopType === 'product' ? 'bg-blue-100 text-blue-800' :
                        shop.shopType === 'menu' ? 'bg-orange-100 text-orange-800' :
                          shop.shopType === 'office' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-purple-100 text-purple-800'
                        }`}>
                        <span>
                          {shop.shopType === 'product' ? '🛍️' :
                            shop.shopType === 'menu' ? '🍽️' :
                              shop.shopType === 'office' ? '🏛️' : '🔧'}
                        </span>
                        <span className="capitalize">{shop.shopType || 'Product'}</span>
                      </span>
                    </div>

                    {shop.shopType === 'office' && shop.officeDetails && (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 mt-2 border border-emerald-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-2xl">🏛️</span>
                          <strong className="text-emerald-800 text-sm">Public Facility Details</strong>
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-700">Facility Type:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.officeDetails.facilityType === 'government_office' ? 'bg-green-100 text-green-800' :
                                  shop.officeDetails.facilityType === 'bank' ? 'bg-blue-100 text-blue-800' :
                                    shop.officeDetails.facilityType === 'hospital' ? 'bg-red-100 text-red-800' :
                                      shop.officeDetails.facilityType === 'school' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}>
                                  {shop.officeDetails.facilityType === 'government_office' && '🏛️ Government'}
                                  {shop.officeDetails.facilityType === 'private_office' && '🏢 Private Office'}
                                  {shop.officeDetails.facilityType === 'bank' && '🏦 Bank'}
                                  {shop.officeDetails.facilityType === 'atm' && '🏧 ATM'}
                                  {shop.officeDetails.facilityType === 'hospital' && '🏥 Hospital'}
                                  {shop.officeDetails.facilityType === 'school' && '🏫 School'}
                                  {shop.officeDetails.facilityType === 'public_toilet' && '🚻 Public Toilet'}
                                  {shop.officeDetails.facilityType === 'public_garden' && '🌳 Public Garden'}
                                  {shop.officeDetails.facilityType === 'telecom_office' && '📡 Telecom Office'}
                                  {shop.officeDetails.facilityType === 'other' && '🏢 Other Facility'}
                                </span>
                              </div>
                              {shop.officeDetails.department && (
                                <div>
                                  <span className="font-medium text-gray-700">Department:</span>
                                  <span className="ml-2 text-gray-900">{shop.officeDetails.department}</span>
                                </div>
                              )}
                              {shop.officeDetails.contactPerson && (
                                <div>
                                  <span className="font-medium text-gray-700">Contact Person:</span>
                                  <span className="ml-2 text-gray-900">{shop.officeDetails.contactPerson}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {shop.officeDetails.openTime && shop.officeDetails.closeTime && (
                                <div>
                                  <span className="font-medium text-gray-700">Office Hours:</span>
                                  <div className="ml-2 text-gray-900">
                                    {formatTime(shop.officeDetails.openTime)} - {formatTime(shop.officeDetails.closeTime)}
                                  </div>
                                </div>
                              )}
                              {shop.officeDetails.workingDays && shop.officeDetails.workingDays.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">Working Days:</span>
                                  <div className="ml-2 flex flex-wrap gap-1 mt-1">
                                    {shop.officeDetails.workingDays.map((day, index) => (
                                      <span key={index} className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs">
                                        {day}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {shop.officeDetails.services && shop.officeDetails.services.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-emerald-200">
                              <span className="font-medium text-gray-700">Services Offered:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {shop.officeDetails.services.slice(0, 4).map((service, index) => (
                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {service}
                                  </span>
                                ))}
                                {shop.officeDetails.services.length > 4 && (
                                  <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full text-xs font-medium">
                                    +{shop.officeDetails.services.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {shop.officeDetails.description && (
                            <div className="mt-3 pt-3 border-t border-emerald-200">
                              <span className="font-medium text-gray-700">Description:</span>
                              <p className="ml-2 text-gray-900 text-xs leading-relaxed mt-1">{shop.officeDetails.description}</p>
                            </div>
                          )}
                        </div>
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
                    className={`p-2 rounded-lg transition-colors ${shop.isHidden
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