'use client';

import { X, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface ImageMetrics {
  comments: number;
  upvotesCounts: number;
  downvotesCounts: number;
}

export interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null | undefined; 
  onClose: () => void;
  postId?: string;
  metrics?: ImageMetrics;
}

export default function ImageLightbox({
  isOpen, imageUrl, onClose, postId, metrics
}: ImageLightboxProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Unlock background scrolling
    };
  }, [isOpen, onClose]);

  const hasValidUrl = imageUrl && imageUrl.trim() !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between"
          onClick={onClose}
        >
          {/* Top Header Navigation Strip */}
          <div className="w-full flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
            <span className="text-xs font-mono text-gray-400 select-none">
              {postId ? `Post Reference: ${postId.slice(-6)}` : 'Media Viewer'}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Main Hero Image Frame */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
            {hasValidUrl ? (
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                src={imageUrl}
                alt="Full screen media presentation view"
                className="max-w-full max-h-[75vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl border border-gray-800"
                onClick={(e) => e.stopPropagation()} // Prevents closing lightbox when clicking image directly
                crossOrigin="anonymous"
              />
            ) : (
              <div className="text-center text-gray-500 text-sm bg-gray-900/50 p-6 rounded-xl border border-gray-800" onClick={(e) => e.stopPropagation()}>
                <p className="font-medium text-gray-400">Image Asset Mismatch</p>
                <p className="text-xs text-gray-600 mt-1 font-mono break-all max-w-xs">Received: "{String(imageUrl)}"</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}