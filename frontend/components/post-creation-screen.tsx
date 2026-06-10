'use client';

import { X, Image as ImageIcon, Send, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@/app/page';
import toast from 'react-hot-toast';
import api from '@/app/api/api';

interface PostCreationScreenProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (newPost: any) => void;
  activeChannelId: string | null;
  onPostCreated: (newPost: any) => void;
}

export default function PostCreationScreen({ isOpen, currentUser, onClose, onSubmit, activeChannelId, onPostCreated }: PostCreationScreenProps) {
  const [content, setContent] = useState('');
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null | undefined>();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
      const blobUrl = URL.createObjectURL(file);
      setImageBlobUrl(blobUrl);
      setSelectedFileName(file.name);
    }
  };

  const removeImage = () => {
    if (imageBlobUrl) {
      URL.revokeObjectURL(imageBlobUrl);
    }
    setImageBlobUrl(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const createFormData = () => {
    const formData = new FormData();
    formData.append('content', content);

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      formData.append('image', file);
    }
    if (activeChannelId) {
      formData.append('channelId', activeChannelId);
    }
    return formData;
  };

  const resetForm = () => {
    setContent('');
    removeImage();
  };

  const uploadPost = async (formData: FormData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        throw new Error('Token missing');
      }
      return await api.post('/posts', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("JSON Test Error:", err);
      throw err;
    }
  };
  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);

      const formData = createFormData();
      const response = await uploadPost(formData);

      toast.success('Post created successfully!');

      if (onPostCreated) {
        onPostCreated(response.data);
      } else if (onSubmit) {
        onSubmit(response.data);
      }

      resetForm();
      onClose();
      return response;

    } catch (err) {
      console.error("Upload error context:", err);
      toast.error('Failed to publish post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-[#111827] border border-[#374151] rounded-xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#1f2937] border-b border-[#374151]">
            <h2 className="text-lg font-bold text-white">Create a Post</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#374151] transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#374151]">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A870] to-[#006239] flex items-center justify-center text-white text-xs font-bold uppercase">
                {currentUser.username ? currentUser.username[0] : 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{currentUser.name || 'Anonymous User'}</p>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Share Your Thoughts
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's on your mind? Share your feedback, ideas, or thoughts..."
                className="w-full min-h-32 px-4 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 focus:border-transparent transition-all resize-none"
                autoFocus
              />
              <p className="text-xs text-gray-600">{content.length} characters</p>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <ImageIcon size={14} />
                Attach Image (Optional)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={triggerFileInput}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#1f2937] border-2 border-dashed border-[#374151] rounded-xl text-gray-400 hover:border-[#00A870] hover:bg-[#00A870]/5 transition-all"
              >
                <Upload size={20} />
                <span className="text-sm font-medium truncate max-w-xs">
                  {selectedFileName ? selectedFileName : 'Click to select an image from your device'}
                </span>
              </motion.button>
            </div>

            {/* Image Preview Window */}
            {imageBlobUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full h-52 rounded-xl overflow-hidden border border-[#374151] group"
              >
                <img
                  src={imageBlobUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Footer controls */}
          <div className="px-6 py-4 bg-[#1f2937] border-t border-[#374151] flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#374151] hover:bg-[#374151] text-gray-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 disabled:from-[#374151] disabled:to-[#374151] disabled:cursor-not-allowed text-white font-semibold transition-all"
            >
              <Send size={16} />
              <span>{isLoading ? 'Posting...' : 'Post'}</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}