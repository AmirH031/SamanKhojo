import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { parseItemCSV } from '../../services/itemService';
import { ItemInput } from '../../types/Item';

interface MenuBulkUploadProps {
  shopId: string;
  shopName: string;
  onUpload: (items: Omit<ItemInput, 'shopId'>[]) => Promise<void>;
  onCancel: () => void;
}

const MenuBulkUpload: React.FC<MenuBulkUploadProps> = ({
  shopId,
  shopName,
  onUpload,
  onCancel
}) => {
  const [csvData, setCsvData] = useState('');
  const [parsedItems, setParsedItems] = useState<Omit<ItemInput, 'shopId'>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sampleCSV = `name,hindi_name,description,category,price,unit,isAvailable
Butter Chicken,बटर चिकन,Creamy tomato-based chicken curry,Main Course,350,plate,true
Masala Dosa,मसाला डोसा,Crispy rice crepe with spiced potato filling,South Indian,120,piece,true
Biryani,बिरयानी,Fragrant rice dish with spices and meat,Rice & Biryani,280,plate,true
Gulab Jamun,गुलाब जामुन,Sweet milk dumplings in sugar syrup,Desserts,80,piece,true`;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string) => {
    try {
      setErrors([]);
      const items = parseItemCSV(content, 'menu');
      setParsedItems(items);
      
      if (items.length === 0) {
        setErrors(['No valid items found in CSV']);
      } else {
        toast.success(`Parsed ${items.length} menu items successfully!`);
      }
    } catch (error: any) {
      console.error('CSV parsing error:', error);
      setErrors([error.message]);
      setParsedItems([]);
    }
  };

  const handleUpload = async () => {
    if (parsedItems.length === 0) {
      toast.error('No items to upload');
      return;
    }

    setLoading(true);
    try {
      await onUpload(parsedItems);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu_items_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center space-x-3">
            <Upload size={24} />
            <div>
              <h2 className="text-xl font-bold">Bulk Upload Menu Items</h2>
              <p className="text-orange-100 text-sm">{shopName}</p>
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
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">CSV Upload Instructions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload a CSV file with menu item details</li>
                  <li>• Required columns: name, category, price</li>
                  <li>• Optional columns: hindi_name, description, unit, isAvailable</li>
                  <li>• Download the sample file below for the correct format</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Download */}
          <div className="flex justify-center mb-6">
            <button
              onClick={downloadSample}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
            <p className="text-gray-600 mb-4">Choose a CSV file with your menu items</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
            >
              Choose CSV File
            </label>
          </div>

          {/* Manual CSV Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or paste CSV data directly:
            </label>
            <textarea
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                if (e.target.value.trim()) {
                  parseCSV(e.target.value);
                } else {
                  setParsedItems([]);
                  setErrors([]);
                }
              }}
              placeholder="Paste your CSV data here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Parsing Errors</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Items Preview */}
          {parsedItems.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900">
                  Successfully parsed {parsedItems.length} menu items
                </h4>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parsedItems.slice(0, 10).map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      {item.hindi_name && (
                        <p className="text-sm text-gray-600">{item.hindi_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {item.category || 'No category'}
                        </span>
                        {item.price && (
                          <span className="text-sm font-medium text-green-600">
                            ₹{item.price}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {parsedItems.length > 10 && (
                  <p className="text-center text-sm text-gray-600 mt-3">
                    ... and {parsedItems.length - 10} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || parsedItems.length === 0 || errors.length > 0}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Upload {parsedItems.length} Items</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuBulkUpload;