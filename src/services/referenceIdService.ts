/**
 * Reference ID Management Service
 * Handles auto-generation and management of Reference IDs in Firestore
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  generateReferenceId, 
  EntityPrefix, 
  ENTITY_PREFIXES,
  getNextReferenceId 
} from '../utils/referenceId';

interface ReferenceIdCounter {
  prefix: EntityPrefix;
  district: string;
  count: number;
  lastUpdated: Date;
}

/**
 * Get or create a reference ID counter for a district and entity type
 */
const getOrCreateCounter = async (
  prefix: EntityPrefix, 
  district: string
): Promise<number> => {
  const districtCode = district.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '').padEnd(3, 'X');
  const counterId = `${prefix}_${districtCode}`;
  
  try {
    return await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, 'referenceIdCounters', counterId);
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        // Create new counter
        const initialData: ReferenceIdCounter = {
          prefix,
          district: districtCode,
          count: 0,
          lastUpdated: new Date()
        };
        transaction.set(counterRef, initialData);
        return 0;
      } else {
        // Increment existing counter
        const currentCount = counterDoc.data().count || 0;
        transaction.update(counterRef, {
          count: increment(1),
          lastUpdated: new Date()
        });
        return currentCount;
      }
    });
  } catch (error) {
    console.error('Error managing reference ID counter:', error);
    throw error;
  }
};

/**
 * Generate and reserve a new reference ID
 */
export const generateNewReferenceId = async (
  entityType: keyof typeof ENTITY_PREFIXES,
  district: string
): Promise<string> => {
  const prefix = ENTITY_PREFIXES[entityType];
  const count = await getOrCreateCounter(prefix, district);
  return generateReferenceId(prefix, district, count);
};

/**
 * Check if a reference ID already exists
 */
export const checkReferenceIdExists = async (referenceId: string): Promise<boolean> => {
  const collections = ['shops', 'products', 'menuItems', 'services', 'offices'];
  
  try {
    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where('referenceId', '==', referenceId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking reference ID existence:', error);
    return false;
  }
};

/**
 * Add reference ID to existing entity (migration helper)
 */
export const addReferenceIdToEntity = async (
  collectionName: string,
  entityId: string,
  entityType: keyof typeof ENTITY_PREFIXES,
  district: string
): Promise<string> => {
  try {
    const referenceId = await generateNewReferenceId(entityType, district);
    
    // Check if it already exists (safety check)
    const exists = await checkReferenceIdExists(referenceId);
    if (exists) {
      throw new Error(`Reference ID ${referenceId} already exists`);
    }
    
    // Update the entity with the new reference ID
    const entityRef = doc(db, collectionName, entityId);
    await updateDoc(entityRef, {
      referenceId,
      updatedAt: new Date()
    });
    
    return referenceId;
  } catch (error) {
    console.error('Error adding reference ID to entity:', error);
    throw error;
  }
};

/**
 * Migrate all entities in a collection to have reference IDs
 */
export const migrateCollectionReferenceIds = async (
  collectionName: string,
  entityType: keyof typeof ENTITY_PREFIXES,
  defaultDistrict: string = 'Mandsaur'
): Promise<{ success: number; errors: number }> => {
  let success = 0;
  let errors = 0;
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        
        // Skip if already has reference ID
        if (data.referenceId) {
          continue;
        }
        
        // Use entity's district or default
        const district = data.district || defaultDistrict;
        
        const referenceId = await generateNewReferenceId(entityType, district);
        
        await updateDoc(doc(db, collectionName, docSnapshot.id), {
          referenceId,
          updatedAt: new Date()
        });
        
        success++;
        console.log(`Added reference ID ${referenceId} to ${docSnapshot.id}`);
      } catch (error) {
        console.error(`Error migrating ${docSnapshot.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error(`Error migrating collection ${collectionName}:`, error);
    errors++;
  }
  
  return { success, errors };
};

/**
 * Get reference ID statistics
 */
export const getReferenceIdStats = async (): Promise<{
  totalCounters: number;
  countersByPrefix: Record<EntityPrefix, number>;
  countersByDistrict: Record<string, number>;
}> => {
  try {
    const snapshot = await getDocs(collection(db, 'referenceIdCounters'));
    
    const stats = {
      totalCounters: snapshot.size,
      countersByPrefix: {} as Record<EntityPrefix, number>,
      countersByDistrict: {} as Record<string, number>
    };
    
    // Initialize counters
    Object.values(ENTITY_PREFIXES).forEach(prefix => {
      stats.countersByPrefix[prefix] = 0;
    });
    
    snapshot.forEach(doc => {
      const data = doc.data() as ReferenceIdCounter;
      stats.countersByPrefix[data.prefix] = (stats.countersByPrefix[data.prefix] || 0) + data.count;
      stats.countersByDistrict[data.district] = (stats.countersByDistrict[data.district] || 0) + data.count;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting reference ID stats:', error);
    return {
      totalCounters: 0,
      countersByPrefix: {} as Record<EntityPrefix, number>,
      countersByDistrict: {} as Record<string, number>
    };
  }
};

/**
 * Validate and fix reference ID counters
 */
export const validateReferenceIdCounters = async (): Promise<{
  validated: number;
  fixed: number;
  errors: string[];
}> => {
  const result = {
    validated: 0,
    fixed: 0,
    errors: [] as string[]
  };
  
  try {
    const collections = [
      { name: 'shops', prefix: ENTITY_PREFIXES.SHOP },
      { name: 'products', prefix: ENTITY_PREFIXES.PRODUCT },
      { name: 'menuItems', prefix: ENTITY_PREFIXES.MENU },
      { name: 'services', prefix: ENTITY_PREFIXES.SERVICE },
      { name: 'offices', prefix: ENTITY_PREFIXES.OFFICE }
    ];
    
    for (const { name, prefix } of collections) {
      try {
        const snapshot = await getDocs(collection(db, name));
        const districtCounts: Record<string, number> = {};
        
        // Count actual entities by district
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.referenceId && data.referenceId.startsWith(prefix)) {
            const district = data.district || 'MAN'; // Default to Mandsaur
            const districtCode = district.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '').padEnd(3, 'X');
            districtCounts[districtCode] = (districtCounts[districtCode] || 0) + 1;
          }
        });
        
        // Check and fix counters
        for (const [districtCode, actualCount] of Object.entries(districtCounts)) {
          const counterId = `${prefix}_${districtCode}`;
          const counterRef = doc(db, 'referenceIdCounters', counterId);
          const counterDoc = await getDoc(counterRef);
          
          if (!counterDoc.exists()) {
            // Create missing counter
            await setDoc(counterRef, {
              prefix,
              district: districtCode,
              count: actualCount,
              lastUpdated: new Date()
            });
            result.fixed++;
          } else {
            const counterData = counterDoc.data() as ReferenceIdCounter;
            if (counterData.count !== actualCount) {
              // Fix incorrect counter
              await updateDoc(counterRef, {
                count: actualCount,
                lastUpdated: new Date()
              });
              result.fixed++;
            }
          }
          result.validated++;
        }
      } catch (error) {
        result.errors.push(`Error validating ${name}: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`General validation error: ${error}`);
  }
  
  return result;
};