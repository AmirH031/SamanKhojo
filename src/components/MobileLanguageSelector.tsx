import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, saveLanguagePreference } from '../services/languageService';

interface MobileLanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

const MobileLanguageSelector: React.FC<MobileLanguageSelectorProps> = ({ 
  className = "",
  compact = false
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (languageCode: string) => {
    await saveLanguagePreference(languageCode);
    await i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 hover:bg-white transition-all shadow-sm"
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-gray-700">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown 
            size={14} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 py-2 min-w-48 z-50"
              >
                {supportedLanguages.map((language) => (
                  <div
                    key={language.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleLanguageChange(language.code)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleLanguageChange(language.code);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.flag}</span>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {language.nativeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {language.name}
                        </div>
                      </div>
                    </div>
                    {currentLanguage.code === language.code && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </div>
                ))}
              </motion.div>
              
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-2xl p-6 max-w-md w-full shadow-2xl"
              >
                {/* Mobile handle bar */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Select Language</h2>
                    <p className="text-sm text-gray-600">भाषा चुनें</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {supportedLanguages.map((language, index) => (
                    <motion.button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all text-left border border-gray-100 active:bg-gray-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                          {language.flag}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {language.nativeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {language.name}
                          </div>
                        </div>
                      </div>
                      
                      {currentLanguage.code === language.code && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-700 text-center">
                    Your language preference will be saved for future visits
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-3 hover:bg-white hover:shadow-md transition-all"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Globe className="text-white" size={20} />
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900">Language / भाषा</div>
            <div className="text-sm text-gray-500">
              {currentLanguage.flag} {currentLanguage.nativeName}
            </div>
          </div>
        </div>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isOpen && (
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
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Select Language</h2>
                  <p className="text-sm text-gray-600">भाषा चुनें</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-2">
                {supportedLanguages.map((language, index) => (
                  <motion.button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all text-left border border-gray-100 active:bg-gray-100"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                        {language.flag}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {language.nativeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language.name}
                        </div>
                      </div>
                    </div>
                    
                    {currentLanguage.code === language.code && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 text-center">
                  Your language preference will be saved for future visits
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLanguageSelector;