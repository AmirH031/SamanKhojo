import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Image, 
  Save, 
  X, 
  Upload,
  Star,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Settings,
  Palette,
  Layout
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Shop, ServiceDetails, updateShop } from '../../services/firestoreService';

interface ServiceManagerProps {
  shop: Shop;
  onUpdate: () => void;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  category: string;
  isActive: boolean;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ shop, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'services' | 'poster'>('details');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails>(
    shop.serviceDetails || {
      duration: '',
      priceRange: '',
      serviceCategory: '',
      serviceName: '',
      description: [],
      features: [],
      availability: {
        days: [],
        timeSlots: []
      }
    }
  );
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newService, setNewService] = useState<Partial<ServiceItem>>({});
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [posterSettings, setPosterSettings] = useState({
    theme: 'purple',
    layout: 'modern',
    showPricing: true,
    showFeatures: true,
    customBanner: ''
  });

  const themes = {
    purple: {
      primary: 'from-purple-500 to-violet-600',
      secondary: 'from-purple-50 to-violet-50',
      accent: 'purple-600',
      text: 'purple-800'
    },
    blue: {
      primary: 'from-blue-500 to-cyan-600',
      secondary: 'from-blue-50 to-cyan-50',
      accent: 'blue-600',
      text: 'blue-800'
    },
    green: {
      primary: 'from-green-500 to-emerald-600',
      secondary: 'from-green-50 to-emerald-50',
      accent: 'green-600',
      text: 'green-800'
    },
    orange: {
      primary: 'from-orange-500 to-red-600',
      secondary: 'from-orange-50 to-red-50',
      accent: 'orange-600',
      text: 'orange-800'
    }
  };

  const handleSaveServiceDetails = async () => {
    try {
      await updateShop(shop.id, { serviceDetails });
      toast.success('Service details updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating service details:', error);
      toast.error('Failed to update service details');
    }
  };

  const addNewService = () => {
    if (!newService.name || !newService.description) {
      toast.error('Please fill in service name and description');
      return;
    }

    const service: ServiceItem = {
      id: Date.now().toString(),
      name: newService.name,
      description: newService.description || '',
      duration: newService.duration || '',
      price: newService.price || '',
      category: newService.category || '',
      isActive: true
    };

    setServices([...services, service]);
    setNewService({});
    toast.success('Service added successfully!');
  };

  const updateService = (updatedService: ServiceItem) => {
    setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
    setEditingService(null);
    toast.success('Service updated successfully!');
  };

  const deleteService = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
    toast.success('Service deleted successfully!');
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Settings size={16} />
        <span>Manage Services</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
                  <p className="text-gray-600">{shop.shopName}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'details', label: 'Service Details', icon: FileText },
                  { id: 'services', label: 'Service List', icon: Tag },
                  { id: 'poster', label: 'Poster Design', icon: Palette }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={serviceDetails.serviceName}
                          onChange={(e) => setServiceDetails(prev => ({ ...prev, serviceName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Hair Styling & Beauty Services"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Category
                        </label>
                        <select
                          value={serviceDetails.serviceCategory}
                          onChange={(e) => setServiceDetails(prev => ({ ...prev, serviceCategory: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select Category</option>
                          <option value="Beauty & Wellness">Beauty & Wellness</option>
                          <option value="Repair & Maintenance">Repair & Maintenance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Education & Training">Education & Training</option>
                          <option value="Professional Services">Professional Services</option>
                          <option value="Home Services">Home Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration Range
                        </label>
                        <input
                          type="text"
                          value={serviceDetails.duration}
                          onChange={(e) => setServiceDetails(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., 30 minutes - 2 hours"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range
                        </label>
                        <input
                          type="text"
                          value={serviceDetails.priceRange}
                          onChange={(e) => setServiceDetails(prev => ({ ...prev, priceRange: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., ₹100 - ₹500"
                        />
                      </div>
                    </div>

                    {/* Service Descriptions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Descriptions
                      </label>
                      <div className="space-y-2">
                        {serviceDetails.description.map((desc, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={desc}
                              onChange={(e) => {
                                const newDescriptions = [...serviceDetails.description];
                                newDescriptions[index] = e.target.value;
                                setServiceDetails(prev => ({ ...prev, description: newDescriptions }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Describe your service..."
                            />
                            <button
                              onClick={() => {
                                const newDescriptions = serviceDetails.description.filter((_, i) => i !== index);
                                setServiceDetails(prev => ({ ...prev, description: newDescriptions }));
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setServiceDetails(prev => ({ 
                            ...prev, 
                            description: [...prev.description, ''] 
                          }))}
                          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                        >
                          <Plus size={16} />
                          <span>Add Description</span>
                        </button>
                      </div>
                    </div>

                    {/* Service Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Features
                      </label>
                      <div className="space-y-2">
                        {serviceDetails.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...serviceDetails.features];
                                newFeatures[index] = e.target.value;
                                setServiceDetails(prev => ({ ...prev, features: newFeatures }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="e.g., Professional equipment, Experienced staff"
                            />
                            <button
                              onClick={() => {
                                const newFeatures = serviceDetails.features.filter((_, i) => i !== index);
                                setServiceDetails(prev => ({ ...prev, features: newFeatures }));
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setServiceDetails(prev => ({ 
                            ...prev, 
                            features: [...prev.features, ''] 
                          }))}
                          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                        >
                          <Plus size={16} />
                          <span>Add Feature</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveServiceDetails}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Save Service Details
                    </button>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Add New Service */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Service</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Service Name"
                          value={newService.name || ''}
                          onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g., 30 min)"
                          value={newService.duration || ''}
                          onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          placeholder="Price (e.g., ₹200)"
                          value={newService.price || ''}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Category"
                          value={newService.category || ''}
                          onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                          placeholder="Service Description"
                          value={newService.description || ''}
                          onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={addNewService}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add Service</span>
                      </button>
                    </div>

                    {/* Services List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Service List</h3>
                      {services.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Tag size={48} className="mx-auto mb-4 text-gray-300" />
                          <p>No services added yet. Add your first service above.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {services.map((service) => (
                            <div
                              key={service.id}
                              className={`border rounded-xl p-4 ${
                                service.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setEditingService(service)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => deleteService(service.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                  {service.duration && (
                                    <span className="flex items-center space-x-1 text-blue-600">
                                      <Clock size={12} />
                                      <span>{service.duration}</span>
                                    </span>
                                  )}
                                  {service.price && (
                                    <span className="flex items-center space-x-1 text-green-600">
                                      <DollarSign size={12} />
                                      <span>{service.price}</span>
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleServiceStatus(service.id)}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    service.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {service.isActive ? 'Active' : 'Inactive'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'poster' && (
                  <div className="space-y-6">
                    {/* Poster Settings */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Poster Customization</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color Theme
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(themes).map(([key, theme]) => (
                              <button
                                key={key}
                                onClick={() => setPosterSettings(prev => ({ ...prev, theme: key }))}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  posterSettings.theme === key
                                    ? 'border-gray-900'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className={`w-full h-8 bg-gradient-to-r ${theme.primary} rounded mb-2`}></div>
                                <p className="text-sm font-medium capitalize">{key}</p>
                              </button>
                            ))}
                          </div>
          