/**
 * Reference ID Router Component
 * Handles routing for Reference ID-based URLs
 */

import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { searchByReferenceId, SearchResult } from '../services/searchService';
import { isValidReferenceId, getEntityTypeFromReferenceId } from '../utils/referenceId';
import { Loader2 } from 'lucide-react';

// Import your entity detail components
// import ShopDetail from './ShopDetail';
// import ProductDetail from './ProductDetail';
// import ServiceDetail from './ServiceDetail';
// import OfficeDetail from './OfficeDetail';
// import MenuDetail from './MenuDetail';

const ReferenceIdRouter: React.FC = () => {
  const { referenceId } = useParams<{ referenceId: string }>();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntity = async () => {
      if (!referenceId) {
        setError('No Reference ID provided');
        setLoading(false);
        return;
      }

      if (!isValidReferenceId(referenceId)) {
        setError('Invalid Reference ID format');
        setLoading(false);
        return;
      }

      try {
        const entityResult = await searchByReferenceId(referenceId);
        if (entityResult) {
          setResult(entityResult);
        } else {
          setError('Entity not found');
        }
      } catch (err) {
        console.error('Error fetching entity:', err);
        setError('Failed to load entity');
      } finally {
        setLoading(false);
      }
    };

    fetchEntity();
  }, [referenceId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading {referenceId}...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Entity Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || `No entity found with Reference ID: ${referenceId}`}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Route to appropriate detail component based on entity type
  switch (result.type) {
    case 'shop':
      // return <ShopDetail shop={result} />;
      return <EntityDetailPlaceholder entity={result} />;
    case 'product':
      // return <ProductDetail product={result} />;
      return <EntityDetailPlaceholder entity={result} />;
    case 'service':
      // return <ServiceDetail service={result} />;
      return <EntityDetailPlaceholder entity={result} />;
    case 'office':
      // return <OfficeDetail office={result} />;
      return <EntityDetailPlaceholder entity={result} />;
    case 'menu':
      // return <MenuDetail menuItem={result} />;
      return <EntityDetailPlaceholder entity={result} />;
    default:
      return <Navigate to="/404" replace />;
  }
};

// Placeholder component until actual detail components are implemented
const EntityDetailPlaceholder: React.FC<{ entity: SearchResult }> = ({ entity }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {entity.type === 'shop' && '🏪'}
              {entity.type === 'product' && '📦'}
              {entity.type === 'service' && '🔧'}
              {entity.type === 'office' && '🏛️'}
              {entity.type === 'menu' && '🍽️'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{entity.name}</h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-mono">
                {entity.referenceId}
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm capitalize">
                {entity.type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
              <dl className="space-y-2">
                {entity.category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{entity.category}</dd>
                  </div>
                )}
                {entity.brand && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Brand</dt>
                    <dd className="text-sm text-gray-900">{entity.brand}</dd>
                  </div>
                )}
                {entity.district && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">District</dt>
                    <dd className="text-sm text-gray-900">{entity.district}</dd>
                  </div>
                )}
                {entity.price && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="text-sm text-gray-900">₹{entity.price}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Info</h3>
              {entity.tags && entity.tags.length > 0 && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {entity.isFeatured && (
                <div className="flex items-center text-yellow-600 mb-2">
                  <span className="text-sm font-medium">⭐ Featured Item</span>
                </div>
              )}

              {entity.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Description</dt>
                  <dd className="text-sm text-gray-900">{entity.description}</dd>
                </div>
              )}
            </div>
          </div>

          {entity.imageUrl && (
            <div className="mt-8">
              <img
                src={entity.imageUrl}
                alt={entity.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🚧 Under Development</h4>
            <p className="text-sm text-yellow-700">
              This is a placeholder page. The full {entity.type} detail page is being developed.
              The Reference ID system is working correctly and this entity was found using ID: <code className="font-mono bg-yellow-100 px-1 rounded">{entity.referenceId}</code>
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferenceIdRouter;