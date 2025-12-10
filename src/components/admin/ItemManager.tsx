import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Store,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Tag,
  Star,
  Sparkles,
  Upload,
  Download,
  X,
  AlertTriangle,
  CheckCircle,
  Languages,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops, deleteShop, Shop } from '../../services/firestoreService';
import { getItems, addItem, updateItem, deleteItem, addBulkItems } from '../../services/itemService';
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Item, ItemType, ItemInput, validateItem } from '../../types/Item';
import { generateHindiName } from '../../services/transliterationService';

const ItemManager: React.FC = () => {
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedType, setSelectedType] = useState<ItemType | ''>('');
  const [items, setItems] = useState<Item[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'shops' | 'items'>('shops');
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState<ItemInput>({
    shopId: '',
    type: 'product',
    name: '',
    description: '',
    price: '',
    category: '',
    availability: true,
    inStock: true,
    packs: '',
    priceRange: '',
    variety: '',
    brand_name: ''
  });

  // Bulk upload state
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [uploadMode, setUploadMode] = useState<'csv' | 'json'>('csv');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Download state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'json'>('csv');



  // Delete all shops for selected type, and cascade delete their items/services
  const handleDeleteAllShops = async () => {
    if (!selectedType) {
      toast.error('Please select an item type first');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ALL ${selectedType} shops? This will also delete all items/services in these shops. This cannot be undone!`)) return;
    try {
      const shopsToDelete = filteredShops.filter(shop => {
        if (selectedType === 'product') return true;
        if (selectedType === 'menu') return shop.shopType === 'menu' || ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '');
        if (selectedType === 'service') return shop.shopType === 'service' || shop.serviceDetails;
        return false;
      });

      if (shopsToDelete.length === 0) {
        toast.info('No shops to delete.');
        return;
      }

      for (const shop of shopsToDelete) {
        // 1. Delete all items in the shop's 'items' subcollection
        const itemsSnap = await getDocs(collection(db, 'shops', shop.id, 'items'));
        if (!itemsSnap.empty) {
          const batch = writeBatch(db);
          itemsSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
        // 2. Delete the shop document itself
        await deleteDoc(doc(db, 'shops', shop.id));
      }

      toast.success(`All ${selectedType} shops and their items deleted successfully! (${shopsToDelete.length} shops)`);
      loadShops();
    } catch (error) {
      console.error('Error deleting all shops:', error);
      toast.error('Failed to delete all shops');
    }
  };

  // Delete all items for selected shop/type
  const handleDeleteAllItems = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ALL ${selectedType || ''} items in this shop? This cannot be undone!`)) return;
    try {
      const items = await getItems(selectedShop.id, selectedType || undefined, true);
      if (items.length === 0) {
        toast.info('No items to delete.');
        return;
      }
      const batch = writeBatch(db);
      items.forEach(item => {
        const itemRef = doc(db, 'shops', selectedShop.id, 'items', item.id);
        batch.delete(itemRef);
      });
      await batch.commit();
      toast.success('All items deleted successfully!');
      loadShopItems();
    } catch (error) {
      console.error('Error deleting all items:', error);
      toast.error('Failed to delete all items');
    }
  };

  // Download items functionality
  const handleDownloadItems = () => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }
    if (items.length === 0) {
      toast.error('No items to download');
      return;
    }
    setShowDownloadModal(true);
  };

  const downloadItemsAsCSV = () => {
    if (!selectedShop || items.length === 0) return;

    // Define CSV headers based on item type
    const headers = [
      'name',
      'hindi_name',
      'description',
      'category',
      'price',
      'availability',
      'inStock',
      'brand_name',
      'variety',
      'packs',
      'priceRange',
      'unit',
      'highlights',
      'tags'
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...items.map(item => {
        return headers.map(header => {
          let value = item[header as keyof Item];
          
          // Handle different data types
          if (value === undefined || value === null) {
            return '';
          }
          
          if (Array.isArray(value)) {
            value = value.join(';');
          }
          
          if (typeof value === 'boolean') {
            value = value.toString();
          }
          
          if (typeof value === 'number') {
            value = value.toString();
          }
          
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedShop.shopName}_${selectedType || 'items'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${items.length} items as CSV`);
    setShowDownloadModal(false);
  };

  const downloadItemsAsJSON = () => {
    if (!selectedShop || items.length === 0) return;

    // Clean up items data for export
    const exportItems = items.map(item => {
      const { id, shopId, createdAt, updatedAt, ...cleanItem } = item;
      return cleanItem;
    });

    const jsonContent = JSON.stringify(exportItems, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedShop.shopName}_${selectedType || 'items'}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${items.length} items as JSON`);
    setShowDownloadModal(false);
  };

  const handleConfirmDownload = () => {
    if (downloadFormat === 'csv') {
      downloadItemsAsCSV();
    } else {
      downloadItemsAsJSON();
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, selectedType, searchQuery]);

  useEffect(() => {
    if (selectedShop) {
      loadShopItems();
    }
  }, [selectedShop, selectedType]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const shopsData = await getShops(true);
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = shops;

    // Filter by type if selected - show only shops that match the item type
    if (selectedType) {
      if (selectedType === 'product') {
        // Products only in product shops (general shops, kirana, grocery, etc.)
        filtered = filtered.filter(shop =>
          shop.shopType === 'product' ||
          (!shop.shopType && !['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '') && !shop.serviceDetails) // Legacy shops without shopType, but exclude restaurants/cafes/hotels and service shops
        );
      } else if (selectedType === 'menu') {
        // Menu items only in restaurants, cafes, hotels
        filtered = filtered.filter(shop =>
          shop.shopType === 'menu' ||
          ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '')
        );
      } else if (selectedType === 'service') {
        // Services can be in service shops or any shop offering services
        filtered = filtered.filter(shop =>
          shop.shopType === 'service' ||
          shop.serviceDetails
        );
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.shopName.toLowerCase().includes(query) ||
        shop.ownerName.toLowerCase().includes(query) ||
        shop.type.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query)
      );
    }

    setFilteredShops(filtered);
  };

  const loadShopItems = async () => {
    if (!selectedShop) return;

    try {
      setItemsLoading(true);
      const itemsData = await getItems(selectedShop.id, selectedType || undefined, true);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setViewMode('items');

    // Auto-select type based on shop characteristics
    if (selectedType === '') {
      if (shop.shopType === 'menu' || ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '')) {
        setSelectedType('menu');
      } else if (shop.shopType === 'service' || shop.serviceDetails) {
        setSelectedType('service');
      } else {
        setSelectedType('product');
      }
    }
  };

  const handleTypeSelect = (type: ItemType) => {
    setSelectedType(type);
    setSelectedShop(null);
    setViewMode('shops');
  };

  const handleAddItem = () => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    setFormData({
      shopId: selectedShop.id,
      type: selectedType || 'product',
      name: '',
      hindi_name: '',
      description: '',
      price: '',
      category: '',
      availability: true,
      brand_name: '',
      variety: '',
      inStock: selectedType === 'product' ? true : undefined,
      unit: (selectedType === 'menu' || selectedType === 'service') ? '' : undefined,
      packs: selectedType === 'product' ? '' : undefined,
      priceRange: selectedType === 'product' ? '' : undefined
    });
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item: Item) => {
    setFormData({
      shopId: item.shopId,
      type: item.type,
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      category: item.category || '',
      availability: item.availability !== false,
      inStock: item.type === 'product' ? (typeof item.inStock === 'boolean' ? item.inStock : true) : undefined,
      hindi_name: item.hindi_name || '',
      brand_name: Array.isArray(item.brand_name) ? item.brand_name.join(', ') : (item.brand_name || ''),
      variety: Array.isArray(item.variety) ? item.variety.join(', ') : (item.variety || ''),
      unit: (item.type === 'menu' || item.type === 'service') ? (item.unit || '') : undefined,
      packs: Array.isArray(item.packs) ? item.packs.join(', ') : (item.packs || ''),
      priceRange: Array.isArray(item.priceRange) ? `${item.priceRange[0]}-${item.priceRange[1]}` : (item.priceRange || '')
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await deleteItem(item.shopId, item.id);
      toast.success('Item deleted successfully');
      loadShopItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleBulkUpload = async (items: Omit<ItemInput, 'shopId'>[]) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    try {
      await addBulkItems(selectedShop.id, items);
      toast.success(`Successfully uploaded ${items.length} items!`);
      setShowBulkUpload(false);
      setShowPreview(false);
      setParsedItems([]);
      setCsvData('');
      setSelectedFile(null);
      setUploadError('');
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      loadShopItems();
    } catch (error) {
      console.error('Error bulk uploading items:', error);
      toast.error('Failed to upload items');
    }
  };



  const handleNameChange = (name: string) => {
    const hindiName = generateHindiName(name);
    setFormData(prev => ({
      ...prev,
      name,
      hindi_name: hindiName
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        await updateItem(editingItem.shopId, editingItem.id, formData);
        toast.success('Item updated successfully');
      } else {
        await addItem(formData);
        toast.success('Item added successfully');
      }

      setShowForm(false);
      setEditingItem(null);
      loadShopItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  // Filter items based on search
  const filteredItems = items.filter(item => {
    if (!itemSearchQuery) return true;
    const query = itemSearchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.hindi_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.brand_name?.toLowerCase().includes(query)
    );
  });

  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'product': return <Package className="w-5 h-5 text-green-600" />;
      case 'menu': return <Star className="w-5 h-5 text-blue-600" />;
      case 'service': return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'product': return 'from-green-500 to-emerald-600';
      case 'menu': return 'from-blue-500 to-indigo-600';
      case 'service': return 'from-purple-500 to-violet-600';
    }
  };

  const getShopTypeIcon = (shopType: string) => {
    switch (shopType) {
      case 'product': return '🛍️';
      case 'menu': return '🍽️';
      case 'service': return '🔧';
      default: return '🏪';
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isJSON = fileName.endsWith('.json');

    // Validate file type
    if (!isCSV && !isJSON) {
      setUploadError('Please select a CSV (.csv) or JSON (.json) file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError('');

    // Set upload mode based on file type
    if (isJSON) {
      setUploadMode('json');
    } else {
      setUploadMode('csv');
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (isJSON) {
        setJsonData(content);
        setCsvData(''); // Clear CSV data
      } else {
        setCsvData(content);
        setJsonData(''); // Clear JSON data
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setCsvData('');
    setJsonData('');
    setUploadError('');
    setUploadMode('csv');
    // Reset file input
    const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Bulk upload functions
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  // JSON parsing function
  const handleParseJSON = () => {
    if (!jsonData.trim()) {
      setUploadError('Please upload a JSON file or paste JSON data');
      return;
    }

    try {
      let jsonItems: any[];

      // Parse JSON
      const parsedData = JSON.parse(jsonData);

      // Handle both array and single object
      if (Array.isArray(parsedData)) {
        jsonItems = parsedData;
      } else {
        jsonItems = [parsedData];
      }

      if (jsonItems.length === 0) {
        throw new Error('JSON must contain at least one item');
      }

      const items: any[] = [];

      jsonItems.forEach((jsonItem, index) => {
        // Validate that it's an object
        if (typeof jsonItem !== 'object' || jsonItem === null) {
          throw new Error(`Item ${index + 1}: Must be a valid object`);
        }

        // Check for required name field
        if (!jsonItem.name || typeof jsonItem.name !== 'string' || !jsonItem.name.trim()) {
          throw new Error(`Item ${index + 1}: Missing required 'name' field`);
        }

        // Map JSON fields to item fields, ignoring specified fields
        const item: any = {
          rowIndex: index + 1,
          name: jsonItem.name.trim()
        };

        // Map optional fields (ignore shopType, category, id and other non-item fields)
        const allowedFields = [
          'hindi_name', 'description', 'price', 'availability', 'inStock',
          'brand_name', 'variety', 'packs', 'priceRange', 'unit', 'highlights', 'tags', 'category'
        ];

        allowedFields.forEach(field => {
          if (jsonItem[field] !== undefined && jsonItem[field] !== null) {
            // Handle array fields
            if (field === 'brand_name' && Array.isArray(jsonItem[field])) {
              item[field] = jsonItem[field].join(', ');
            } else if (field === 'variety' && Array.isArray(jsonItem[field])) {
              item[field] = jsonItem[field].join(', ');
            } else if (field === 'packs' && Array.isArray(jsonItem[field])) {
              item[field] = jsonItem[field].join(', ');
            } else if (field === 'highlights' && Array.isArray(jsonItem[field])) {
              item[field] = jsonItem[field];
            } else if (field === 'tags' && Array.isArray(jsonItem[field])) {
              item[field] = jsonItem[field];
            } else {
              item[field] = jsonItem[field];
            }
          }
        });

        // Handle price field - convert string ranges to numbers or keep as string
        if (jsonItem.price) {
          if (typeof jsonItem.price === 'string' && jsonItem.price.includes('-')) {
            // Keep price range as string for display, but also set a numeric price for validation
            item.priceRange = jsonItem.price;
            const prices = jsonItem.price.split('-').map(p => parseFloat(p.trim()));
            if (prices.length === 2 && !isNaN(prices[0]) && !isNaN(prices[1])) {
              item.price = prices[0]; // Use minimum price for validation
            }
          } else {
            item.price = parseFloat(jsonItem.price) || 0;
          }
        }

        // Set default values
        if (item.availability === undefined) item.availability = true;
        if (item.inStock === undefined) item.inStock = true;

        // Auto-transliterate if hindi_name is missing
        const hadHindiName = !!(item.hindi_name && item.hindi_name.trim());

        if (!hadHindiName && item.name) {
          item.hindi_name = generateHindiName(item.name);
        }

        // Validate item
        const errors = validateItem({ ...item, shopId: 'temp', type: selectedType || 'product' });

        items.push({
          ...item,
          errors,
          hasHindiName: hadHindiName
        });
      });

      setParsedItems(items);
      setShowPreview(true);
      setUploadError('');
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setUploadError('Invalid JSON format. Please check your JSON syntax.');
      } else {
        setUploadError(error.message || 'Failed to parse JSON data');
      }
    }
  };

  const handleParseCSV = () => {
    if (!csvData.trim()) {
      setUploadError('Please upload a CSV file or paste CSV data');
      return;
    }

    try {
      const lines = csvData.trim().split('\n');

      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name'];

      // Validate headers
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const items: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = parseCSVLine(line);

        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        }

        const item: any = { rowIndex: i + 1 };

        headers.forEach((header, index) => {
          const value = values[index] || '';

          switch (header) {
            case 'name':
              item.name = value;
              break;
            case 'hindi_name':
              item.hindi_name = value || undefined;
              break;
            case 'category':
              item.category = value || undefined;
              break;
            case 'type':
              item.type = value || selectedType;
              break;
            case 'variety':
              item.variety = value || undefined;
              break;
            case 'brand_name':
              item.brand_name = value || undefined;
              break;
            case 'price':
              item.price = value || undefined;
              break;
            case 'packs':
              item.packs = value || undefined;
              break;
            case 'pricerange':
            case 'price_range':
              item.priceRange = value || undefined;
              break;
            case 'instock':
            case 'in_stock':
              item.inStock = value ? (value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes') : true;
              break;
            case 'availability':
            case 'isavailable':
              item.availability = value ? (value.toLowerCase() === 'true' || value === '1') : true;
              break;
          }
        });

        // Auto-transliterate if hindi_name is missing
        const hadHindiName = !!(item.hindi_name && item.hindi_name.trim());

        if (!hadHindiName && item.name) {
          item.hindi_name = generateHindiName(item.name);
        }

        // Validate item
        const errors = validateItem({ ...item, shopId: 'temp' });

        items.push({
          ...item,
          errors,
          hasHindiName: hadHindiName
        });
      }

      setParsedItems(items);
      setShowPreview(true);
      setUploadError('');
    } catch (error: any) {
      setUploadError(error.message || 'Failed to parse CSV data');
    }
  };

  // Handle parsing based on current mode
  const handleParseData = () => {
    if (uploadMode === 'json') {
      handleParseJSON();
    } else {
      handleParseCSV();
    }
  };

  const handleConfirmUpload = async () => {
    const validItems = parsedItems.filter(item => item.errors.length === 0);

    if (validItems.length === 0) {
      setUploadError('No valid items to upload. Please fix the errors.');
      return;
    }

    try {
      // Remove validation fields before upload
      const itemsToUpload = validItems.map(({ rowIndex, errors, hasHindiName, ...item }) => ({
        ...item,
        type: selectedType || 'product'
      }));
      await handleBulkUpload(itemsToUpload);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload items');
    }
  };

  const downloadTemplate = () => {
    let template = '';
    let fileType = '';
    let mimeType = '';

    if (uploadMode === 'json') {
      // JSON template
      if (selectedType === 'product') {
        template = JSON.stringify([
          {
            "name": "Basmati Rice",
            "hindi_name": "बासमती चावल",
            "price": "60-120",
            "brand_name": ["India Gate", "Tata"],
            "variety": ["Long Grain", "Premium"],
            "packs": ["1kg", "5kg"],
            "availability": true,
            "inStock": true
          },
          {
            "name": "Toothpaste",
            "hindi_name": "टूथपेस्ट",
            "price": "25-80",
            "brand_name": ["Colgate", "Pepsodent"],
            "variety": ["Regular", "Whitening"],
            "packs": ["100g", "200g"],
            "availability": true,
            "inStock": true
          }
        ], null, 2);
      } else if (selectedType === 'menu') {
        template = JSON.stringify([
          {
            "name": "Butter Chicken",
            "hindi_name": "बटर चिकन",
            "price": "350",
            "availability": true
          },
          {
            "name": "Masala Dosa",
            "hindi_name": "मसाला डोसा",
            "price": "120",
            "availability": true
          }
        ], null, 2);
      } else {
        template = JSON.stringify([
          {
            "name": "Hair Cut",
            "hindi_name": "बाल कटवाना",
            "price": "200",
            "availability": true
          },
          {
            "name": "Mobile Repair",
            "hindi_name": "मोबाइल रिपेयर",
            "price": "500",
            "availability": true
          }
        ], null, 2);
      }
      fileType = 'json';
      mimeType = 'application/json';
    } else {
      // CSV template
      if (selectedType === 'product') {
        template = `name,hindi_name,category,variety,brand_name,packs,priceRange,availability,inStock\nPulses,,Grocery,"Moong,Masur,Tuvar","Organic Brand,Tata,Ashirvaad","Small,Medium,Big","50-90",true,true\nToothpaste,,Medical,,"Colgate,Pepsodent,Sensodyne","Small,Medium,Large","20-60",true,true`;
      } else if (selectedType === 'menu') {
        template = `name,hindi_name,category,price,availability\nButter Chicken,,Main Course,350,true\nMasala Dosa,,South Indian,120,true`;
      } else {
        template = `name,hindi_name,category,price,availability\nHair Cut,,Beauty,200,true\nMobile Repair,,Electronics,500,true`;
      }
      fileType = 'csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([template], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedType || 'items'}_template.${fileType}`;
    link.click();
    window.URL.revokeObjectURL(url);
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
        <div className="flex items-center space-x-3">
          <Package className="text-blue-500" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Item Manager</h2>
            <p className="text-gray-600">Comprehensive shop-connected item management</p>
          </div>
        </div>

        {/* Items View Header Buttons */}
        {selectedShop && viewMode === 'items' && (
          <div className="flex space-x-3">
            <button
              onClick={handleDownloadItems}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Download size={20} />
              <span>Download Items</span>
            </button>
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
            >
              <Upload size={20} />
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleDeleteAllItems}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
            >
              <Trash2 size={20} />
              <span>Delete All Items</span>
            </button>
          </div>
        )}

        {/* Shops View Header Buttons */}
        {viewMode === 'shops' && selectedType && (
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteAllShops}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
              title={`Delete all ${selectedType} shops and their items`}
            >
              <Trash2 size={20} />
              <span>Delete All Shops</span>
            </button>
          </div>
        )}
      </div>

      {/* Type Selector */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Item Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['product', 'menu', 'service'] as ItemType[]).map((type) => (
            <motion.button
              key={type}
              onClick={() => handleTypeSelect(type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-6 rounded-xl border-2 transition-all ${selectedType === type
                ? `border-blue-500 bg-gradient-to-r ${getTypeColor(type)} text-white shadow-lg`
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedType === type ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                  {getTypeIcon(type)}
                </div>
                <div className="text-center">
                  <h4 className="font-semibold capitalize">{type}s</h4>
                  <p className={`text-sm ${selectedType === type ? 'text-white/80' : 'text-gray-600'}`}>
                    {type === 'product' && 'Physical items & inventory'}
                    {type === 'menu' && 'Restaurant menu items'}
                    {type === 'service' && 'Services & consultations'}
                  </p>
                  <p className={`text-xs mt-1 ${selectedType === type ? 'text-white/60' : 'text-gray-500'}`}>
                    {filteredShops.filter(shop => {
                      if (type === 'product') return true;
                      if (type === 'menu') return shop.shopType === 'menu' || ['restaurant', 'cafe', 'hotel'].includes(shop.type?.toLowerCase() || '');
                      if (type === 'service') return shop.shopType === 'service' || shop.serviceDetails;
                      return false;
                    }).length} shops available
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {viewMode === 'items' && selectedShop && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setViewMode('shops');
              setSelectedShop(null);
            }}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Shops</span>
          </button>
          <span>•</span>
          <span className="font-medium text-gray-900">{selectedShop.shopName}</span>
          {selectedType && (
            <>
              <span>•</span>
              <span className="capitalize">{selectedType} Items</span>
            </>
          )}
        </div>
      )}

      {/* Shops View */}
      {viewMode === 'shops' && (
        <div className="space-y-6">
          {/* Shop Search */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Shops` : 'All Shops'}
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredShops.length} shops</span>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredShops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops found</h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? `No shops match "${searchQuery}"`
                    : `No ${selectedType || ''} shops available`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShops.map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleShopSelect(shop)}
                    className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                          {getShopTypeIcon(shop.shopType)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">{shop.shopName}</h3>
                          <p className="text-xs text-gray-500">{shop.ownerName}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.shopType === 'product' ? 'bg-green-100 text-green-800' :
                          shop.shopType === 'menu' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {shop.shopType} Shop
                        </span>
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <ArrowLeft size={12} className="text-blue-600 rotate-180" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items View */}
      {viewMode === 'items' && selectedShop && (
        <div className="space-y-6">
          {/* Shop Header */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  {getShopTypeIcon(selectedShop.shopType)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedShop.shopName}</h3>
                  <p className="text-gray-600">{selectedShop.ownerName} • {selectedShop.type}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedShop.shopType === 'product' ? 'bg-green-100 text-green-800' :
                      selectedShop.shopType === 'menu' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                      {selectedShop.shopType} Shop
                    </span>
                    {selectedShop.isVerified && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{filteredItems.length}</p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Items` : 'All Items'}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{filteredItems.length} of {items.length} items</span>
                </div>
              </div>

              {/* Items Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">
                  {itemSearchQuery
                    ? `No items match "${itemSearchQuery}"`
                    : `This shop doesn't have any ${selectedType || ''} items yet.`
                  }
                </p>
                {itemSearchQuery ? (
                  <button
                    onClick={() => setItemSearchQuery('')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-3"
                  >
                    Clear Search
                  </button>
                ) : null}
                <button
                  onClick={handleAddItem}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-6 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'product' ? 'bg-green-100' :
                          item.type === 'menu' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                          {getTypeIcon(item.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">
                            {item.name || (item.type === 'service' && item.description
                              ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '')
                              : 'Service Item')}
                          </h4>

                          {item.hindi_name && (
                            <p className="text-sm text-gray-600">{item.hindi_name}</p>
                          )}

                          <div className="flex items-center space-x-2 mt-2">
                            {item.category && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {item.category}
                              </span>
                            )}
                            {item.brand_name && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                {item.brand_name}
                              </span>
                            )}

                            {/* ProductItem Price Display */}
                            {item.type === 'product' && item.priceRange && Array.isArray(item.priceRange) ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                {item.packs && item.packs.length === 1 ? (
                                  `₹${item.priceRange[0]} (1 package size)`
                                ) : (
                                  `₹${item.priceRange[0]} - ₹${item.priceRange[1]} (${item.packs?.length || 1} sizes)`
                                )}
                              </span>
                            ) : item.price && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                ₹{item.price}
                              </span>
                            )}

                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.availability !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {item.availability !== false ? 'Available' : 'Unavailable'}
                            </span>
                          </div>

                          {/* ProductItem Varieties Display */}
                          {item.variety && Array.isArray(item.variety) && item.variety.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Varieties:</span> {item.variety.join(', ')}
                            </div>
                          )}

                          {/* Type-specific info */}
                          {item.type === 'product' && item.inStock !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">
                              Stock: {typeof item.inStock === 'boolean' ? (item.inStock ? 'In Stock' : 'Out of Stock') : item.inStock}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit item"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      <AnimatePresence>
        {showForm && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-blue-700">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Shop and Type Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Store size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{selectedShop?.shopName}</p>
                        <p className="text-sm text-blue-700 capitalize">{formData.type} Item</p>
                      </div>
                    </div>
                  </div>

                  {/* Item Name with Auto Hindi Generation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name {formData.type !== 'service' ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={formData.type === 'service' ? 'Optional - can use description instead' : 'Enter item name'}
                        required={formData.type !== 'service'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hindi Name (Auto-generated)
                      </label>
                      <input
                        type="text"
                        value={formData.hindi_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hindi_name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        placeholder="Auto-generated from English name"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically generated. Edit if needed.
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description {formData.type === 'service' ? '(Required if no name)' : ''}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={
                        formData.type === 'service'
                          ? 'Describe the service offered (e.g., Professional hair cutting and styling)'
                          : 'Optional description'
                      }
                    />
                  </div>

                  {/* Category and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter category"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter price"
                      />
                    </div>
                  </div>

                  {/* ProductItem Specific Fields */}
                  {formData.type === 'product' && (
                    <>
                      {/* Variety (Multi-value) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variety (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.variety}
                          onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                          placeholder="e.g., Moong, Masur, Tuvar (comma-separated)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter multiple varieties separated by commas (optional)
                        </p>
                      </div>

                      {/* Packs (Multi-value) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Sizes (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.packs}
                          onChange={(e) => setFormData(prev => ({ ...prev, packs: e.target.value }))}
                          placeholder="e.g., Small, Medium, Large (comma-separated)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter package sizes separated by commas (optional)
                        </p>
                      </div>

                      {/* Price Range and Stock */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price Range *
                          </label>
                          <input
                            type="text"
                            value={formData.priceRange}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceRange: e.target.value }))}
                            placeholder="e.g., 50-90"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={formData.type === 'product'}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: min-max (e.g., 50-90)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            In Stock *
                          </label>
                          <select
                            value={formData.inStock ? 'true' : 'false'}
                            onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={formData.type === 'product'}
                          >
                            <option value="true">Yes - In Stock</option>
                            <option value="false">No - Out of Stock</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Select whether item is available in stock
                          </p>
                        </div>
                      </div>

                      {/* Brand Names (Multi-value) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand Names (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.brand_name || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Tata, Amul, Patanjali (comma-separated)"
                        />
                      </div>
                    </>
                  )}

                  {/* Legacy fields for non-product types */}
                  {formData.type !== 'product' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variety
                        </label>
                        <input
                          type="text"
                          value={formData.variety}
                          onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                          placeholder="e.g., Basmati, Toor Dal, Green"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={formData.unit || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                          placeholder="plate, bowl, glass, etc."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="availability"
                      checked={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="availability" className="text-sm font-medium text-gray-700">
                      Item is available
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUpload && selectedShop && (
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex items-center space-x-3">
                  <Upload size={24} />
                  <div>
                    <h2 className="text-xl font-bold">Bulk Upload {selectedType?.charAt(0).toUpperCase() + selectedType?.slice(1)} Items</h2>
                    <p className="text-blue-100 text-sm">Upload to {selectedShop.shopName} with automatic Hindi translation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setShowPreview(false);
                    setParsedItems([]);
                    setCsvData('');
                    setJsonData('');
                    setSelectedFile(null);
                    setUploadError('');
                    setUploadMode('csv');
                    const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {!showPreview ? (
                  /* Upload Section */
                  <div className="space-y-6">
                    {/* Format Selector */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Choose Upload Format</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setUploadMode('csv');
                            setJsonData('');
                            setUploadError('');
                          }}
                          className={`p-3 rounded-lg border-2 transition-all ${uploadMode === 'csv'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <div className="text-center">
                            <FileText size={20} className="mx-auto mb-1" />
                            <div className="font-medium">CSV Format</div>
                            <div className="text-xs text-gray-600">Comma-separated values</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setUploadMode('json');
                            setCsvData('');
                            setUploadError('');
                          }}
                          className={`p-3 rounded-lg border-2 transition-all ${uploadMode === 'json'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <div className="text-center">
                            <FileText size={20} className="mx-auto mb-1" />
                            <div className="font-medium">JSON Format</div>
                            <div className="text-xs text-gray-600">JavaScript Object Notation</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Download Template */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="text-blue-600" size={20} />
                          <div>
                            <h3 className="font-medium text-blue-900">Download Template</h3>
                            <p className="text-blue-700 text-sm">
                              Use our {uploadMode.toUpperCase()} template for {selectedType} items
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={downloadTemplate}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download size={16} />
                          <span>Download {uploadMode.toUpperCase()}</span>
                        </button>
                      </div>
                    </div>

                    {/* File Upload Option */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Upload CSV Data</h3>
                        {selectedFile && (
                          <button
                            onClick={clearFile}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                          >
                            <X size={16} />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>

                      {/* File Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          id="bulk-file-input"
                          type="file"
                          accept={uploadMode === 'json' ? '.json' : '.csv'}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="bulk-file-input"
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <Upload size={32} className="text-gray-400" />
                          <div>
                            <span className="text-blue-600 font-medium">
                              Click to upload {uploadMode.toUpperCase()} file
                            </span>
                            <p className="text-gray-500 text-sm">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {uploadMode.toUpperCase()} files up to 5MB
                          </p>
                        </label>
                      </div>

                      {/* Selected File Display */}
                      {selectedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                          <CheckCircle size={20} className="text-green-600" />
                          <div className="flex-1">
                            <p className="text-green-800 font-medium">{selectedFile.name}</p>
                            <p className="text-green-600 text-sm">
                              {(selectedFile.size / 1024).toFixed(1)} KB • Ready to parse
                            </p>
                          </div>
                        </div>
                      )}

                      {/* OR Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                      </div>

                      {/* Manual Data Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste {uploadMode.toUpperCase()} Data Manually
                        </label>
                        {uploadMode === 'json' ? (
                          <textarea
                            value={jsonData}
                            onChange={(e) => {
                              setJsonData(e.target.value);
                              if (selectedFile) {
                                setSelectedFile(null);
                                const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }
                            }}
                            placeholder={`Paste your JSON data here...\nExample:\n[\n  {\n    "name": "Rice",\n    "hindi_name": "चावल",\n    "price": "60-120",\n    "brand_name": ["Basmati", "India Gate"],\n    "availability": true\n  }\n]`}
                            rows={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                        ) : (
                          <textarea
                            value={csvData}
                            onChange={(e) => {
                              setCsvData(e.target.value);
                              if (selectedFile) {
                                setSelectedFile(null);
                                const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }
                            }}
                            placeholder="Paste your CSV data here..."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                        )}
                      </div>
                    </div>

                    {/* Error Display */}
                    {uploadError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2"
                      >
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                        <span className="text-red-700">{uploadError}</span>
                      </motion.div>
                    )}

                    {/* Parse Button */}
                    <button
                      onClick={handleParseData}
                      disabled={uploadMode === 'json' ? !jsonData.trim() : !csvData.trim()}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <FileText size={18} />
                      <span>Parse {uploadMode.toUpperCase()} & Preview</span>
                    </button>
                  </div>
                ) : (
                  /* Preview Section */
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <CheckCircle className="text-green-600 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-green-900">{parsedItems.filter(item => item.errors.length === 0).length}</div>
                        <div className="text-green-700 text-sm">Valid Items</div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <Languages className="text-blue-600 mx-auto mb-2" size={24} />
                        <div className="text-2xl font-bold text-blue-900">{parsedItems.filter(item => !item.hasHindiName && item.hindi_name).length}</div>
                        <div className="text-blue-700 text-sm">Auto-translated</div>
                      </div>

                      {parsedItems.filter(item => item.errors.length > 0).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                          <AlertTriangle className="text-red-600 mx-auto mb-2" size={24} />
                          <div className="text-2xl font-bold text-red-900">{parsedItems.filter(item => item.errors.length > 0).length}</div>
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
                            className={`p-4 rounded-lg border ${item.errors.length > 0
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
                                      {item.category}
                                    </span>
                                  )}
                                  {item.brand_name && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      {item.brand_name}
                                    </span>
                                  )}
                                  {item.priceRange && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                      ₹{item.priceRange}
                                    </span>
                                  )}
                                  {item.packs && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Packs: {item.packs}
                                    </span>
                                  )}
                                  {item.inStock !== undefined && (
                                    <span className={`px-2 py-1 rounded ${item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {typeof item.inStock === 'boolean' ? (item.inStock ? 'In Stock' : 'Out of Stock') : `Stock: ${item.inStock}`}
                                    </span>
                                  )}
                                </div>

                                {item.variety && (
                                  <p className="text-gray-600 text-sm mt-2">
                                    Varieties: {item.variety}
                                  </p>
                                )}
                              </div>

                              <div className="ml-4">
                                {item.errors.length > 0 ? (
                                  <div className="text-red-600">
                                    <AlertTriangle size={16} />
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
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
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
                          setJsonData('');
                          setSelectedFile(null);
                          setUploadError('');
                          const fileInput = document.getElementById('bulk-file-input') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      >
                        Back to Upload
                      </button>

                      <button
                        onClick={handleConfirmUpload}
                        disabled={parsedItems.filter(item => item.errors.length === 0).length === 0}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <Upload size={18} />
                        <span>Upload {parsedItems.filter(item => item.errors.length === 0).length} Items</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Format Guide */}
                {!showPreview && (
                  <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {uploadMode.toUpperCase()} Format Guide for {selectedType?.charAt(0).toUpperCase() + selectedType?.slice(1)} Items
                    </h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      {uploadMode === 'json' ? (
                        <>
                          <p><strong>Required fields:</strong> name</p>
                          {selectedType === 'product' && (
                            <p><strong>ProductItem fields:</strong> variety, brand_name, packs, priceRange, inStock (arrays for multi-values)</p>
                          )}
                          <p><strong>Optional fields:</strong> hindi_name, description, price, availability, inStock, brand_name, variety, packs, priceRange, unit</p>
                          <p><strong>Ignored fields:</strong> shopType, category, id (these will be ignored during import)</p>
                          <p><strong>Notes:</strong></p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-4">
                            <li>JSON should be an array of objects or a single object</li>
                            <li>If hindi_name is empty, it will be auto-generated from the English name</li>
                            <li>Items will be added to {selectedShop.shopName}</li>
                            <li>availability defaults to true if not specified</li>
                            <li>Arrays are supported for brand_name, variety, packs, highlights, and tags</li>
                            {selectedType === 'product' && (
                              <>
                                <li>variety: ["Small", "Medium", "Large"] for multiple varieties</li>
                                <li>brand_name: ["Tata", "Amul", "Patanjali"] for multiple brands</li>
                                <li>packs: ["1kg", "5kg", "10kg"] for multiple pack sizes</li>
                                <li>priceRange: "50-90" for min-max pricing</li>
                                <li>inStock: true or false for stock availability</li>
                              </>
                            )}
                          </ul>
                        </>
                      ) : (
                        <>
                          <p><strong>Required columns:</strong> name</p>
                          {selectedType === 'product' && (
                            <p><strong>ProductItem columns:</strong> variety, brand_name, packs, priceRange, inStock (comma-separated for multi-values except inStock)</p>
                          )}
                          <p><strong>Optional columns:</strong> hindi_name, category, brand_name, price, availability</p>
                          <p><strong>Notes:</strong></p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-4">
                            <li>If hindi_name is empty, it will be auto-generated from the English name</li>
                            <li>Items will be added to {selectedShop.shopName}</li>
                            <li>availability should be 'true' or 'false' (defaults to true)</li>
                            <li>Use commas to separate columns, quote text containing commas</li>
                            {selectedType === 'product' && (
                              <>
                                <li>variety: "Moong,Masur,Tuvar" for multiple varieties</li>
                                <li>brand_name: "Tata,Amul,Patanjali" for multiple brands</li>
                                <li>packs: "Small,Medium,Large" for multiple pack sizes</li>
                                <li>priceRange: "50-90" for min-max pricing</li>
                                <li>inStock: "true" or "false" (Yes/No for stock availability)</li>
                              </>
                            )}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownloadModal && selectedShop && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <div className="flex items-center space-x-3">
                  <Download size={24} />
                  <div>
                    <h2 className="text-xl font-bold">Download Items</h2>
                    <p className="text-purple-100 text-sm">Export {items.length} items from {selectedShop.shopName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Format Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Choose Download Format</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDownloadFormat('csv')}
                        className={`p-4 rounded-lg border-2 transition-all ${downloadFormat === 'csv'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className="text-center">
                          <FileText size={24} className="mx-auto mb-2" />
                          <div className="font-medium">CSV Format</div>
                          <div className="text-xs text-gray-600">Excel compatible</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setDownloadFormat('json')}
                        className={`p-4 rounded-lg border-2 transition-all ${downloadFormat === 'json'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className="text-center">
                          <FileText size={24} className="mx-auto mb-2" />
                          <div className="font-medium">JSON Format</div>
                          <div className="text-xs text-gray-600">Developer friendly</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Download Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="text-blue-600" size={16} />
                      <span className="font-medium text-blue-900">Download Details</span>
                    </div>
                    <div className="text-blue-700 text-sm space-y-1">
                      <p>• {items.length} {selectedType || 'items'} from {selectedShop.shopName}</p>
                      <p>• Includes all item details and metadata</p>
                      <p>• File will be saved as: {selectedShop.shopName}_{selectedType || 'items'}_{new Date().toISOString().split('T')[0]}.{downloadFormat}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowDownloadModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDownload}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                    >
                      <Download size={16} />
                      <span>Download {downloadFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ItemManager;