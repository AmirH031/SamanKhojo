/**
 * Enhanced Search Results Page
 * Shows unified search results across all entity types
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Package, 
  Store, 
  Wrench, 
  Building, 
  Utensils,
  ArrowRight,
  Grid,
  List
} from 'lucide-react';
import { 
  performUniversalSearch,
  getRelatedItems,
  SearchResult 
} from '../services/searchService';
import { getReferenceIdPath } from '../utils/referenceId';
import UnifiedSearchBar from '../components/search/UnifiedSearchBar';
import { toast } from 'react-toastify';

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [relatedItems, setRelatedItems] = useState<Record<string, SearchResult[]>>({});
  
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults = await performUniversalSearch(searchQuery);
      setResults(searchResults);
      
      // Load related items for top results
      const topResults = searchResults.slice(0, 3);
      const relatedPromises = topResults.map(async (result) => {
        const related = await getRelatedItems(result, 5);
        return { [result.id]: related };
      });
      
      const relatedResults = await Promise.all(relatedPromises);
      const relatedMap = relatedResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setRelatedItems(relatedMap);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  const filteredResults = results.filter(result => {
    if (selectedType !== 'all' && result.type !== selectedType) return false;
    if (selectedDistrict !== 'all' && result.district !== selectedDistrict) return false;
    return true;
  });

  const resultsByType = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const getEntityIcon = (type: string, size: number = 20) => {
    const iconProps = { size, className: "text-current" };
    switch (type) {
      case 'shop': return <Store {...iconProps} />;
      case 'product': return <Package {...iconProps} />;
      case 'menu': return <Utensils {...iconProps} />;
      case 'service': return <Wrench {...iconProps} />;
      case 'office': return <Building {...iconProps} />;
      default: return <Search {...iconProps} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shop': return 'text-blue-600 bg-blue-50';
      case 'product': return 'text-green-600 bg-green-50';
      case 'menu': return 'text-orange-600 bg-orange-50';
      case 'service': return 'text-purple-600 bg-purple-50';
      case 'office': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'shop': return 'Shops';
      case 'product': return 'Products';
      case 'menu': return 'Menu Items';
      case 'service': return 'Services';
      case 'office': return 'Offices';
      default: return 'Results';
    }
  };

  const uniqueDistricts = Array.from(new Set(results.map(r => r.district).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-2xl">
              <UnifiedSearchBar
                placeholder="Search products, shops, services... or enter Reference ID"
                onResultSelect={(result) => navigate(getReferenceIdPath(result.referenceId))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Filter size={16} className="mr-2" />
                Filters
              </h3>
              
              {/* Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="shop">Shops</option>
                  <option value="product">Products</option>
                  <option value="menu">Menu Items</option>
                  <option value="service">Services</option>
                  <option value="office">Offices</option>
                </select>
              </div>

              {/* District Filter */}
              {uniqueDistricts.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Districts</option>
                    {uniqueDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Results Summary</h3>
              <div className="space-y-2">
                {Object.entries(resultsByType).map(([type, typeResults]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${getTypeColor(type)}`}>
                        {getEntityIcon(type, 14)}
                      </div>
                      <span className="text-sm text-gray-600">{getTypeName(type)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{typeResults.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results for "{query}"
              </h1>
              <p className="text-gray-600">
                Found {filteredResults.length} results across all categories
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results by Type */}
                {Object.entries(resultsByType).map(([type, typeResults]) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <div className={`px-6 py-4 border-b ${getTypeColor(type)}`}>
                      <div className="flex items-center space-x-3">
                        {getEntityIcon(type)}
                        <h2 className="text-lg font-semibold">{getTypeName(type)}</h2>
                        <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-sm font-medium">
                          {typeResults.length}
                        </span>
                      </div>
                    </div>

                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6' : 'divide-y'}>
                      {typeResults.map((result) => (
                        <motion.div
                          key={result.id}
                          whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
                          className={viewMode === 'grid' 
                            ? 'bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all'
                            : 'p-6 cursor-pointer hover:bg-gray-50 transition-colors'
                          }
                          onClick={() => navigate(getReferenceIdPath(result.referenceId))}
                        >
                          <div className="flex items-start space-x-4">
                            {result.imageUrl && (
                              <img
                                src={result.imageUrl}
                                alt={result.name}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate">{result.name}</h3>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                                  {result.referenceId}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                {result.category && (
                                  <span>{result.category}</span>
                                )}
                                {result.district && (
                                  <span className="flex items-center">
                                    <MapPin size={12} className="mr-1" />
                                    {result.district}
                                  </span>
                                )}
                                {result.isFeatured && (
                                  <span className="flex items-center text-yellow-600">
                                    <Star size={12} className="mr-1" />
                                    Featured
                                  </span>
                                )}
                              </div>

                              {result.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {result.description}
                                </p>
                              )}

                              {/* Related Items */}
                              {relatedItems[result.id] && relatedItems[result.id].length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-2">Related items:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {relatedItems[result.id].slice(0, 3).map((related) => (
                                      <span
                                        key={related.id}
                                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                                      >
                                        {related.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <ArrowRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;