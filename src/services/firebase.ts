import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from '../config/app';


// Validate Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration keys:', missingKeys);
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}

const app = initializeApp(firebaseConfig);

// Initialize Firestore with better error handling
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Add connection monitoring
let isOnline = navigator.onLine;

const handleOnline = async () => {
  if (!isOnline) {
    isOnline = true;
    if (process.env.NODE_ENV !== 'production') {
      // Network connection restored
    }
    try {
      await enableNetwork(db);
    } catch (error) {
      console.warn('Failed to enable Firestore network:', error);
    }
  }
};

const handleOffline = async () => {
  if (isOnline) {
    isOnline = false;
    if (process.env.NODE_ENV !== 'production') {
      // Network connection lost, offline mode enabled
    }
    try {
      await disableNetwork(db);
    } catch (error) {
      console.warn('Failed to disable Firestore network:', error);
    }
  }
};

// Listen for network changes
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Set initial state
if (!navigator.onLine) {
  handleOffline();
}

export default app;