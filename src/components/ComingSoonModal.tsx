import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'product' | 'service' | 'festival';
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose, type }) => {
  const isService = type === 'service';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isService
                    ? 'bg-gradient-to-br from-purple-500 to-violet-600'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  } shadow-lg`}
              >
                <Rocket className="text-white" size={32} />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                Booking is not ready yet…
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-lg text-gray-700 mb-6"
              >
                but something exciting is coming.
              </motion.p>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 mb-8"
              >
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-4">Imagine:</p>
                </div>

                <div className="flex items-center space-x-3 text-left">
                  <span className="text-2xl">⏱️</span>
                  <span className="text-base text-gray-700 font-medium">
                    Smarter than delivery
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-left">
                  <span className="text-2xl">🚀</span>
                  <span className="text-base text-gray-700 font-medium">
                    Faster shopping
                  </span>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
              >
                Got it! ✨
              </motion.button>

              {/* Footer Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-600 mt-4 font-medium"
              >
                Feature reveal… coming soon.
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonModal;