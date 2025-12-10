import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, Video, File, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { festivalService } from '../../services/festivalService';

interface AssetUploaderProps {
  onUploadComplete?: (assets: any[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

const AssetUploader: React.FC<AssetUploaderProps> = ({
  onUploadComplete,
  acceptedTypes = ['image/*', 'video/*'],
  maxFiles = 5,
  className = ''
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidType) {
        toast.error(`${file.name}: Invalid file type`);
        return false;
      }

      if (!isValidSize) {
        toast.error(`${file.name}: File too large (max 10MB)`);
        return false;
      }

      return true;
    });

    setFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      return newFiles.slice(0, maxFiles);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    const uploadedAssets = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileKey = `${file.name}-${i}`;
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

        // Determine asset type based on file type
        let assetType: 'banner' | 'poster' | 'video' = 'banner';
        if (file.type.startsWith('video/')) {
          assetType = 'video';
        } else if (file.name.toLowerCase().includes('poster')) {
          assetType = 'poster';
        }

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileKey]: Math.min((prev[fileKey] || 0) + Math.random() * 30, 90)
          }));
        }, 200);

        try {
          const uploadedAsset = await festivalService.uploadAsset(file, assetType);
          uploadedAssets.push(uploadedAsset);
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          
          toast.success(`${file.name} uploaded successfully`);
        } catch (error: any) {
          clearInterval(progressInterval);
          
          let errorMessage = `Failed to upload ${file.name}`;
          if (error.message?.includes('invalid data')) {
            errorMessage = `${file.name}: Invalid file data. Please try again.`;
          } else if (error.message?.includes('permission')) {
            errorMessage = `${file.name}: Permission denied. Please check your admin access.`;
          } else if (error.message?.includes('network')) {
            errorMessage = `${file.name}: Network error. Please check your connection.`;
          }
          
          toast.error(errorMessage);
        }
      }

      setFiles([]);
      setUploadProgress({});
      
      if (onUploadComplete && uploadedAssets.length > 0) {
        onUploadComplete(uploadedAssets);
      }

    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="text-red-500" size={20} />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="text-blue-500" size={20} />;
    }
    return <File className="text-gray-500" size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
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
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto">
            <Upload className="text-white" size={24} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Festival Assets
            </h3>
            <p className="text-gray-600 mb-4">
              Drop files here or click to browse
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Supports images and videos up to 10MB each</p>
              <p>• Recommended banner size: <strong>3780 × 1890 pixels</strong></p>
              <p>• Aspect ratio: 2:1 (wide format)</p>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="font-medium text-gray-900">Selected Files ({files.length})</h4>
            
            {files.map((file, index) => {
              const fileKey = `${file.name}-${index}`;
              const progress = uploadProgress[fileKey] || 0;
              
              return (
                <motion.div
                  key={fileKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {uploading && progress > 0 && progress < 100 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                      </div>
                    )}
                    
                    {progress === 100 && (
                      <Check className="text-green-500" size={16} />
                    )}
                    
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload {files.length} file{files.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AssetUploader;