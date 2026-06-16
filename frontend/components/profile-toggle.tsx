'use client';

import { LogOut, Pencil, Camera } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import type { User } from '@/app/page';
import toast from 'react-hot-toast'

interface ProfileToggleProps {
  currentUser: User | null;
  onUpdateUsername: (newUsername: string) => void;
  onUpdateAvatar?: (avatarImage: string) => void;
  onLogout: () => void;
}
const BACKEND_URL = 'https://instant-plsl.onrender.com';

export default function ProfileToggle({ currentUser, onUpdateUsername, onUpdateAvatar, onLogout }: ProfileToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentUser?.username || currentUser?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setUsernameInput(currentUser.username || '');
    }
  }, [currentUser]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingUsername(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!currentUser) return null;

  const submitProfileChanges = async (fields: {
    name?: string;
    avatarFile?: File;
  }) => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (fields.name) formData.append('name', fields.name);
      if (fields.avatarFile) formData.append('image', fields.avatarFile);

      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `${BACKEND_URL}/users/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;

        if (fields.name) {
          onUpdateUsername(updatedUser.name || updatedUser.username);
        }
        if (fields.avatarFile && onUpdateAvatar) {
          onUpdateAvatar(updatedUser.avatarUrl);
        }
        setEditingUsername(false);
      }
    toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = () => {
    const currentName = currentUser.username || '';
    if (usernameInput.trim() && usernameInput.trim() !== currentName) {
      submitProfileChanges({ name: usernameInput.trim() });
    } else {
      setEditingUsername(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await axios.patch(`${BACKEND_URL}/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data.user || response.data;
      if (updatedUser && updatedUser.avatarUrl) {
        if (onUpdateAvatar) {
          onUpdateAvatar(updatedUser.avatarUrl);
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({ ...parsed, avatarUrl: updatedUser.avatarUrl }));
        }
      }
       toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setAvatarPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingUsername(false);
    setUsernameInput(currentUser.username || '');
  };

  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;

    const dbAvatar = currentUser?.avatarUrl;

    if (dbAvatar) {
      if (dbAvatar.startsWith('http')) return dbAvatar;

      if (dbAvatar.includes('uploads/')) {
        return `${BACKEND_URL}/${dbAvatar.replace(/^\//, '')}`;
      }
      return `${BACKEND_URL}/uploads/${dbAvatar.replace(/^\//, '')}`;
    }
    return null;
  };

  const activeAvatar = getAvatarSrc();
  const currentDisplayName = currentUser.username || 'User';

  const initials = currentDisplayName
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word[0].toUpperCase())
  .join('');

  return (
    <div className="relative" ref={componentRef}>
      {/* Pill Layout Button wrapper */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00A870]/30 hover:border-[#00A870] transition-all shadow-md"
      >
        {activeAvatar ? (
          <img
            src={activeAvatar}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00A870] to-[#006239] flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-[#111827] border border-[#374151] rounded-lg shadow-2xl overflow-hidden z-50"
          >
            {/* Profile Header */}
            <div className="bg-[#1f2937] p-4 space-y-4">
              <div className="flex flex-col items-centertext-center gap-3 min-w-0">
                <div className="relative group w-14 h-14 flex-shrink-0">
                  {activeAvatar ? (
                    <img
                      src={activeAvatar}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00A870] to-[#006239] flex items-center justify-center text-white text-sm font-bold">
                      {currentDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity disabled:cursor-not-allowed"
                  >
                    <Camera size={14} className="text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-lg text-white font-medium truncate">{currentDisplayName}</p>
                  <p className="text-xs text-gray-400 capitalize truncate">{currentUser.role || 'Member'}</p>
                </div>
              </div>

              {/* Edit Username Section */}
              {editingUsername ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] border border-[#374151] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 transition-all"
                    placeholder="Enter username"
                    disabled={loading}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      onClick={handleSaveUsername}
                      className="flex-1 px-3 py-1.5 bg-[#00A870]/30 hover:bg-[#00A870]/40 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      disabled={loading}
                      onClick={handleCancel}
                      className="flex-1 px-3 py-1.5 bg-[#374151] hover:bg-[#4b5563] text-gray-300 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  onClick={() => {
                    setEditingUsername(true);
                    setUsernameInput(currentUser.username || '');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#374151] hover:bg-[#4b5563] text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                  Edit Profile / Username
                </button>
              )}
            </div>

            {/* Logout Action Area */}
            <div className="border-t border-[#374151] p-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition-colors"
              >
                <LogOut size={16} />
                Logout
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}