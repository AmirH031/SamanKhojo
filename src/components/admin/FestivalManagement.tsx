import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Video, 
  Save,
  X,
  Upload,
  Sparkles,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Festival, AssetMetadata } from '../../types/Festival';
import { festivalService } from '../../services/festivalService';
import AssetUploader from './AssetUploader';
import AssetManager from './AssetManager';
import CustomOverlayEditor from './CustomOverlayEditor';

const FestivalManagement: React.FC = () => {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [availableAssets, setAvailableAssets] = useState<AssetMetadata[]>([]);
  const [showAssetManager, setShowAssetManager] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadFestivals(), loadAssets()]);
  };

  const loadFestivals = async () => {
    try {
      setLoading(true);
      const festivalsData = await festivalService.getAllFestivals();
      setFestivals(festivalsData);
    } catch (error) {
      toast.error('Failed to load festivals');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const assets = await festivalService.getAvailableAssets();
      setAvailableAssets(assets);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleToggleFestival = async (festivalId: string) => {
    try {
      await festivalService.toggleFestivalStatus(festivalId);
      toast.success('Festival status updated successfully');
      await loadFestivals();
    } catch (error) {
      toast.error('Failed to update festival status');
    }
  };

  const handleDeleteFestival = async (festivalId: string) => {
    if (!confirm('Are you sure you want to delete this festival? This action cannot be undone.')) {
      return;
    }

    try {
      await festivalService.deleteFestival(festivalId);
      toast.success('Festival deleted successfully');
      await loadFestivals();
    } catch (error) {
      toast.error('Failed to delete festival');
    }
  };

  const getFestivalStatus = (festival: Festival) => {
    const now = new Date();
    const startDate = new Date(festival.startDate);
    const endDate = new Date(festival.endDate);

    if (!festival.isActive) {
      return { status: 'inactive', text: 'Inactive', color: 'gray' };
    }

    if (now < startDate) {
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'upcoming', text: `Starts in ${daysUntil}d`, color: 'blue' };
    }

    if (now >= startDate && now <= endDate) {
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'active', text: `${daysLeft}d left`, color: 'green' };
    }

    return { status: 'expired', text: 'Expired', color: 'red' };
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
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Festival Management</h2>
            <p className="text-gray-600">Manage homepage festival banners and promotions</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAssetManager(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            <Upload size={20} />
            <span>Asset Manager</span>
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            <span>Create Festival</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Festivals</p>
              <p className="text-2xl font-bold text-gray-900">{festivals.length}</p>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-green-600">
                {festivals.filter(f => getFestivalStatus(f).status === 'active').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {festivals.filter(f => getFestivalStatus(f).status === 'upcoming').length}
              </p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Assets</p>
              <p className="text-2xl font-bold text-purple-600">{availableAssets.length}</p>
            </div>
            <ImageIcon className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Festivals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {festivals.map((festival) => {
          const status = getFestivalStatus(festival);
          const bannerAsset = availableAssets.find(asset => 
            asset.id === festival.style?.assets?.bannerAssetId
          );

          return (
            <FestivalCard
              key={festival.id}
              festival={festival}
              status={status}
              bannerAsset={bannerAsset}
              onEdit={() => setEditingFestival(festival)}
              onToggle={() => handleToggleFestival(festival.id)}
              onDelete={() => handleDeleteFestival(festival.id)}
            />
          );
        })}
      </div>

      {/* Asset Manager Modal */}
      <AnimatePresence>
        {showAssetManager && (
          <AssetManagerModal
            onClose={() => setShowAssetManager(false)}
            onAssetsChange={loadAssets}
          />
        )}
      </AnimatePresence>

      {/* Festival Form Modal */}
      <AnimatePresence>
        {(showCreateForm || editingFestival) && (
          <FestivalFormModal
            festival={editingFestival}
            availableAssets={availableAssets}
            onClose={() => {
              setShowCreateForm(false);
              setEditingFestival(null);
            }}
            onSuccess={() => {
              setShowCreateForm(false);
              setEditingFestival(null);
              loadFestivals();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Festival Card Component
const FestivalCard: React.FC<{
  festival: Festival;
  status: any;
  bannerAsset?: AssetMetadata;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ festival, status, bannerAsset, onEdit, onToggle, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Banner Preview */}
      <div 
        className="relative bg-gradient-to-r from-purple-500 to-pink-500"
        style={{ aspectRatio: '3780 / 1890', maxHeight: '120px' }}
      >
        {bannerAsset ? (
          bannerAsset.type === 'video' ? (
            <video
              src={bannerAsset.firebaseUrl}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
            />
          ) : (
            <img
              src={bannerAsset.firebaseUrl}
              alt={festival.displayName}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles size={32} className="text-white/80" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.color === 'green' ? 'bg-green-500 text-white' :
            status.color === 'blue' ? 'bg-blue-500 text-white' :
            status.color === 'red' ? 'bg-red-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Festival Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {festival.displayName}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {festival.description}
        </p>
        
        {/* Dates */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Start: {new Date(festival.startDate).toLocaleDateString()}</div>
          <div>End: {new Date(festival.endDate).toLocaleDateString()}</div>
        </div>

        {/* Banner Asset Info */}
        {bannerAsset && (
          <div className="bg-gray-50 rounded-lg p-2 mb-4">
            <div className="flex items-center space-x-2">
              {bannerAsset.type === 'video' ? (
                <Video size={16} className="text-red-500" />
              ) : (
                <ImageIcon size={16} className="text-blue-500" />
              )}
              <span className="text-sm text-gray-700 truncate">
                {bannerAsset.name}
              </span>
            </div>
          </div>
        )}

        {/* Festival Effects Info */}
        <div className="flex items-center space-x-2 mb-4">
          {festival.style?.effects?.sparkles && (
            <div className="flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs">
              <Sparkles size={12} />
              <span>Sparkles</span>
            </div>
          )}
          {!festival.style?.effects?.sparkles && (
            <div className="flex items-center space-x-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-full text-xs">
              <span>No Effects</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Festival"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onToggle}
              className={`p-2 rounded-lg transition-colors ${
                festival.isActive
                  ? 'text-orange-600 hover:bg-orange-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={festival.isActive ? 'Deactivate' : 'Activate'}
            >
              {festival.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Asset Manager Modal Component
const AssetManagerModal: React.FC<{
  onClose: () => void;
  onAssetsChange: () => void;
}> = ({ onClose, onAssetsChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Asset Manager</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <AssetManager 
            showUploader={true}
            onAssetSelect={() => {}}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Festival Form Modal Component
const FestivalFormModal: React.FC<{
  festival?: Festival | null;
  availableAssets: AssetMetadata[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ festival, availableAssets, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    displayName: festival?.displayName || '',
    description: festival?.description || '',
    startDate: festival?.startDate?.split('T')[0] || '',
    endDate: festival?.endDate?.split('T')[0] || '',
    bannerAssetId: festival?.style?.assets?.bannerAssetId || '',
    videoAssetId: festival?.style?.assets?.videoAssetIds?.[0] || '',
    stickerAssetIds: festival?.style?.assets?.stickerAssetIds || [],
    customOverlayCode: festival?.style?.assets?.customOverlayCode || '',
    bannerPosition: festival?.style?.layout?.bannerPosition || 'hero',
    showBannerInHero: festival?.style?.layout?.showBannerInHero !== false ? 'true' : 'false',
    sparklesEnabled: festival?.style?.effects?.sparkles !== false ? 'true' : 'false',
    customSparkles: festival?.style?.effects?.customSparkles || false,
    borderStyle: festival?.style?.bannerStyle?.borderStyle || 'none',
    borderWidth: festival?.style?.bannerStyle?.borderWidth || 2,
    borderColor: festival?.style?.bannerStyle?.borderColor || '#3B82F6',
    borderRadius: festival?.style?.bannerStyle?.borderRadius || 12,
    shadow: festival?.style?.bannerStyle?.shadow || 'none',
    backgroundOverlay: festival?.style?.bannerStyle?.backgroundOverlay || 'none',
    primaryColor: festival?.style?.colors?.primary || '#3B82F6',
    secondaryColor: festival?.style?.colors?.secondary || '#8B5CF6',
    accentColor: festival?.style?.colors?.accent || '#F59E0B'
  });
  const [saving, setSaving] = useState(false);
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const cleanBannerAssetId = formData.bannerAssetId && formData.bannerAssetId.trim() !== '' 
        ? formData.bannerAssetId 
        : null;

      const festivalData = {
        name: formData.displayName.toLowerCase().replace(/\s+/g, '-'),
        displayName: formData.displayName,
        description: formData.description || '',
        startDate: formData.startDate,
        endDate: formData.endDate,
        style: {
          name: formData.displayName.toLowerCase().replace(/\s+/g, '-'),
          displayName: formData.displayName,
          colors: {
            primary: formData.primaryColor || '#3B82F6',
            secondary: formData.secondaryColor || '#8B5CF6',
            accent: formData.accentColor || '#F59E0B',
            background: '#FFFFFF',
            text: '#1F2937'
          },
          effects: {
            confetti: false,
            sparkles: formData.sparklesEnabled === 'true',
            customSparkles: formData.customSparkles,
            glow: false,
            snow: false,
            colorSplash: false,
            particles: false,
            customOverlay: !!formData.customOverlayCode
          },
          animations: {
            float: false,
            pulse: false,
            rotate: false,
            bounce: false,
            fade: true
          },
          layout: {
            bannerPosition: (formData.bannerPosition || 'hero') as 'hero' | 'navbar' | 'footer' | 'sidebar' | 'popup' | 'overlay',
            overlayPosition: 'center' as const,
            showBannerInHero: formData.showBannerInHero === 'true',
            decorationDensity: 'low' as const
          },
          assets: {
            ...(cleanBannerAssetId && { bannerAssetId: cleanBannerAssetId }),
            ...(formData.videoAssetId && { videoAssetIds: [formData.videoAssetId] }),
            stickerAssetIds: formData.stickerAssetIds,
            customOverlayCode: formData.customOverlayCode || undefined,
            decorationAssetIds: []
          },
          bannerStyle: {
            borderStyle: formData.borderStyle,
            borderWidth: formData.borderWidth,
            borderColor: formData.borderColor,
            borderRadius: formData.borderRadius,
            shadow: formData.shadow,
            backgroundOverlay: formData.backgroundOverlay
          },
          sounds: {
            enabled: false,
            volume: 0.5
          }
        }
      };

      if (festival) {
        await festivalService.updateFestival(festival.id, festivalData);
        
        if (cleanBannerAssetId) {
          await festivalService.linkAssetToFestival(cleanBannerAssetId, festival.id);
        }
        
        toast.success('Festival updated successfully');
      } else {
        const newFestival = await festivalService.createFestival(festivalData);
        
        if (cleanBannerAssetId) {
          await festivalService.linkAssetToFestival(cleanBannerAssetId, newFestival.id);
        }
        
        toast.success('Festival created successfully');
      }
      
      onSuccess();
    } catch (error: any) {
      let errorMessage = 'Failed to save festival';
      if (error.message?.includes('invalid data')) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your admin access.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const bannerAssets = availableAssets.filter(asset => 
    asset.type === 'banner' || asset.type === 'poster'
  );
  
  const videoAssets = availableAssets.filter(asset => asset.type === 'video');
  const stickerAssets = availableAssets.filter(asset => asset.type === 'sticker');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {festival ? 'Edit Festival' : 'Create Festival'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Festival Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g. Diwali Sale 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Asset
              </label>
              <select
                value={formData.bannerAssetId}
                onChange={(e) => setFormData(prev => ({ ...prev, bannerAssetId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Banner</option>
                {bannerAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Video and Stickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Background
              </label>
              <select
                value={formData.videoAssetId}
                onChange={(e) => setFormData(prev => ({ ...prev, videoAssetId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Video</option>
                {videoAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stickers ({formData.stickerAssetIds.length} selected)
              </label>
              <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {stickerAssets.length > 0 ? (
                  stickerAssets.map(asset => (
                    <label key={asset.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.stickerAssetIds.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              stickerAssetIds: [...prev.stickerAssetIds, asset.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              stickerAssetIds: prev.stickerAssetIds.filter(id => id !== asset.id)
                            }));
                          }
                        }}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-700 truncate">{asset.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 p-2">No sticker assets available</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the festival promotion"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom Overlay Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Overlay Code (HTML/CSS/JS)
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {formData.customOverlayCode ? 
                    `${formData.customOverlayCode.length} characters of custom code` : 
                    'No custom overlay code'
                  }
                </span>
                <button
                  type="button"
                  onClick={() => setShowOverlayEditor(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {formData.customOverlayCode ? 'Edit Code' : 'Add Code'}
                </button>
              </div>
              {formData.customOverlayCode && (
                <div className="bg-white border rounded p-2 max-h-20 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {formData.customOverlayCode.substring(0, 200)}
                    {formData.customOverlayCode.length > 200 && '...'}
                  </pre>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Custom overlay code will be applied to the entire website when this festival is active
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Banner Preview */}
          {formData.bannerAssetId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Preview (3780×1890px recommended)
              </label>
              <div 
                className="relative bg-gray-100 rounded-lg overflow-hidden"
                style={{ aspectRatio: '3780 / 1890', maxHeight: '200px' }}
              >
                {(() => {
                  const selectedAsset = bannerAssets.find(asset => asset.id === formData.bannerAssetId);
                  if (!selectedAsset) return null;
                  
                  return selectedAsset.type === 'video' ? (
                    <video
                      src={selectedAsset.firebaseUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                    />
                  ) : (
                    <img
                      src={selectedAsset.firebaseUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* Homepage Layout Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Homepage Layout Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Position
                </label>
                <select
                  value={formData.bannerPosition || 'hero'}
                  onChange={(e) => setFormData(prev => ({ ...prev, bannerPosition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hero">Hero Section (Top)</option>
                  <option value="navbar">Navigation Bar</option>
                  <option value="footer">Footer</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Homepage Display
                </label>
                <select
                  value={formData.showBannerInHero || 'true'}
                  onChange={(e) => setFormData(prev => ({ ...prev, showBannerInHero: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Show Festival Banner</option>
                  <option value="false">Show Feature Boxes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose whether to display the festival banner or default feature boxes in the hero section
                </p>
              </div>
            </div>

            {/* Festival Effects */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Festival Effects
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sparklesEnabled"
                    checked={formData.sparklesEnabled === 'true'}
                    onChange={(e) => setFormData(prev => ({ ...prev, sparklesEnabled: e.target.checked ? 'true' : 'false' }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sparklesEnabled" className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span>Enable Sparkles Animation</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="customSparkles"
                    checked={formData.customSparkles}
                    onChange={(e) => setFormData(prev => ({ ...prev, customSparkles: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={formData.sparklesEnabled !== 'true'}
                  />
                  <label htmlFor="customSparkles" className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                    <Sparkles size={16} className="text-orange-500" />
                    <span>Custom Sparkles Pattern</span>
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add animated sparkles effect to the festival banner. Custom pattern creates more elaborate star-shaped sparkles.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Festival Theme Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={formData.primaryColor || '#3B82F6'}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={formData.secondaryColor || '#8B5CF6'}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Accent Color</label>
                  <input
                    type="color"
                    value={formData.accentColor || '#F59E0B'}
                    onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Border & Styling */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Banner Border & Styling</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Style
                  </label>
                  <select
                    value={formData.borderStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, borderStyle: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                    <option value="gradient">Gradient</option>
                    <option value="glow">Glow</option>
                    <option value="neon">Neon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Width (px)
                  </label>
                  <input
                    type="number"
                    value={formData.borderWidth}
                    onChange={(e) => setFormData(prev => ({ ...prev, borderWidth: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={formData.borderColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, borderColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Radius (px)
                  </label>
                  <input
                    type="number"
                    value={formData.borderRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, borderRadius: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shadow
                  </label>
                  <select
                    value={formData.shadow}
                    onChange={(e) => setFormData(prev => ({ ...prev, shadow: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">2X Large</option>
                    <option value="glow">Glow Effect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Overlay
                  </label>
                  <select
                    value={formData.backgroundOverlay}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundOverlay: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="gradient">Gradient</option>
                    <option value="pattern">Pattern</option>
                    <option value="blur">Blur</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Festival'}</span>
            </button>
          </div>
        </form>

        {/* Custom Overlay Editor Modal */}
        {showOverlayEditor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Custom Overlay Code Editor
                </h3>
                <button
                  onClick={() => setShowOverlayEditor(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <CustomOverlayEditor
                  festival={{
                    ...festival,
                    style: {
                      ...festival?.style,
                      assets: {
                        ...festival?.style?.assets,
                        customOverlayCode: formData.customOverlayCode
                      }
                    }
                  } as Festival}
                  onSave={(code) => {
                    setFormData(prev => ({ ...prev, customOverlayCode: code }));
                    setShowOverlayEditor(false);
                    toast.success('Custom overlay code updated');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FestivalManagement;