/**
 * Admin Setup Utility - Removed sensitive admin email checks
 * Now uses backend validation only
 */

import { getUserRole } from '../services/userRoleService';

export const checkAdminConfiguration = async () => {
  console.group('🔧 Admin Configuration Check');
  
  try {
    const role = await getUserRole();
    
    console.log('User Role Information:');
    console.log('- Is Admin:', role.isAdmin);
    console.log('- Role:', role.role);
    console.log('- Permissions:', role.permissions);
    
    if (role.isAdmin) {
      console.log('✅ Admin access confirmed via backend');
    } else {
      console.log('❌ No admin access - user role:', role.role);
    }
  } catch (error) {
    console.error('❌ Failed to check admin configuration:', error);
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