import {
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  User,
  updateProfile
} from 'firebase/auth';
import { apiConfig } from '../config/app';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { retryOperation } from '../utils';

// Generate unique device ID
const generateDeviceId = (): string => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

export interface UserProfile {
  uid: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  isAnonymous: boolean;
  isGuest: boolean;
  deviceInfo: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  profileCompleted: boolean;
  deviceId: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

// Generate device fingerprint
const getDeviceFingerprint = (): { deviceInfo: string; deviceId: string } => {
  // Get or create persistent device ID
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const deviceInfo = Math.abs(hash).toString(36);
  
  return { deviceInfo, deviceId };
};

// Find existing user by phone or email
export const findExistingUser = async (
  phoneNumber?: string, 
  email?: string, 
  deviceInfo?: string
): Promise<{ found: boolean; profile?: UserProfile; canMerge?: boolean }> => {
  try {
    if (!auth.currentUser) {
      console.warn('No authenticated user for findExistingUser');
      return { found: false };
    }
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${apiConfig.baseUrl}/auth/find-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, email, deviceInfo }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to find user`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding existing user:', error.message);
    return { found: false };
  }
};

// Merge current session with existing profile
export const mergeWithExistingProfile = async (
  targetUid: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user for profile merge');
    }
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${apiConfig.baseUrl}/auth/merge-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUid, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to merge profile`);
    }

    const result = await response.json();
    return result.profile;
  } catch (error) {
    console.error('Error merging profile:', error.message);
    throw error;
  }
};

// Google Sign-In
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

// Anonymous Sign-In
export const signInAsGuest = async (): Promise<User> => {
  const result = await signInAnonymously(auth);
  return result.user;
};

// Create or update user profile
export const createUserProfile = async (
  user: User,
  name: string,
  phoneNumber?: string
): Promise<UserProfile> => {
  const { deviceInfo, deviceId } = getDeviceFingerprint();
  const formattedPhone = phoneNumber ? (phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`) : undefined;

  // Check for existing user by phone or email
  const existingUserResult = await findExistingUser(
    formattedPhone,
    user.email || undefined,
    deviceInfo
  );

  if (existingUserResult.found && existingUserResult.profile) {
    const existingProfile = existingUserResult.profile;
    
    if (existingProfile.uid === user.uid) {
      // Same user, just update their profile
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        name: name.trim(),
        phoneNumber: formattedPhone,
        email: user.email || existingProfile.email || '',
        deviceInfo,
        deviceId,
        lastLogin: serverTimestamp(),
        profileCompleted: true
      };
      
      await updateDoc(userRef, updateData);
      
      return {
        uid: user.uid,
        ...existingProfile,
        ...updateData,
        lastLogin: Timestamp.now()
      } as UserProfile;
    } else if (existingUserResult.canMerge) {
      // Different UID but same phone/email - merge profiles
      try {
        const mergedProfile = await mergeWithExistingProfile(existingProfile.uid, {
          name: name.trim(),
          phoneNumber: formattedPhone,
          email: user.email || existingProfile.email || '',
          deviceInfo,
          deviceId,
          isAnonymous: user.isAnonymous,
          isGuest: user.isAnonymous && !user.email, // Guest if anonymous and no email
          profileCompleted: true
        });
        
        return mergedProfile;
      } catch (error) {
        console.error('Failed to merge profiles, creating new one:', error);
        // Fall through to create new profile
      }
    }
  }

  const userRef = doc(db, 'users', user.uid);
  const existingDoc = await getDoc(userRef);

  let createdAt: Timestamp;
  if (existingDoc.exists()) {
    const existingData = existingDoc.data();
    createdAt = existingData.createdAt instanceof Timestamp
      ? existingData.createdAt
      : Timestamp.fromDate(new Date(existingData.createdAt));
  } else {
    createdAt = Timestamp.now();
  }

  const profileData: Partial<UserProfile> = {
    name: name.trim(),
    phoneNumber: formattedPhone,
    email: user.email || '',
    isAnonymous: user.isAnonymous,
    isGuest: user.isAnonymous && !user.email, // Guest if anonymous and no email
    deviceInfo,
    deviceId,
    createdAt,
    lastLogin: Timestamp.now(),
    profileCompleted: true
  };

  await setDoc(userRef, profileData, { merge: true });

  await updateProfile(user, { displayName: name.trim() });

  return {
    uid: user.uid,
    ...profileData
  } as UserProfile;
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    return await retryOperation(async () => {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) return null;

      const data = snapshot.data();

      return {
        uid,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : new Date()
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // If offline, return cached data or null
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn('Firestore is offline, returning null profile');
      return null;
    }
    
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'phoneNumber'>>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const updateData: any = {
    ...updates,
    lastLogin: serverTimestamp()
  };

  if (updates.phoneNumber) {
    updateData.phoneNumber = updates.phoneNumber.startsWith('+91')
      ? updates.phoneNumber
      : `+91${updates.phoneNumber}`;
  }

  await updateDoc(userRef, updateData);

  if (updates.name && auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: updates.name
    });
  }
};
export const upgradeGuestToGoogle = async (): Promise<User> => {
  if (!auth.currentUser?.isAnonymous) {
    throw new Error('Current user is not anonymous.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  // Optionally, link the accounts
  await auth.currentUser.linkWithCredential(result.credential);

  return result.user;
};
// Sign out user
export const signOutUser = async (): Promise<void> => {
  await auth.signOut();
};

// Check if profile is completed
export const isProfileCompleted = (profile: UserProfile | null): boolean => {
  if (!profile?.profileCompleted || !profile.name) return false;
  
  // For guest users, phone number is required
  if (profile.isGuest && !profile.phoneNumber) return false;
  
  return true;
};

// Mark profile as completed
export const markProfileCompleted = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    profileCompleted: true,
    lastLogin: serverTimestamp()
  });
};