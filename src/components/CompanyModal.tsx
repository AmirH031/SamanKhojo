import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Tag } from 'lucide-react';
import { CompanyVariation } from '../types/Item';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  companies: CompanyVariation[];
  onAddToBag: (companyName: string, variation: { size: string; price: number }) => void;
}

const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  itemName,
  companies,
  onAddToBag
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{itemName}</h3>
              <p className="text-sm text-gray-600">Choose company & size</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Companies List */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {companies.map((company, companyIndex) => (
              <div key={companyIndex} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{company.companyName}</h4>
                </div>
                
                <div className="space-y-2">
                  {company.variations.map((variation, variationIndex) => (
                    <div
                      key={variationIndex}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{variation.size}</span>
                        {variation.availability === false && (
                          <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-green-600">₹{variation.price}</span>
                        <button
                          onClick={() => {
                            onAddToBag(company.companyName, variation);
                            onClose();
                          }}
                          disabled={variation.availability === false}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            variation.availability === false
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <ShoppingCart size={14} />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompanyModal;