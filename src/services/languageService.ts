import { auth } from './firebase';
import { updateProfile } from 'firebase/auth';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];

// Check if user is visiting for the first time
export const isFirstVisit = (): boolean => {
  return !localStorage.getItem('language-selected');
};

// Save language preference
export const saveLanguagePreference = async (languageCode: string): Promise<void> => {
  try {
    // Save to localStorage
    localStorage.setItem('preferred-language', languageCode);
    localStorage.setItem('language-selected', 'true');
    
    // Save to Firebase Auth metadata if user is logged in
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, {
        displayName: user.displayName || `User_${languageCode}`
      });
    }
    
    // Force page reload to ensure all components update with new language
    window.location.reload();
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Get saved language preference
export const getSavedLanguage = (): string => {
  return localStorage.getItem('preferred-language') || 'en';
};

// Get browser language
export const getBrowserLanguage = (): string => {
  const browserLang = navigator.language.split('-')[0];
  const supported = supportedLanguages.find(lang => lang.code === browserLang);
  return supported ? browserLang : 'en';
};

// Get initial language (saved > browser > default)
export const getInitialLanguage = (): string => {
  const saved = getSavedLanguage();
  if (saved !== 'en') return saved;
  
  return getBrowserLanguage();
};