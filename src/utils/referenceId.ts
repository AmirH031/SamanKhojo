/**
 * Unified Reference ID System
 * Generates consistent auto-generated Reference IDs across all entities
 */

export type EntityPrefix = 'SHP' | 'PRD' | 'MNU' | 'SRV' | 'OFF';

export interface ReferenceIdConfig {
  prefix: EntityPrefix;
  district: string;
  count: number;
}

/**
 * Generate a reference ID for any entity type
 * Format: <Prefix>-<DistrictCode>-<AutoIncrement>
 * 
 * @param prefix Entity type prefix (SHP, PRD, MNU, SRV, OFF)
 * @param district District name (e.g., "Mandsaur", "Bhanpura")
 * @param count Current count of entities in this district
 * @returns Formatted reference ID (e.g., "PRD-MAN-024")
 */
export function generateReferenceId(prefix: EntityPrefix, district: string, count: number): string {
  // Extract first 3 letters from district, uppercase, remove non-alphabetic chars
  const code = district.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '');
  
  // Ensure we have at least 3 characters, pad with 'X' if needed
  const districtCode = code.padEnd(3, 'X');
  
  // Auto-increment with zero padding
  const next = String(count + 1).padStart(3, '0');
  
  return `${prefix}-${districtCode}-${next}`;
}

/**
 * Parse a reference ID to extract its components
 * @param referenceId The reference ID to parse
 * @returns Parsed components or null if invalid
 */
export function parseReferenceId(referenceId: string): {
  prefix: EntityPrefix;
  district: string;
  number: number;
} | null {
  const match = referenceId.match(/^(SHP|PRD|MNU|SRV|OFF)-([A-Z]{3})-(\d{3})$/);
  
  if (!match) return null;
  
  return {
    prefix: match[1] as EntityPrefix,
    district: match[2],
    number: parseInt(match[3], 10)
  };
}

/**
 * Validate a reference ID format
 * @param referenceId The reference ID to validate
 * @returns True if valid format
 */
export function isValidReferenceId(referenceId: string): boolean {
  return parseReferenceId(referenceId) !== null;
}

/**
 * Get entity type from reference ID
 * @param referenceId The reference ID
 * @returns Entity type or null if invalid
 */
export function getEntityTypeFromReferenceId(referenceId: string): string | null {
  const parsed = parseReferenceId(referenceId);
  if (!parsed) return null;
  
  const typeMap: Record<EntityPrefix, string> = {
    'SHP': 'shop',
    'PRD': 'product',
    'MNU': 'menu',
    'SRV': 'service',
    'OFF': 'office'
  };
  
  return typeMap[parsed.prefix];
}

/**
 * Generate URL-friendly path from reference ID
 * @param referenceId The reference ID
 * @returns URL path (e.g., "/product/PRD-MAN-024")
 */
export function getReferenceIdPath(referenceId: string): string {
  const entityType = getEntityTypeFromReferenceId(referenceId);
  if (!entityType) return '/';
  
  return `/${entityType}/${referenceId}`;
}

/**
 * Get next reference ID for a district and entity type
 * This would typically query Firestore to get the current count
 * @param prefix Entity prefix
 * @param district District name
 * @param currentEntities Array of existing entities to count
 * @returns Next reference ID
 */
export function getNextReferenceId(
  prefix: EntityPrefix, 
  district: string, 
  currentEntities: Array<{ referenceId?: string; district?: string }> = []
): string {
  // Count existing entities in this district with this prefix
  const districtCode = district.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '').padEnd(3, 'X');
  const prefixPattern = `${prefix}-${districtCode}-`;
  
  const count = currentEntities.filter(entity => 
    entity.referenceId?.startsWith(prefixPattern) ||
    (entity.district && entity.district.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '').padEnd(3, 'X') === districtCode)
  ).length;
  
  return generateReferenceId(prefix, district, count);
}

// Export entity prefixes for use in forms
export const ENTITY_PREFIXES = {
  SHOP: 'SHP' as EntityPrefix,
  PRODUCT: 'PRD' as EntityPrefix,
  MENU: 'MNU' as EntityPrefix,
  SERVICE: 'SRV' as EntityPrefix,
  OFFICE: 'OFF' as EntityPrefix,
} as const;

// Export common districts for reference
export const COMMON_DISTRICTS = [
  'Mandsaur',
  'Bhanpura',
  'Garoth',
  'Malhargarh',
  'Sitamau',
  'Shamgarh',
  'Suwasra',
  'Daloda'
] as const;