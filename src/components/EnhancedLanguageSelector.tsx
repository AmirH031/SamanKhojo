import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, saveLanguagePreference } from '../services/languageService';

interface EnhancedLanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'simple' | 'detailed';
}

const EnhancedLanguageSelector: React.FC<EnhancedLanguageSelectorProps> = ({ 
  isOpen, 
  onClose, 
  variant = 'detailed' 
}) => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [saving, setSaving] = useState(false);
  
  const currentLanguage = supportedLanguages.find(lang => 
    lang.code === selectedLanguage || lang.code.startsWith(selectedLanguage)
  ) || supportedLanguages[0];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await i18n.changeLanguage(selectedLanguage);
      await saveLanguagePreference(selectedLanguage);
      // Page will reload automatically from saveLanguagePreference
    } catch (error) {
      console.error('Error saving language:', error);
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (variant === 'simple') {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 pb-24 sm:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100/80 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Language</h2>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? '...' : '✓'}
              </button>
            </div>

            {/* Language List */}
            <div className="max-h-96 overflow-y-auto">
              {supportedLanguages.map((language, index) => (
                <motion.button
                  key={language.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all rounded-2xl mx-2 ${
                    selectedLanguage === language.code ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <span className="text-gray-900 font-medium">{language.name}</span>
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 pb-24 sm:pb-4">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-md bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100/80 rounded-full flex items-center justify-center hover:bg-gray-200/80 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Languages</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="p-6 space-y-6">
            {/* Selected Language Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Language</h3>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 text-white shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-xl">{currentLanguage.flag}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{currentLanguage.name}</div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* All Languages Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">All Languages</h3>
                <button className="text-blue-500 text-sm font-medium">See All</button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {supportedLanguages.map((language, index) => (
                  <motion.button
                    key={language.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleLanguageSelect(language.code)}
                    className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/90 hover:shadow-md transition-all border border-white/50"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{language.flag}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{language.name}</div>
                    </div>
                    <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${
                      selectedLanguage === language.code 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedLanguage === language.code && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <motion.button
              onClick={handleSaveSettings}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings ✓'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EnhancedLanguageSelector;