import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard as Edit, X, Save, Tag, FileText, Folder, Link, Calendar, Music, Video } from 'lucide-react';
import { toast } from 'react-toastify';
import { AssetMetadata, Festival } from '../../types/Festival';
import { getAllFestivals } from '../../services/festivalService';

interface AssetEditModalProps {
  isOpen: boolean;
  asset: AssetMetadata | null;
  onClose: () => void;
  onSave: (assetId: string, updates: Partial<AssetMetadata>) => Promise<void>;
}

const AssetEditModal: React.FC<AssetEditModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    type: 'decoration' as AssetMetadata['type'],
    category: 'common' as AssetMetadata['category'],
    isPublic: false,
    selectedFestivalId: ''
  });
  const [saving, setSaving] = useState(false);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loadingFestivals, setLoadingFestivals] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        description: asset.description,
        tags: asset.tags.join(', '),
        type: asset.type,
        category: asset.category,
        isPublic: asset.isPublic,
        selectedFestivalId: asset.primaryFestivalId || ''
      });
    }
  }, [asset]);

  useEffect(() => {
    if (isOpen) {
      loadFestivals();
    }
  }, [isOpen]);

  const loadFestivals = async () => {
    setLoadingFestivals(true);
    try {
      const festivalsData = await getAllFestivals();
      setFestivals(festivalsData);
    } catch (error) {
      console.error('Error loading festivals:', error);
      toast.error('Failed to load festivals');
    } finally {
      setLoadingFestivals(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    // Validate form data
    if (!formData.name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    setSaving(true);
    try {
      // Handle festival assignment logic
      let updatedFestivalIds = [...asset!.festivalIds];
      
      // If a new festival is selected and it's different from the current primary festival
      if (formData.selectedFestivalId && formData.selectedFestivalId !== asset!.primaryFestivalId) {
        // Add the new festival to the list if not already present
        if (!updatedFestivalIds.includes(formData.selectedFestivalId)) {
          updatedFestivalIds.push(formData.selectedFestivalId);
        }
      }
      
      // If no festival is selected, remove the current primary festival from the list
      if (!formData.selectedFestivalId && asset!.primaryFestivalId) {
        updatedFestivalIds = updatedFestivalIds.filter(id => id !== asset!.primaryFestivalId);
      }

      const updates: Partial<AssetMetadata> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        type: formData.type,
        category: formData.category,
        isPublic: formData.isPublic,
        primaryFestivalId: formData.selectedFestivalId || undefined,
        festivalIds: updatedFestivalIds
      };

      await onSave(asset.id, updates);
      toast.success('Asset updated successfully!');
    } catch (error: any) {
      console.error('Error saving asset:', error);
      toast.error(error?.message || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Asset</h2>
              <p className="text-gray-600 text-sm">Update asset metadata and settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Asset Preview */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {asset.thumbnailUrl ? (
                <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
              ) : asset.type === 'video' ? (
                <Video className="text-red-600" size={24} />
              ) : asset.type === 'audio' ? (
                <Music className="text-green-600" size={24} />
              ) : (
                <FileText className="text-gray-600" size={24} />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{asset.originalName}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                <span>{asset.type}</span>
                <span>•</span>
                <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                {asset.dimensions && (
                  <>
                    <span>•</span>
                    <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Used {asset.usageCount}x
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  asset.status === 'active' ? 'bg-green-100 text-green-800' :
                  asset.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {asset.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-2" />
                Asset Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder size={16} className="inline mr-2" />
                Asset Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AssetMetadata['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="banner">Banner</option>
                <option value="poster">Poster</option>
                <option value="overlay">Overlay</option>
                <option value="video">Video</option>
                <option value="decoration">Decoration</option>
                <option value="template">Template</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AssetMetadata['category'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="festival">Festival</option>
                <option value="template">Template</option>
                <option value="common">Common</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-2" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="diwali, traditional, animated"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Assign to Festival
              </label>
              <select
                value={formData.selectedFestivalId}
                onChange={(e) => setFormData(prev => ({ ...prev, selectedFestivalId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingFestivals}
              >
                <option value="">No festival assigned</option>
                {/* Active festivals first */}
                {festivals.filter(f => f.isActive).map((festival) => (
                  <option key={festival.id} value={festival.id}>
                    🎉 {festival.displayName} (Active)
                  </option>
                ))}
                {/* Inactive festivals */}
                {festivals.filter(f => !f.isActive).length > 0 && (
                  <optgroup label="Inactive Festivals">
                    {festivals.filter(f => !f.isActive).map((festival) => (
                      <option key={festival.id} value={festival.id}>
                        {festival.displayName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {loadingFestivals && (
                <p className="text-xs text-gray-500 mt-1">Loading festivals...</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Assign this asset to a specific festival for better organization
              </p>
              {asset.primaryFestivalId && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    Currently assigned to: {festivals.find(f => f.id === asset.primaryFestivalId)?.displayName || 'Unknown Festival'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this asset and its intended use..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this asset publicly accessible
            </label>
          </div>

          {/* Asset Usage Info */}
          {asset.festivalIds.length > 0 || asset.templateIds.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <h5 className="font-semibold text-yellow-900 mb-2">Asset Usage</h5>
              <div className="text-sm text-yellow-800 space-y-1">
                {asset.festivalIds.length > 0 && (
                  <p>Used in {asset.festivalIds.length} festival(s)</p>
                )}
                {asset.templateIds.length > 0 && (
                  <p>Used in {asset.templateIds.length} template(s)</p>
                )}
                <p className="text-xs text-yellow-700 mt-2">
                  Changes to this asset will affect all festivals and templates using it.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AssetEditModal;