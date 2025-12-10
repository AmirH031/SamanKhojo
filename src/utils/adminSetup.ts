/**
 * Admin Setup Utility - Removed sensitive admin email checks
 * Now uses backend validation only
 */

import { getUserRole } from '../services/userRoleService';

export const checkAdminConfiguration = async () => {
  console.group('🔧 Admin Configuration Check');
  
  try {
    const role = await getUserRole();
    
    // Admin role verification completed silently in production
  } catch (error) {
    // Silent error handling in production
  }
  
  console.groupEnd();
};

export const testAdminAccess = async (): Promise<boolean> => {
  try {
    const role = await getUserRole();
    return role.isAdmin;
  } catch (error) {
    return false;
  }
};

// Auto-run configuration check in development
if (import.meta.env.DEV) {
  checkAdminConfiguration();
}