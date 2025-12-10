/**
 * Reference ID Migration Component
 * Admin utility to add Reference IDs to existing entities
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  migrateCollectionReferenceIds,
  getReferenceIdStats,
  validateReferenceIdCounters
} from '../../services/referenceIdService';
import { ENTITY_PREFIXES } from '../../utils/referenceId';

interface MigrationResult {
  collection: string;
  success: number;
  errors: number;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const ReferenceIdMigration: React.FC = () => {
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([
    { collection: 'shops', success: 0, errors: 0, status: 'pending' },
    { collection: 'products', success: 0, errors: 0, status: 'pending' },
    { collection: 'menuItems', success: 0, errors: 0, status: 'pending' },
    { collection: 'services', success: 0, errors: 0, status: 'pending' },
    { collection: 'offices', success: 0, errors: 0, status: 'pending' }
  ]);
  
  const [stats, setStats] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const collectionConfig = {
    shops: { entityType: 'SHOP' as keyof typeof ENTITY_PREFIXES, name: 'Shops' },
    products: { entityType: 'PRODUCT' as keyof typeof ENTITY_PREFIXES, name: 'Products' },
    menuItems: { entityType: 'MENU' as keyof typeof ENTITY_PREFIXES, name: 'Menu Items' },
    services: { entityType: 'SERVICE' as keyof typeof ENTITY_PREFIXES, name: 'Services' },
    offices: { entityType: 'OFFICE' as keyof typeof ENTITY_PREFIXES, name: 'Offices' }
  };

  const loadStats = async () => {
    try {
      const statsData = await getReferenceIdStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load Reference ID statistics');
    }
  };

  const runMigration = async (collectionName: string) => {
    const config = collectionConfig[collectionName as keyof typeof collectionConfig];
    if (!config) return;

    // Update status to running
    setMigrationResults(prev => 
      prev.map(result => 
        result.collection === collectionName 
          ? { ...result, status: 'running' as const }
          : result
      )
    );

    try {
      const result = await migrateCollectionReferenceIds(
        collectionName,
        config.entityType
      );

      // Update with results
      setMigrationResults(prev => 
        prev.map(migResult => 
          migResult.collection === collectionName 
            ? { 
                ...migResult, 
                success: result.success,
                errors: result.errors,
                status: result.errors > 0 ? 'error' as const : 'completed' as const
              }
            : migResult
        )
      );

      if (result.errors === 0) {
        toast.success(`Successfully migrated ${result.success} ${config.name.toLowerCase()}`);
      } else {
        toast.warning(`Migrated ${result.success} ${config.name.toLowerCase()} with ${result.errors} errors`);
      }

      // Refresh stats
      await loadStats();
    } catch (error) {
      console.error(`Migration error for ${collectionName}:`, error);
      
      setMigrationResults(prev => 
        prev.map(result => 
          result.collection === collectionName 
            ? { ...result, status: 'error' as const }
            : result
        )
      );
      
      toast.error(`Failed to migrate ${config.name.toLowerCase()}`);
    }
  };

  const runAllMigrations = async () => {
    setIsRunning(true);
    
    for (const result of migrationResults) {
      if (result.status === 'pending' || result.status === 'error') {
        await runMigration(result.collection);
      }
    }
    
    setIsRunning(false);
    toast.success('Migration process completed!');
  };

  const validateCounters = async () => {
    try {
      const result = await validateReferenceIdCounters();
      setValidationResult(result);
      
      if (result.errors.length === 0) {
        toast.success(`Validated ${result.validated} counters, fixed ${result.fixed} issues`);
      } else {
        toast.warning(`Validation completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate Reference ID counters');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="animate-spin text-blue-500" size={16} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Database className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-50 text-blue-700';
      case 'completed': return 'bg-green-50 text-green-700';
      case 'error': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reference ID Migration</h2>
        <p className="text-gray-600 mt-1">
          Add Reference IDs to existing entities and manage the unified ID system
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 size={20} className="mr-2" />
              Current Statistics
            </h3>
            <button
              onClick={loadStats}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalCounters}</div>
              <div className="text-sm text-blue-600">Total Counters</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(stats.countersByPrefix).reduce((a: number, b: number) => a + b, 0)}
              </div>
              <div className="text-sm text-green-600">Total Entities</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(stats.countersByDistrict).length}
              </div>
              <div className="text-sm text-purple-600">Districts</div>
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">By Entity Type:</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(stats.countersByPrefix).map(([prefix, count]) => (
                <div key={prefix} className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600">{prefix}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Migration Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Migration Status</h3>
          <div className="space-x-2">
            <button
              onClick={validateCounters}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Validate Counters
            </button>
            <button
              onClick={runAllMigrations}
              disabled={isRunning}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run All Migrations</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {migrationResults.map((result) => {
            const config = collectionConfig[result.collection as keyof typeof collectionConfig];
            return (
              <motion.div
                key={result.collection}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{config.name}</h4>
                    <p className="text-sm text-gray-600">Collection: {result.collection}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {result.status !== 'pending' && (
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">{result.success} success</span>
                      {result.errors > 0 && (
                        <span className="text-red-600 font-medium ml-2">{result.errors} errors</span>
                      )}
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>

                  <button
                    onClick={() => runMigration(result.collection)}
                    disabled={result.status === 'running' || isRunning}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {result.status === 'running' ? 'Running...' : 'Migrate'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{validationResult.validated}</div>
              <div className="text-sm text-blue-600">Validated</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{validationResult.fixed}</div>
              <div className="text-sm text-green-600">Fixed</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{validationResult.errors.length}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
              <div className="space-y-1">
                {validationResult.errors.map((error: string, index: number) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Migration will add Reference IDs to entities that don't have them</li>
          <li>• Existing Reference IDs will not be modified</li>
          <li>• The process is safe and can be run multiple times</li>
          <li>• Validation checks and fixes counter inconsistencies</li>
          <li>• Reference IDs follow the format: PREFIX-DISTRICT-NUMBER (e.g., SHP-MAN-001)</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferenceIdMigration;