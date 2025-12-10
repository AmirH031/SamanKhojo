import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Video, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  Eye,
  X,
  Save,
  Upload,
  Search,
  Filter,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AssetMetadata } from '../../types/Festival';
import { festivalService } from '../../services/festivalService';
import SimpleAssetUploader from './SimpleAssetUploader';

interface AssetManagerProps {
  onAssetSelect?: (asset: AssetMetadata) => void;
  selectedAssetId?: string;
  showUploader?: boolean;
}

const AssetManager: React.FC<AssetManagerProps> = ({ 
  onAssetSelect, 
  selectedAssetId,
  showUploader = true 
}) => {
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'banner' | 'poster' | 'video'>('all');
  const [editingAsset, setEditingAsset] = useState<AssetMetadata | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [replacingAssetId, setReplacingAssetId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<AssetMetadata | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const assetsData = await festivalService.getAvailableAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      await festivalService.deleteAsset(assetId);
      toast.success('Asset deleted successfully!');
      await fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleDuplicateAsset = async (assetId: string) => {
    try {
      await festivalService.duplicateAsset(assetId);
      toast.success('Asset duplicated successfully!');
      await fetchAssets();
    } catch (error) {
      console.error('Error duplicating asset:', error);
      toast.error('Failed to duplicate asset');
    }
  };

  const handleReplaceAsset = async (assetId: string, newFile: File) => {
    try {
      await festivalService.replaceAsset(assetId, newFile);
      toast.success('Asset replaced successfully!');
      setReplacingAssetId(null);
      await fetchAssets();
    } catch (error) {
      console.error('Error replacing asset:', error);
      toast.error('Failed to replace asset');
    }
  };

  const handleUpdateAsset = async (assetId: string, updates: Partial<AssetMetadata>) => {
    try {
      await festivalService.updateAsset(assetId, updates);
      toast.success('Asset updated successfully!');
      setEditingAsset(null);
      await fetchAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  const handleDownloadAsset = (asset: AssetMetadata) => {
    const link = document.createElement('a');
    link.href = asset.firebaseUrl;
    link.download = asset.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (asset: AssetMetadata) => {
    if (asset.type === 'video') {
      return <Video className="text-red-500" size={20} />;
    }
    return <Image className="text-blue-500" size={20} />;
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
        <div>
          <h3 className="text-xl font-bold text-gray-900">Asset Manager</h3>
          <p className="text-gray-600">Manage your festival assets</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchAssets}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          
          {showUploader && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Upload size={16} />
              <span>Upload Assets</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="banner">Banners</option>
            <option value="poster">Posters</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Image size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No assets found. Upload some assets to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAssetId === asset.id}
              onSelect={() => onAssetSelect?.(asset)}
              onEdit={() => setEditingAsset(asset)}
              onDelete={() => handleDeleteAsset(asset.id)}
              onDuplicate={() => handleDuplicateAsset(asset.id)}
              onReplace={() => setReplacingAssetId(asset.id)}
              onDownload={() => handleDownloadAsset(asset)}
              onPreview={() => setPreviewAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Upload New Assets</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <SimpleAssetUploader
                  onUploadComplete={(assets) => {
                    fetchAssets();
                    setShowUploadModal(false);
                    toast.success(`${assets.length} asset(s) uploaded successfully!`);
                  }}
                  acceptedTypes={['image/*', 'video/*']}
                  maxFiles={10}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Asset Modal */}
      <AnimatePresence>
        {editingAsset && (
          <EditAssetModal
            asset={editingAsset}
            onClose={() => setEditingAsset(null)}
            onSave={(updates) => handleUpdateAsset(editingAsset.id, updates)}
          />
        )}
      </AnimatePresence>

      {/* Replace Asset Modal */}
      <AnimatePresence>
        {replacingAssetId && (
          <ReplaceAssetModal
            assetId={replacingAssetId}
            onClose={() => setReplacingAssetId(null)}
            onReplace={handleReplaceAsset}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <PreviewAssetModal
            asset={previewAsset}
            onClose={() => setPreviewAsset(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Asset Card Component
const AssetCard: React.FC<{
  asset: AssetMetadata;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReplace: () => void;
  onDownload: () => void;
  onPreview: () => void;
}> = ({ 
  asset, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onReplace, 
  onDownload, 
  onPreview 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      {/* Asset Preview */}
      <div 
        className="relative bg-gray-100 overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      >
        {asset.type === 'video' ? (
          <video
            src={asset.firebaseUrl}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={asset.firebaseUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Preview Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
        >
          <Eye className="text-white" size={24} />
        </button>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            asset.type === 'video' ? 'bg-red-500 text-white' :
            asset.type === 'banner' ? 'bg-blue-500 text-white' :
            'bg-green-500 text-white'
          }`}>
            {asset.type}
          </span>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-32"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplace();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Upload size={14} />
                    <span>Replace</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Copy size={14} />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Asset Info */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 truncate mb-1" title={asset.name}>
          {asset.name}
        </h4>
        <p className="text-sm text-gray-500 mb-2">
          {formatFileSize(asset.size)}
        </p>
        {asset.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {asset.description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Edit Asset Modal
const EditAssetModal: React.FC<{
  asset: AssetMetadata;
  onClose: () => void;
  onSave: (updates: Partial<AssetMetadata>) => void;
}> = ({ asset, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: asset.name,
    description: asset.description || '',
    tags: asset.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      description: formData.description,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Edit Asset</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="festival, banner, diwali"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Replace Asset Modal
const ReplaceAssetModal: React.FC<{
  assetId: string;
  onClose: () => void;
  onReplace: (assetId: string, file: File) => void;
}> = ({ assetId, onClose, onReplace }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleReplace = () => {
    if (selectedFile) {
      onReplace(assetId, selectedFile);
    }
  };

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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Replace Asset</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <Upload className="mx-auto mb-4 text-gray-400" size={32} />
            <p className="text-gray-600 mb-2">
              {selectedFile ? selectedFile.name : 'Drop new file here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              This will replace the current asset file
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReplace}
              disabled={!selectedFile}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} />
              <span>Replace Asset</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Preview Asset Modal
const PreviewAssetModal: React.FC<{
  asset: AssetMetadata;
  onClose: () => void;
}> = ({ asset, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{asset.name}</h3>
            <p className="text-gray-600">{asset.type} • {(asset.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-center">
            {asset.type === 'video' ? (
              <video
                src={asset.firebaseUrl}
                controls
                className="max-w-full max-h-96 rounded-lg"
              />
            ) : (
              <img
                src={asset.firebaseUrl}
                alt={asset.name}
                className="max-w-full max-h-96 rounded-lg object-contain"
              />
            )}
          </div>
          
          {asset.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700">{asset.description}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssetManager;