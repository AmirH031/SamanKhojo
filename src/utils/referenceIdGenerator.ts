/**
 * Unified Reference ID Generator
 * Generates consistent IDs across all entities: shops, products, menu items, services, and offices
 */

export type EntityPrefix = 'SHP' | 'PRD' | 'MNU' | 'SRV' | 'OFF';

export interface ReferenceIdConfig {
  prefix: EntityPrefix;
  district: string;
  count: number;
}

/**
 * Generates a reference ID in format: <PREFIX>-<DISTRICT_CODE>-<COUNT>
 * @param prefix Entity prefix (SHP, PRD, MNU, SRV, OFF)
 * @param district District name (e.g., "Mandsaur", "Bhanpura")
 * @param count Current count of entities in this district
 * @returns Formatted reference ID (e.g., "PRD-MAN-024")
 */
export function generateReferenceId(prefix: EntityPrefix, district: string, count: number): string {
  // Extract first 3 letters from district, remove non-alphabetic characters
  const districtCode = district
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X'); // Pad with X if less than 3 characters
  
  // Format count with leading zeros (3 digits)
  const formattedCount = String(count + 1).padStart(3, '0');
  
  return `${prefix}-${districtCode}-${formattedCount}`;
}

/**
 * Parses a reference ID to extract its components
 * @param referenceId The reference ID to parse
 * @returns Parsed components or null if invalid
 */
export function parseReferenceId(referenceId: string): {
  prefix: EntityPrefix;
  districtCode: string;
  count: number;
} | null {
  const parts = referenceId.split('-');
  if (parts.length !== 3) return null;
  
  const [prefix, districtCode, countStr] = parts;
  const count = parseInt(countStr, 10);
  
  if (!['SHP', 'PRD', 'MNU', 'SRV', 'OFF'].includes(prefix) || isNaN(count)) {
    return null;
  }
  
  return {
    prefix: prefix as EntityPrefix,
    districtCode,
    count
  };
}

/**
 * Validates if a reference ID follows the correct format
 * @param referenceId The ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidReferenceId(referenceId: string): boolean {
  return parseReferenceId(referenceId) !== null;
}

/**
 * Gets the entity type from a reference ID
 * @param referenceId The reference ID
 * @returns Human-readable entity type
 */
export function getEntityTypeFromId(referenceId: string): string {
  const parsed = parseReferenceId(referenceId);
  if (!parsed) return 'Unknown';
  
  const typeMap: Record<EntityPrefix, string> = {
    SHP: 'Shop',
    PRD: 'Product',
    MNU: 'Menu Item',
    SRV: 'Service',
    OFF: 'Office'
  };
  
  return typeMap[parsed.prefix];
}

/**
 * Generates a URL path for an entity based on its reference ID
 * @param referenceId The reference ID
 * @returns URL path (e.g., "/product/PRD-MAN-024")
 */
export function getEntityUrlFromId(referenceId: string): string {
  const parsed = parseReferenceId(referenceId);
  if (!parsed) return '/';
  
  const pathMap: Record<EntityPrefix, string> = {
    SHP: 'shop',
    PRD: 'product',
    MNU: 'menu',
    SRV: 'service',
    OFF: 'office'
  };
  
  return `/${pathMap[parsed.prefix]}/${referenceId}`;
}

/**
 * District name mappings for common variations
 */
export const DISTRICT_MAPPINGS: Record<string, string> = {
  'mandsaur': 'Mandsaur',
  'bhanpura': 'Bhanpura',
  'malhargarh': 'Malhargarh',
  'garoth': 'Garoth',
  'sitamau': 'Sitamau',
  'shamgarh': 'Shamgarh',
  'suwasra': 'Suwasra',
  'daloda': 'Daloda'
};

/**
 * Normalizes district name for consistent ID generation
 * @param district Raw district name
 * @returns Normalized district name
 */
export function normalizeDistrict(district: string): string {
  const normalized = district.toLowerCase().trim();
  return DISTRICT_MAPPINGS[normalized] || district;
}