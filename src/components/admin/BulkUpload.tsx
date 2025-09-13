import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Languages } from 'lucide-react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { addBulkItems } from '../../services/firestoreService';
import { batchTransliterate } from '../../services/transliterationService';

interface BulkUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transliterationEnabled, setTransliterationEnabled] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a valid CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (file.type === 'text/csv') {
          workbook = XLSX.read(data, { type: 'string' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Apply transliteration if enabled
        const processedData = transliterationEnabled 
          ? batchTransliterate(jsonData as any[])
          : jsonData;
        
        setPreview(processedData.slice(0, 5)); // Show first 5 rows
        
        toast.success(`File parsed successfully! ${jsonData.length} items found.`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Error parsing file. Please check the format.');
      }
    };
    
    if (file.type === 'text/csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          let workbook: XLSX.WorkBook;
          
          if (file.type === 'text/csv') {
            workbook = XLSX.read(data, { type: 'string' });
          } else {
            workbook = XLSX.read(data, { type: 'array' });
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Apply transliteration if enabled
          const processedData = transliterationEnabled 
            ? batchTransliterate(jsonData as any[])
            : jsonData;
          
          // Validate required fields
          const validItems = processedData.filter((item: any) => 
            item.name && item.shopId
          );
          
          if (validItems.length === 0) {
            toast.error('No valid items found. Please check your file format.');
            return;
          }
          
          await addBulkItems(validItems);
          toast.success(`Successfully uploaded ${validItems.length} items!`);
          onSuccess();
        } catch (error) {
          console.error('Error uploading items:', error);
          toast.error('Failed to upload items. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      if (file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error processing upload:', error);
      toast.error('Failed to process upload');
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Sugar',
        hindi_name: 'चीनी',
        category: 'Grocery',
        category_hindi: 'किराना',
        type: 'Refined',
        variety: 'White',
        brand_name: 'Tata',
        shopId: 'shop_id_here',
        price: '₹45',
        unit: 'kg',
        isAvailable: true
      },
      {
        name: 'Rice',
        hindi_name: 'चावल',
        category: 'Grocery',
        category_hindi: 'किराना',
        type: 'Basmati',
        variety: 'Long Grain',
        brand_name: 'India Gate',
        shopId: 'shop_id_here',
        price: '₹120',
        unit: 'kg',
        isAvailable: true
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items Template');
    XLSX.writeFile(wb, 'items_template.xlsx');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 max-w-2xl w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bulk Upload Items</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Transliteration Toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Languages className="text-blue-600" size={20} />
              <span className="font-medium text-blue-900">Auto Hindi Transliteration</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={transliterationEnabled}
                onChange={(e) => setTransliterationEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-blue-700">
            {transliterationEnabled 
              ? 'English names will be automatically transliterated to Hindi'
              : 'Only use existing hindi_name values from your CSV'
            }
          </p>
        </div>

        {/* Download Template */}
        <div className="text-center">
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mx-auto"
          >
            <Download size={16} />
            <span>Download Template</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Download the Excel template with sample data and required columns
          </p>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <FileText className="text-green-600" size={32} />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {preview.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-auto">
                  <h4 className="font-medium text-gray-900 mb-2">Preview (First 5 rows):</h4>
                  <div className="text-xs space-y-1">
                    {preview.map((row, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="font-medium">{row.name}</span>
                        {row.hindi_name && (
                          <span className="text-blue-600">→ {row.hindi_name}</span>
                        )}
                        <span className="text-gray-500">({row.category})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload CSV or Excel File
              </p>
              <p className="text-sm text-gray-500">
                Click to browse or drag and drop your file here
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Required Columns Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle size={16} className="text-yellow-600" />
            <span className="font-medium text-yellow-900">Required Columns</span>
          </div>
          <div className="text-sm text-yellow-800 space-y-1">
            <p><strong>Required:</strong> name, shopId</p>
            <p><strong>Optional:</strong> hindi_name, category, category_hindi, type, variety, brand_name, price, unit, isAvailable</p>
            <p><strong>Note:</strong> If hindi_name is empty, it will be auto-generated from name</p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Items</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BulkUpload;