import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../services/userRoleService';

export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    reason?: string;
  }>({ isValid: false });

  useEffect(() => {
    if (loading) return;

    const checkAdminStatus = async () => {
      if (user) {
        try {
          const role = await getUserRole();
          setIsAdminUser(role.isAdmin);
          setValidation({
            isValid: role.isAdmin,
            reason: role.isAdmin ? undefined : 'Insufficient permissions'
          });
        } catch (error) {
          setIsAdminUser(false);
          setValidation({ isValid: false, reason: 'Failed to validate permissions' });
        }
      } else {
      setIsAdminUser(false);
        setValidation({ isValid: false, reason: 'User not authenticated' });
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  return {
    isAdmin: isAdminUser,
    validation,
    loading,
    user
  };
};