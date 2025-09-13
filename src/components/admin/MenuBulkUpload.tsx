import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Languages } from 'lucide-react';
import { ItemInput, validateItem } from '../../types/Item';
import { parseItemCSV } from '../../services/itemService';

// Legacy type alias for backward compatibility
type MenuItemInput = ItemInput;
import { batchTransliterate } from '../../services/transliterationService';

interface MenuBulkUploadProps {
  shopId: string;
  shopName: string;
  onUpload: (items: Omit<MenuItemInput, 'shopId'>[]) => Promise<void>;
  onCancel: () => void;
}

interface ParsedItem extends Omit<MenuItemInput, 'shopId'> {
  rowIndex: number;
  errors: string[];
  hasHindiName: boolean;
}

const MenuBulkUpload: React.FC<MenuBulkUploadProps> = ({
  shopId,
  shopName,
  onUpload,
  onCancel
}) => {
  const [csvData, setCsvData] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      setUploadError('');
    };
    reader.readAsText(file);
  };

  const handleParseCSV = () => {
    if (!csvData.trim()) {
      setUploadError('Please upload a CSV file or paste CSV data');
      return;
    }

    try {
      setLoading(true);
      const items = parseItemCSV(csvData, 'menu');
      
      // Process items with transliteration and validation
      const processedItems: ParsedItem[] = items.map((item, index) => {
        // Auto-transliterate if hindi_name is missing
        const processedItem = { ...item };
        const hadHindiName = !!(item.hindi_name && item.hindi_name.trim());
        
        if (!hadHindiName && item.name) {
          const transliterated = batchTransliterate([{ name: item.name, hindi_name: item.hindi_name }]);
          processedItem.hindi_name = transliterated[0].hindi_name;
        }
        
        // Validate item using bulk validation (no shopId required)
        const errors = validateItem({ ...processedItem, shopId: 'temp' });
        
        return {
          ...processedItem,
          rowIndex: index + 2, // +2 because CSV has header row and is 1-indexed
          errors,
          hasHindiName: hadHindiName
        };
      });

      setParsedItems(processedItems);
      setShowPreview(true);
      setUploadError('');
    } catch (error: any) {
      setUploadError(error.message || 'Failed to parse CSV data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    const validItems = parsedItems.filter(item => item.errors.length === 0);
    
    if (validItems.length === 0) {
      setUploadError('No valid items to upload. Please fix the errors.');
      return;
    }

    setLoading(true);
    try {
      // Remove validation fields before upload
      const itemsToUpload = validItems.map(({ rowIndex, errors, hasHindiName, ...item }) => item);
      await onUpload(itemsToUpload);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload menu items');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
  const template = `name,hindi_name,category,type,brand_name,price,availability
Butter Chicken,,Main Course,menu,,350,true
Masala Dosa,,South Indian,menu,,120,true
Gulab Jamun,,Desserts,menu,,80,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu_items_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const validItemsCount = parsedItems.filter(item => item.errors.length === 0).length;
  const errorItemsCount = parsedItems.filter(item => item.errors.length > 0).length;
  const autoTransliteratedCount = parsedItems.filter(item => !item.hasHindiName && item.hindi_name).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-teal-500 text-white">
          <div className="flex items-center space-x-3">
            <Upload size={24} />
            <div>
              <h2 className="text-xl font-bold">Bulk Upload Menu Items</h2>
              <p className="text-green-100 text-sm">Upload multiple menu items for {shopName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showPreview ? (
            /* Upload Section */
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-600" size={20} />
                    <div>
                      <h3 className="font-medium text-blue-900">Download Template</h3>
                      <p className="text-blue-700 text-sm">
                        Use our template to format your menu items correctly
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 font-medium hover:text-blue-700">
                      Click to upload CSV file
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-gray-500 text-sm mt-2">
                    Or drag and drop your CSV file here
                  </p>
                </div>
              </div>

              {/* Manual CSV Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Paste CSV Data
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Error Display */}
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2"
                >
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{uploadError}</span>
                </motion.div>
              )}

              {/* Parse Button */}
              <button
                onClick={handleParseCSV}
                disabled={!csvData.trim() || loading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FileText size={18} />
                    <span>Parse & Preview</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="text-green-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-green-900">{validItemsCount}</div>
                  <div className="text-green-700 text-sm">Valid Items</div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <Languages className="text-blue-600 mx-auto mb-2" size={24} />
                  <div className="text-2xl font-bold text-blue-900">{autoTransliteratedCount}</div>
                  <div className="text-blue-700 text-sm">Auto-translated</div>
                </div>
                
                {errorItemsCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <AlertCircle className="text-red-600 mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold text-red-900">{errorItemsCount}</div>
                    <div className="text-red-700 text-sm">Items with Errors</div>
                  </div>
                )}
              </div>

              {/* Items Preview */}
              <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                <h3 className="font-medium text-gray-900 mb-4">Preview ({parsedItems.length} items)</h3>
                
                <div className="space-y-3">
                  {parsedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        item.errors.length > 0
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            {item.hindi_name && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Languages size={12} />
                                <span className="text-sm">{item.hindi_name}</span>
                                {!item.hasHindiName && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">auto</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            {item.category && (
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                Category: {item.category}
                              </span>
                            )}
                            {item.price && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                ₹{item.price}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded ${
                              item.isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          
                          {item.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {item.errors.length > 0 ? (
                            <div className="text-red-600">
                              <AlertCircle size={16} />
                            </div>
                          ) : (
                            <div className="text-green-600">
                              <CheckCircle size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Error Messages */}
                      {item.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg">
                          <h5 className="text-red-800 font-medium text-sm mb-1">
                            Row {item.rowIndex} Errors:
                          </h5>
                          <ul className="text-red-700 text-xs space-y-1">
                            {item.errors.map((error, errorIndex) => (
                              <li key={errorIndex}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Error */}
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2"
                >
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-700">{uploadError}</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setParsedItems([]);
                    setCsvData('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Back to Upload
                </button>
                
                <button
                  onClick={handleConfirmUpload}
                  disabled={loading || validItemsCount === 0}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Upload {validItemsCount} Items</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* CSV Format Guide */}
          {!showPreview && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">CSV Format Guide</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Required columns:</strong> name</p>
                <p><strong>Optional columns:</strong> hindi_name, description, category, price, isAvailable</p>
                <p><strong>Notes:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-4">
                  <li>If hindi_name is empty, it will be auto-generated from the English name</li>
                  <li>Price should be a number (without ₹ symbol)</li>
                  <li>isAvailable should be 'true' or 'false' (defaults to true)</li>
                  <li>Use commas to separate columns, no quotes needed unless text contains commas</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuBulkUpload;
