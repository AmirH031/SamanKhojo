import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Eye, 
  EyeOff, 
  Settings,
  Image as ImageIcon,
  FileText,
  Clock,
  DollarSign,
  Star,
  Users,
  Calendar,
  MapPin,
  Phone,
  Award,
  Zap
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ServicePoster {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  serviceType: string;
  priceRange: string;
  duration: string;
  isActive: boolean;
  createdAt: Date;
  shopId?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  isPopular: boolean;
  imageUrl?: string;
}

const ServiceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posters' | 'services'>('posters');
  const [posters, setPosters] = useState<ServicePoster[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPosterForm, setShowPosterForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingPoster, setEditingPoster] = useState<ServicePoster | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Poster form data
  const [posterForm, setPosterForm] = useState({
    title: '',
    description: '',
    serviceType: '',
    priceRange: '',
    duration: '',
    isActive: true
  });

  // Service form data
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: '',
    category: '',
    isPopular: false
  });

  const [posterImageFile, setPosterImageFile] = useState<File | null>(null);
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);

  // Sample data for demonstration
  useEffect(() => {
    // Load sample posters
    setPosters([
      {
        id: '1',
        title: 'Professional Hair Styling',
        description: 'Get the perfect look with our expert stylists. Modern cuts, coloring, and treatments available.',
        imageUrl: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
        serviceType: 'Beauty & Salon',
        priceRange: '₹500 - ₹2000',
        duration: '1-2 hours',
        isActive: true,
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Mobile Repair Services',
        description: 'Quick and reliable mobile phone repairs. Screen replacement, battery change, and more.',
        imageUrl: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800',
        serviceType: 'Electronics Repair',
        priceRange: '₹200 - ₹5000',
        duration: '30 min - 2 hours',
        isActive: true,
        createdAt: new Date()
      }
    ]);

    // Load sample services
    setServices([
      {
        id: '1',
        name: 'Haircut & Styling',
        description: 'Professional haircut with modern styling techniques',
        price: 800,
        duration: '45 minutes',
        category: 'Hair Services',
        isPopular: true,
        imageUrl: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        id: '2',
        name: 'Screen Replacement',
        description: 'High-quality screen replacement for all mobile brands',
        price: 2500,
        duration: '1 hour',
        category: 'Mobile Repair',
        isPopular: true
      },
      {
        id: '3',
        name: 'Battery Replacement',
        description: 'Original battery replacement with warranty',
        price: 1200,
        duration: '30 minutes',
        category: 'Mobile Repair',
        isPopular: false
      }
    ]);
  }, []);

  const handlePosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newPoster: ServicePoster = {
        id: editingPoster?.id || Date.now().toString(),
        ...posterForm,
        imageUrl: posterImageFile ? URL.createObjectURL(posterImageFile) : editingPoster?.imageUrl || '',
        createdAt: editingPoster?.createdAt || new Date()
      };

      if (editingPoster) {
        setPosters(prev => prev.map(p => p.id === editingPoster.id ? newPoster : p));
        toast.success('Poster updated successfully!');
      } else {
        setPosters(prev => [...prev, newPoster]);
        toast.success('Poster created successfully!');
      }

      resetPosterForm();
    } catch (error) {
      toast.error('Failed to save poster');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newService: ServiceItem = {
        id: editingService?.id || Date.now().toString(),
        ...serviceForm,
        imageUrl: serviceImageFile ? URL.createObjectURL(serviceImageFile) : editingService?.imageUrl
      };

      if (editingService) {
        setServices(prev => prev.map(s => s.id === editingService.id ? newService : s));
        toast.success('Service updated successfully!');
      } else {
        setServices(prev => [...prev, newService]);
        toast.success('Service created successfully!');
      }

      resetServiceForm();
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const resetPosterForm = () => {
    setPosterForm({
      title: '',
      description: '',
      serviceType: '',
      priceRange: '',
      duration: '',
      isActive: true
    });
    setPosterImageFile(null);
    setEditingPoster(null);
    setShowPosterForm(false);
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: 0,
      duration: '',
      category: '',
      isPopular: false
    });
    setServiceImageFile(null);
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleEditPoster = (poster: ServicePoster) => {
    setEditingPoster(poster);
    setPosterForm({
      title: poster.title,
      description: poster.description,
      serviceType: poster.serviceType,
      priceRange: poster.priceRange,
      duration: poster.duration,
      isActive: poster.isActive
    });
    setShowPosterForm(true);
  };

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      isPopular: service.isPopular
    });
    setShowServiceForm(true);
  };

  const handleDeletePoster = (id: string) => {
    if (confirm('Are you sure you want to delete this poster?')) {
      setPosters(prev => prev.filter(p => p.id !== id));
      toast.success('Poster deleted successfully!');
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service deleted successfully!');
    }
  };

  const togglePosterStatus = (id: string) => {
    setPosters(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
    toast.success('Poster status updated!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
          <p className="text-gray-600">Manage service posters and service listings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('posters')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posters'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ImageIcon size={16} className="inline mr-2" />
            Service Posters ({posters.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Service List ({services.length})
          </button>
        </nav>
      </div>

      {/* Service Posters Tab */}
      {activeTab === 'posters' && (
        <div className="space-y-6">
          {/* Add Poster Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowPosterForm(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Poster</span>
            </button>
          </div>

          {/* Posters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posters.map((poster, index) => (
              <motion.div
                key={poster.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                {/* Poster Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={poster.imageUrl}
                    alt={poster.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                    poster.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {poster.isActive ? 'Active' : 'Inactive'}
                  </div>

                  {/* Service Type Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-gray-900">{poster.serviceType}</span>
                  </div>
                </div>

                {/* Poster Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{poster.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{poster.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="text-gray-700">{poster.priceRange}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock size={14} className="text-blue-600" />
                      <span className="text-gray-700">{poster.duration}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPoster(poster)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => togglePosterStatus(poster.id)}
                      className="flex items-center justify-center bg-gray-50 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {poster.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeletePoster(poster.id)}
                      className="flex items-center justify-center bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Service List Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Add Service Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowServiceForm(true)}
              classNam