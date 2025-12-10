import { getUserRole, isAdmin as checkIsAdmin } from './userRoleService';


/**
 * Check if current user is admin (uses backend validation)
 */
export const isAdmin = async (): Promise<boolean> => {
  return checkIsAdmin();
};

/**
 * Validate admin access (uses backend validation)
 */
export const validateAdminAccess = async (): Promise<{
  isValid: boolean;
  reason?: string;
}> => {
  try {
    const role = await getUserRole();
    return {
      isValid: role.isAdmin,
      reason: role.isAdmin ? undefined : 'Insufficient permissions'
    };
  } catch (error) {
    return {
      isValid: false,
      reason: 'Failed to validate permissions'
    };
  }
};