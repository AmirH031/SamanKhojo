import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { 
  getUserProfile, 
  UserProfile,
  signOutUser,
  signInWithGoogle,
  signInAsGuest,
  createUserProfile,
  isProfileCompleted,
  updateUserProfile
} from '../services/authService';
import { cleanupGuestAccount } from '../services/guestCleanupService';
import { getUserRole, clearRoleCache } from '../services/userRoleService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginAsGuest: () => Promise<User>;
  completeProfile: (name: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  needsProfileSetup: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [hasShownWelcomeBack, setHasShownWelcomeBack] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
          
          // Show welcome back message for returning users
          if (userProfile && !hasShownWelcomeBack) {
            const lastLogin = userProfile.lastLogin;
            const now = new Date();
            
            // Check if last login was more than 30 seconds ago
            if (lastLogin) {
              const lastLoginDate = lastLogin instanceof Date ? lastLogin : lastLogin.toDate();
              const timeDiff = now.getTime() - lastLoginDate.getTime();
              
              if (timeDiff > 30000) { // 30 seconds
                // Import toast dynamically to avoid circular dependencies
                import('react-toastify').then(({ toast }) => {
                  toast.success(`Welcome back, ${userProfile.name}! 👋`, {
                    position: 'top-center',
                    autoClose: 3000,
                  });
                });
              }
            }
            setHasShownWelcomeBack(true);
          }
          
          // Update last login timestamp
          if (userProfile) {
            try {
              await updateUserProfile(user.uid, {});
            } catch (error) {
              console.warn('Failed to update last login:', error);
            }
          }
          
          // Check if profile setup is needed (skip for admin users)
          // Check user role from backend
          try {
            const role = await getUserRole();
            if (role.isAdmin) {
              setNeedsProfileSetup(false);
            } else if (!userProfile || !isProfileCompleted(userProfile)) {
              setNeedsProfileSetup(true);
            } else {
              setNeedsProfileSetup(false);
            }
          } catch (roleError) {
            // If role check fails, proceed with normal profile setup logic
            if (!userProfile || !isProfileCompleted(userProfile)) {
              setNeedsProfileSetup(true);
            } else {
              setNeedsProfileSetup(false);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          
          // Handle offline/network errors gracefully
          if (error.code === 'unavailable' || error.message?.includes('offline')) {
            console.warn('Firebase is offline, user will work in offline mode');
            // Don't set needsProfileSetup to true for network errors
            setProfile(null);
            setNeedsProfileSetup(false);
          } else {
            setProfile(null);
            setNeedsProfileSetup(true);
          }
        }
      } else {
        setProfile(null);
        setNeedsProfileSetup(false);
        setHasShownWelcomeBack(false);
        clearRoleCache(); // Clear role cache on logout
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        
        // Check user role from backend
        try {
          const role = await getUserRole();
          if (role.isAdmin) {
            setNeedsProfileSetup(false);
          } else if (!userProfile || !isProfileCompleted(userProfile)) {
            setNeedsProfileSetup(true);
          } else {
            setNeedsProfileSetup(false);
          }
        } catch (roleError) {
          setNeedsProfileSetup(!userProfile || !isProfileCompleted(userProfile));
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  // Email/Password login (for admin)
  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const loggedInUser = userCredential.user;
    setUser(loggedInUser);

    try {
      const userProfile = await getUserProfile(loggedInUser.uid);
      setProfile(userProfile);
      
      // Check user role from backend
      try {
        const role = await getUserRole();
        if (role.isAdmin) {
          setNeedsProfileSetup(false);
        } else {
          setNeedsProfileSetup(!userProfile || !isProfileCompleted(userProfile));
        }
      } catch (roleError) {
        setNeedsProfileSetup(!userProfile || !isProfileCompleted(userProfile));
      }
    } catch (error) {
      console.error('Error fetching profile after login:', error);
      setProfile(null);
      setNeedsProfileSetup(true);
    }
  };

  // Google Sign-In
  const loginWithGoogle = async (): Promise<User> => {
    const user = await signInWithGoogle();
    setUser(user);
    
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setNeedsProfileSetup(!userProfile || !isProfileCompleted(userProfile));
    } catch (error) {
      console.error('Error fetching profile after Google login:', error);
      setProfile(null);
      setNeedsProfileSetup(true);
    }
    
    return user;
  };

  // Anonymous Sign-In
  const loginAsGuest = async (): Promise<User> => {
    const user = await signInAsGuest();
    setUser(user);
    
    // Anonymous users always need profile setup
    setProfile(null);
    setNeedsProfileSetup(true);
    
    return user;
  };

  // Complete profile setup
  const completeProfile = async (name: string, phoneNumber?: string) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const userProfile = await createUserProfile(user, name, phoneNumber);
      setProfile(userProfile);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Cleanup guest account data before logout (only if it's actually a guest)
    if (user && profile?.isGuest) {
      try {
        await cleanupGuestAccount(user.uid, true);
        console.log('✅ Guest account cleaned up successfully');
      } catch (error) {
        // Silently continue with logout if cleanup fails
        console.warn('Guest account cleanup failed, continuing with logout');
      }
    }
    
    await signOutUser();
    setUser(null);
    setProfile(null);
    setNeedsProfileSetup(false);
    clearRoleCache(); // Clear role cache on logout
  };

  const value = {
    user,
    profile,
    login,
    loginWithGoogle,
    loginAsGuest,
    completeProfile,
    logout,
    loading,
    needsProfileSetup,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};