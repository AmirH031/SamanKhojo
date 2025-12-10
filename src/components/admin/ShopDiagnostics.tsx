import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { getShops } from '../../services/firestoreService';
import { getActiveCategories } from '../../services/categoryService';
import { validateShopCategories, getShopCategories } from '../../services/shopCategoryService';

interface DiagnosticResult {
  totalShops: number;
  visibleShops: number;
  hiddenShops: number;
  shopsWithoutCategory: number;
  shopsWithInvalidCategory: number;
  uniqueCategories: string[];
  missingCategories: string[];
}

const ShopDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const [allShops, activeCategories, shopCategories] = await Promise.all([
        getShops(true), // Include hidden shops
        getActiveCategories(),
        getShopCategories()
      ]);

      const visibleShops = allShops.filter(shop => !shop.isHidden);
      const hiddenShops = allShops.filter(shop => shop.isHidden);
      const shopsWithoutCategory = allShops.filter(shop => !shop.type || !shop.type.trim());
      
      const activeCategoryNames = activeCategories.map(cat => cat.name.toLowerCase());
      const shopsWithInvalidCategory = allShops.filter(shop => 
        shop.type && 
        shop.type.trim() && 
        !activeCategoryNames.includes(shop.type.toLowerCase())
      );

      const missingCategories = shopCategories.filter(shopCat => 
        !activeCategoryNames.includes(shopCat.toLowerCase())
      );

      const result: DiagnosticResult = {
        totalShops: allShops.length,
        visibleShops: visibleShops.length,
        hiddenShops: hiddenShops.length,
        shopsWithoutCategory: shopsWithoutCategory.length,
        shopsWithInvalidCategory: shopsWithInvalidCategory.length,
        uniqueCategories: shopCategories,
        missingCategories
      };

      setDiagnostics(result);
      toast.success('Diagnostics completed successfully!');
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast.error('Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const fixShopCategories = async () => {
    if (!confirm('This will validate and fix all shop categories. Continue?')) return;

    setLoading(true);
    try {
      await validateShopCategories();
      toast.success('Shop categories fixed successfully!');
      // Re-run diagnostics to show updated results
      await runDiagnostics();
    } catch (error) {
      console.error('Error fixing shop categories:', error);
      toast.error('Failed to fix shop categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop Diagnostics</h2>
          <p className="text-gray-600">Diagnose and fix shop visibility issues</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Search size={20} />
            <span>Run Diagnostics</span>
          </button>
          {diagnostics && diagnostics.shopsWithInvalidCategory > 0 && (
            <button
              onClick={fixShopCategories}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} />
              <span>Fix Categories</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running diagnostics...</p>
        </motion.div>
      )}

      {/* Diagnostics Results */}
      {diagnostics && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shops</p>
                  <p className="text-3xl font-bold text-gray-900">{diagnostics.totalShops}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Search className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visible Shops</p>
                  <p className="text-3xl font-bold text-green-600">{diagnostics.visibleShops}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hidden Shops</p>
                  <p className="text-3xl font-bold text-gray-500">{diagnostics.hiddenShops}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-xl">
                  <AlertTriangle className="text-gray-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invalid Categories</p>
                  <p className={`text-3xl font-bold ${diagnostics.shopsWithInvalidCategory > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.shopsWithInvalidCategory}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${diagnostics.shopsWithInvalidCategory > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                  <AlertTriangle className={diagnostics.shopsWithInvalidCategory > 0 ? 'text-red-600' : 'text-green-600'} size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Issues Section */}
          {(diagnostics.shopsWithoutCategory > 0 || diagnostics.shopsWithInvalidCategory > 0 || diagnostics.missingCategories.length > 0) && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Issues Found</h3>
              
              <div className="space-y-4">
                {diagnostics.shopsWithoutCategory > 0 && (
                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <AlertTriangle className="text-yellow-600" size={20} />
                    <div>
                      <p className="font-medium text-yellow-800">
                        {diagnostics.shopsWithoutCategory} shops without category
                      </p>
                      <p className="text-sm text-yellow-700">
                        These shops don't have a category assigned and may not appear in category filters.
                      </p>
                    </div>
                  </div>
                )}

                {diagnostics.shopsWithInvalidCategory > 0 && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-xl border border-red-200">
                    <AlertTriangle className="text-red-600" size={20} />
                    <div>
                      <p className="font-medium text-red-800">
                        {diagnostics.shopsWithInvalidCategory} shops with invalid categories
                      </p>
                      <p className="text-sm text-red-700">
                        These shops have categories that don't exist in the categories collection.
                      </p>
                    </div>
                  </div>
                )}

                {diagnostics.missingCategories.length > 0 && (
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <AlertTriangle className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-blue-800">
                        {diagnostics.missingCategories.length} categories used by shops but not in categories collection
                      </p>
                      <p className="text-sm text-blue-700 mb-2">
                        These categories should be added to the categories collection:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {diagnostics.missingCategories.map((category, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Good */}
          {diagnostics.shopsWithoutCategory === 0 && 
           diagnostics.shopsWithInvalidCategory === 0 && 
           diagnostics.missingCategories.length === 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="font-medium text-green-800">All shops are properly configured!</p>
                  <p className="text-sm text-green-700">
                    No issues found with shop categories or visibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Categories Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Categories Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-gray-700 mb-2">Categories used by shops:</p>
                <div className="flex flex-wrap gap-2">
                  {diagnostics.uniqueCategories.map((category, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {!diagnostics && !loading && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Shop Diagnostics</h3>
          <p className="text-gray-600 mb-6">
            Run diagnostics to check for shop visibility issues and category problems.
          </p>
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Run Diagnostics
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopDiagnostics;