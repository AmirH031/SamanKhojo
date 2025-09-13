import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, saveLanguagePreference } from '../services/languageService';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = "", 
  showLabel = true,
  isModal = false,
  onClose
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (languageCode: string) => {
    await saveLanguagePreference(languageCode);
    await i18n.changeLanguage(languageCode);
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 100 }}
          className="bg-white rounded-t-3xl sm:rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          {/* Mobile handle bar */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Select Language / भाषा चुनें</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Please select your preferred language to continue / कृपया जारी रखने के लिए अपनी पसंदीदा भाषा चुनें
          </p>
          
          <div className="space-y-3">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors text-left border border-gray-200 active:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {language.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language.name}
                    </div>
                  </div>
                </div>
                
                {currentLanguage.code === language.code && (
                  <Check size={20} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Globe size={18} className="text-gray-600" />
        {showLabel && (
          <>
            <span className="text-sm font-medium text-gray-700">
              {currentLanguage.flag} {currentLanguage.nativeName}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-48 z-50"
          >
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{language.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {language.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language.name}
                    </div>
                  </div>
                </div>
                
                {currentLanguage.code === language.code && (
                  <Check size={16} className="text-blue-600" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;