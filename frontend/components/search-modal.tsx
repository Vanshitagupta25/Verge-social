'use client';

import { Search, X, Hash, User, Loader2} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Channel, User as UserType } from '@/app/page';
import axios from 'axios';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel?: (channelId: string) => void;
  onSelectUser?: (userId: string) => void;
}
interface BackendUser {
  _id: string;
  username: string;
  name: string;
  avatarUrl?: string;
}

interface BackendChannel {
  _id: string;
  name: string;
  logoUrl?: string;
  description?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    users: BackendUser[];
    channels: BackendChannel[];
  };
}
export default function SearchModal({ 
  isOpen, 
  onClose, 
  onSelectChannel,
  onSelectUser 
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [fetchedChannels, setFetchedChannels] = useState<BackendChannel[]>([]);
  const [fetchedUsers, setFetchedUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setFetchedChannels([]);
      setFetchedUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await axios.get<SearchResponse>(
          `https://instant-plsl.onrender.com//search?q=${encodeURIComponent(query)}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          // Force set the array safely directly from backend response payload
          setFetchedChannels(response.data.data.channels || []);
          setFetchedUsers(response.data.data.users || []);
        }
      } catch (error) {
        console.error('Error fetching search results from backend:', error);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelectChannel = (channelId: string) => {
    onSelectChannel?.(channelId);
    setQuery('');
    onClose();
  };

  const handleSelectUser = (userId: string) => {
    onSelectUser?.(userId);
    setQuery('');
    onClose();
  };

return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 md:pt-32 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg bg-[#111827] border border-[#374151] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[#374151]">
              {loading ? (
                <Loader2 size={20} className="text-[#00A870] animate-spin" />
              ) : (
                <Search size={20} className="text-[#00A870]" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search channels and users..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg hover:bg-[#374151] text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Live Results Stream Area */}
            <div className="max-h-80 overflow-y-auto">
              
              {/* Dynamic Channels Section */}
              {fetchedChannels.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Channels
                  </div>
                  {fetchedChannels.map((channel: any) => (
                    <motion.button
                      key={channel._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectChannel(channel._id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1f2937] transition-colors text-left"
                    >
                      {channel.logoUrl ? (
                        <img 
                          src={`https://instant-plsl.onrender.com//uploads/${channel.logoUrl}`}
                          alt={channel.name || 'channel'}
                          crossOrigin="anonymous"
                          className="w-10 h-10 rounded-lg object-cover bg-[#006239]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#006239] flex items-center justify-center flex-shrink-0">
                          <Hash size={18} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {/* CRITICAL FIXED FALLBACK LOGIC LINES */}
                          #{channel.name || channel?.name || channel._doc?.name || 'unnamed'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {channel.description || 'No description provided.'}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Dynamic Users Section */}
              {fetchedUsers.length > 0 && (
                <div className="p-2 border-t border-[#374151]">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Users
                  </div>
                  {fetchedUsers.map((user) => (
                    <motion.button
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectUser(user._id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1f2937] transition-colors text-left"
                    >
                      {user.avatarUrl ? (
                        <img 
                          src={`https://instant-plsl.onrender.com/uploads/${user.avatarUrl}`}
                          alt={user.name}
                          crossOrigin="anonymous"
                          className="w-10 h-10 rounded-full object-cover bg-gradient-to-br from-[#00A870] to-[#006239]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A870] to-[#006239] flex items-center justify-center flex-shrink-0">
                          <User size={18} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Empty/No Results Found State */}
              {query && !loading && fetchedChannels.length === 0 && fetchedUsers.length === 0 && (
                <div className="p-8 text-center">
                  <Search size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-400">No results found for &quot;{query}&quot;</p>
                </div>
              )}

              {/* Default/Idle State */}
              {!query && (
                <div className="p-8 text-center">
                  <Search size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-400">Start typing to search channels and users</p>
                </div>
              )}
            </div>

            {/* Modal Footer hints */}
            <div className="px-4 py-3 border-t border-[#374151] text-xs text-gray-500 flex items-center justify-between">
              <span>Press ESC to close</span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded bg-[#1f2937] text-gray-400">Enter</kbd>
                <span>to select</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}