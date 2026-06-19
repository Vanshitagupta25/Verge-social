'use client';

import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingPostFABProps {
  onClick: () => void;
  isVisible?: boolean;
}

export default function FloatingPostFAB({ onClick, isVisible = true }: FloatingPostFABProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] text-white font-semibold shadow-lg transition-all"
        >
          <Plus className="text-white font-bold" size={20} />
        </motion.button>
      )}

      
    </AnimatePresence>
  );
}
