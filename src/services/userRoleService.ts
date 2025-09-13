/**
 * User role service - fetches role from backend instead of frontend checks
 */

import { api } from './api';

export interface UserRole {
  isAdmin: boolean;
  permissions: string[];
  role: 'user' | 'admin' | 'guest';
}

let cachedRole: UserRole | null = null;
let roleCache: { role: UserRole; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user role from backend (cached)
 */
export const getUserRole = async (): Promise<UserRole> => {
  // Check cache first
  if (roleCache && Date.now() - roleCache.timestamp < CACHE_DURATION) {
    return roleCache.role;
  }

  // Check if user is authenticated first
  const { auth } = await import('./firebase');
  if (!auth.currentUser) {
    const defaultRole: UserRole = {
      isAdmin: false,
      permissions: [],
      role: 'user'
    };
    return defaultRole;
  }

  try {
    const response = await api.get('/auth/user/role');
    const role: UserRole = {
      isAdmin: response.isAdmin || false,
      permissions: response.permissions || [],
      role: response.role || 'user'
    };

    // Cache the result
    roleCache = {
      role,
      timestamp: Date.now()
    };

    cachedRole = role;
    return role;
  } catch (error) {
    // Silently handle auth errors to avoid console spam
    const defaultRole: UserRole = {
      isAdmin: false,
      permissions: [],
      role: 'user'
    };

    return defaultRole;
  }
};

/**
 * Check if current user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const role = await getUserRole();
    return role.isAdmin;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (permission: string): Promise<boolean> => {
  try {
    const role = await getUserRole();
    return role.permissions.includes(permission) || role.isAdmin;
  } catch (error) {
    return false;
  }
};

/**
 * Clear role cache (call on logout)
 */
export const clearRoleCache = (): void => {
  cachedRole = null;
  roleCache = null;
};

/**
 * Refresh role from backend
 */
export const refreshUserRole = async (): Promise<UserRole> => {
  roleCache = null; // Clear cache
  return getUserRole();
};