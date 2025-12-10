import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <LanguageSelector 
          isModal={true} 
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
};

export default LanguageSelectionModal;