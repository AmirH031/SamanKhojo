import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Copy, ExternalLink, Tag, Calendar, User, BarChart3 } from 'lucide-react';
import { AssetMetadata } from '../../types/Festival';
import { toast } from 'react-toastify';

interface AssetPreviewModalProps {
  isOpen: boolean;
  asset: AssetMetadata | null;
  onClose: () => void;
}

const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({
  isOpen,
  asset,
  onClose
}) => {
  const copyUrl = async () => {
    if (!asset) return;
    
    try {
      await navigator.clipboard.writeText(asset.firebaseUrl);
      toast.success('Asset URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !asset) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{asset.name}</h2>
            <p className="text-gray-600 text-sm">{asset.originalName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={asset.firebaseUrl}
              download={asset.originalName}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
            <button
              onClick={copyUrl}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy size={16} />
              <span>Copy URL</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Asset Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
            
            <div className="bg-gray-100 rounded-xl overflow-hidden">
              {asset.type === 'video' ? (
                <video
                  src={asset.firebaseUrl}
                  controls
                  className="w-full max-h-80 object-contain"
                  poster={asset.thumbnailUrl}
                >
                  Your browser does not support video playback.
                </video>
              ) : asset.type === 'audio' ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="text-green-600" size={24} />
                  </div>
                  <audio controls className="w-full">
                    <source src={asset.firebaseUrl} type={asset.mimeType} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : (
                <img
                  src={asset.firebaseUrl}
                  alt={asset.name}
                  className="w-full max-h-80 object-contain"
                />
              )}
            </div>
          </div>

          {/* Asset Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{asset.type}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900 capitalize">{asset.category}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">File Size:</span>
                  <span className="font-medium text-gray-900">{formatFileSize(asset.size)}</span>
                </div>
                
                {asset.dimensions && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dimensions:</span>
                    <span className="font-medium text-gray-900">
                      {asset.dimensions.width} × {asset.dimensions.height}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">MIME Type:</span>
                  <span className="font-medium text-gray-900">{asset.mimeType}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Animated:</span>
                  <span className={`font-medium ${asset.isAnimated ? 'text-green-600' : 'text-gray-900'}`}>
                    {asset.isAnimated ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {asset.description && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{asset.description}</p>
              </div>
            )}

            {/* Tags */}
            {asset.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Usage Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} className="text-blue-600" />
                  <span className="text-gray-600">Used in {asset.usageCount} festivals/templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-green-600" />
                  <span className="text-gray-600">
                    Created: {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-purple-600" />
                  <span className="text-gray-600">Uploaded by admin</span>
                </div>
              </div>
            </div>

            {/* Firebase Storage Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Storage Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Firebase Path:</span>
                  <code className="block bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                    {asset.firebasePath}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Public URL:</span>
                  <button
                    onClick={copyUrl}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    Copy URL
                  </button>
                  <a
                    href={asset.firebaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs"
                  >
                    <ExternalLink size={12} className="inline" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AssetPreviewModal;