import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save,
  X,
  Upload,
  Palette,
  Sparkles,
  Code,
  Sticker
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AssetMetadata } from '../../types/Festival';
import { festivalService } from '../../services/festivalService';
import { standaloneBannerService, StandaloneBanner } from '../../services/standaloneBannerService';

// StandaloneBanner interface is now imported from the service

const StandaloneBannerManager: React.FC = () => {
  const [banners, setBanners] = useState<StandaloneBanner[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AssetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<StandaloneBanner | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadBanners(), loadAssets()]);
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      const banners = standaloneBannerService.getAllBanners();
      setBanners(banners);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const assets = await festivalService.getAvailableAssets();
      setAvailableAssets(assets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const handleToggleBanner = (bannerId: string) => {
    standaloneBannerService.toggleBanner(bannerId);
    loadBanners();
    toast.success('Banner status updated');
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    standaloneBannerService.deleteBanner(bannerId);
    loadBanners();
    toast.success('Banner deleted');
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
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <ImageIcon className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Standalone Banner Manager</h2>
            <p className="text-gray-600">Create and manage banners without festivals</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          <span>Create Banner</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Banners</p>
              <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
            </div>
            <ImageIcon className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Banners</p>
              <p className="text-2xl font-bold text-green-600">
                {banners.filter(b => b.isActive).length}
              </p>
            </div>
            <Eye className="text-green-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Assets</p>
              <p className="text-2xl font-bold text-purple-600">{availableAssets.length}</p>
            </div>
            <Upload className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => {
          const bannerAsset = availableAssets.find(asset => 
            asset.id === banner.bannerAssetId || asset.id === banner.videoAssetId
          );

          return (
            <BannerCard
              key={banner.id}
              banner={banner}
              bannerAsset={bannerAsset}
              onEdit={() => setEditingBanner(banner)}
              onToggle={() => handleToggleBanner(banner.id)}
              onDelete={() => handleDeleteBanner(banner.id)}
            />
          );
        })}
      </div>

      {/* Banner Form Modal */}
      <AnimatePresence>
        {(showCreateForm || editingBanner) && (
          <BannerFormModal
            banner={editingBanner}
            availableAssets={availableAssets}
            onClose={() => {
              setShowCreateForm(false);
              setEditingBanner(null);
            }}
            onSuccess={(bannerData) => {
              if (editingBanner) {
                standaloneBannerService.updateBanner(editingBanner.id, bannerData);
              } else {
                standaloneBannerService.createBanner(bannerData);
              }
              loadBanners();
              setShowCreateForm(false);
              setEditingBanner(null);
              toast.success(editingBanner ? 'Banner updated' : 'Banner created');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Banner Card Component
const BannerCard: React.FC<{
  banner: StandaloneBanner;
  bannerAsset?: AssetMetadata;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ banner, bannerAsset, onEdit, onToggle, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Banner Preview */}
      <div 
        className="relative bg-gradient-to-r from-blue-500 to-purple-500"
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
              alt={banner.name}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-white/80" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {banner.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Banner Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {banner.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {banner.description}
        </p>
        
        {/* Position */}
        <div className="text-xs text-gray-500 mb-4">
          Position: {banner.position}
        </div>

        {/* Effects Info */}
        <div className="flex items-center space-x-2 mb-4">
          {banner.style.sparkles && (
            <div className="flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs">
              <Sparkles size={12} />
              <span>Sparkles</span>
            </div>
          )}
          {banner.stickerAssetIds.length > 0 && (
            <div className="flex items-center space-x-1 bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-xs">
              <Sticker size={12} />
              <span>{banner.stickerAssetIds.length} Stickers</span>
            </div>
          )}
          {banner.customOverlayCode && (
            <div className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
              <Code size={12} />
              <span>Custom Code</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Banner"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={onToggle}
              className={`p-2 rounded-lg transition-colors ${
                banner.isActive
                  ? 'text-orange-600 hover:bg-orange-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={banner.isActive ? 'Deactivate' : 'Activate'}
            >
              {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
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

// Banner Form Modal Component
const BannerFormModal: React.FC<{
  banner?: StandaloneBanner | null;
  availableAssets: AssetMetadata[];
  onClose: () => void;
  onSuccess: (bannerData: Omit<StandaloneBanner, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ banner, availableAssets, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: banner?.name || '',
    description: banner?.description || '',
    bannerAssetId: banner?.bannerAssetId || '',
    videoAssetId: banner?.videoAssetId || '',
    stickerAssetIds: banner?.stickerAssetIds || [],
    customOverlayCode: banner?.customOverlayCode || '',
    position: banner?.position || 'hero',
    priority: banner?.priority || 1,
    sparkles: banner?.style?.sparkles || false,
    customSparkles: banner?.style?.customSparkles || false,
    borderStyle: banner?.style?.borderStyle || 'none',
    borderWidth: banner?.style?.borderWidth || 2,
    borderColor: banner?.style?.borderColor || '#3B82F6',
    borderRadius: banner?.style?.borderRadius || 12,
    shadow: banner?.style?.shadow || 'none',
    backgroundOverlay: banner?.style?.backgroundOverlay || 'none'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a banner name');
      return;
    }

    const bannerData = {
      name: formData.name,
      description: formData.description,
      bannerAssetId: formData.bannerAssetId || undefined,
      videoAssetId: formData.videoAssetId || undefined,
      stickerAssetIds: formData.stickerAssetIds,
      customOverlayCode: formData.customOverlayCode || undefined,
      isActive: true,
      style: {
        borderStyle: formData.borderStyle,
        borderWidth: formData.borderWidth,
        borderColor: formData.borderColor,
        borderRadius: formData.borderRadius,
        shadow: formData.shadow,
        backgroundOverlay: formData.backgroundOverlay,
        sparkles: formData.sparkles,
        customSparkles: formData.customSparkles
      },
      position: formData.position as any,
      priority: formData.priority
    };

    onSuccess(bannerData);
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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {banner ? 'Edit Banner' : 'Create Banner'}
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
                Banner Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Holiday Sale Banner"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hero">Hero Section</option>
                <option value="navbar">Navigation Bar</option>
                <option value="footer">Footer</option>
                <option value="sidebar">Sidebar</option>
                <option value="popup">Popup</option>
                <option value="overlay">Overlay</option>
              </select>
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
              placeholder="Brief description of the banner"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image
              </label>
              <select
                value={formData.bannerAssetId}
                onChange={(e) => setFormData(prev => ({ ...prev, bannerAssetId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Banner Image</option>
                {bannerAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Stickers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stickers/Decorations
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {stickerAssets.map(asset => (
                <label key={asset.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 truncate">{asset.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Overlay Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Overlay Code (HTML/CSS)
            </label>
            <textarea
              value={formData.customOverlayCode}
              onChange={(e) => setFormData(prev => ({ ...prev, customOverlayCode: e.target.value }))}
              placeholder="<div class='custom-overlay'>Your custom HTML/CSS here</div>"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Effects */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Effects & Styling</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sparkles"
                    checked={formData.sparkles}
                    onChange={(e) => setFormData(prev => ({ ...prev, sparkles: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sparkles" className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span>Enable Sparkles</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="customSparkles"
                  checked={formData.customSparkles}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSparkles: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="customSparkles" className="ml-2 text-sm text-gray-700">
                  Custom Sparkles Pattern
                </label>
              </div>
            </div>
          </div>

          {/* Border Styling */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Border & Shadow</h4>
            
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save Banner</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default StandaloneBannerManager;