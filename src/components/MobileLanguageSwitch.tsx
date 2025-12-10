import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, saveLanguagePreference } from '../services/languageService';

interface MobileLanguageSwitchProps {
  className?: string;
  onLanguageChange?: () => void;
}

const MobileLanguageSwitch: React.FC<MobileLanguageSwitchProps> = ({ 
  className = "",
  onLanguageChange
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (languageCode: string) => {
    await saveLanguagePreference(languageCode);
    await i18n.changeLanguage(languageCode);
    setIsOpen(false);
    onLanguageChange?.();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-between w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-2xl px-4 py-4 hover:shadow-xl transition-all shadow-lg border-2 border-white/20"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-xl">{currentLanguage.flag}</span>
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-base">{currentLanguage.nativeName}</div>
            <div className="text-xs text-white/80">{currentLanguage.name}</div>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring" }}
          className="bg-white/20 p-2 rounded-xl"
        >
          <ChevronDown size={18} className="text-white/80" />
        </motion.div>
      </motion.button>

      {/* Language Options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Options Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white/98 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden z-50"
            >
              <div className="p-3">
                {supportedLanguages.map((language, index) => (
                  <motion.button
                    key={language.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      currentLanguage.code === language.code
                        ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                        currentLanguage.code === language.code
                          ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                        <span className="text-xl">{language.flag}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900 text-base">
                          {language.nativeName}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          {language.name}
                        </div>
                      </div>
                    </div>
                    
                    {currentLanguage.code === language.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Footer */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-4 py-4 border-t border-gray-100">
                <p className="text-xs text-center text-gray-600 font-medium">
                  🌍 Language preference is saved automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLanguageSwitch;