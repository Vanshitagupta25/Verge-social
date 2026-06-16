'use client';

import { Plus, Shield, X, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Channel, User } from '@/app/page';

interface SidebarProps {
  channels: Channel[];
  currentUser: User | null;
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, description: string) => void;
}

export default function Sidebar({
  channels,
  currentUser,
  onSelectChannel,
  onCreateChannel,
  activeChannelId,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName, newChannelDesc);
      setNewChannelName('');
      setNewChannelDesc('');
      setShowCreateModal(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-[#374151] flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
            <path d="M4 4H9L14 15L19 4H24L16.5 20.5H11.5L4 4Z" fill="currentColor" />
            <path d="M10.5 4H13.5L8.5 15H5.5L10.5 4Z" fill="currentColor" opacity="0.4" />
          </svg>
          <h1 className="text-lg font-extrabold tracking-tight text-white">Verge</h1>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1 hover:bg-[#1f2937] rounded-lg text-gray-400 hover:text-white"
        >
          <X size={30} />
        </button>
      </div>

      <div className="px-4 py-1.5 border-b border-[#374151]/30">
        <p className="text-[10px] text-gray-500">Internal Community Platform</p>
      </div>

      <div className="p-3 border-b border-[#374151]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 text-white font-semibold transition-all duration-200 text-xs shadow-lg hover:shadow-[#00A870]/30"
        >
          <Plus size={16} />
          <span>Create Channel</span>
        </motion.button>
        <p className="text-[10px] text-gray-600 mt-1 text-center">Admin / User Feature</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-2 py-0.5 mb-1">Channels</div>
        {channels.map((channel, index) => (
          <motion.div
            key={channel._id}
            className="group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <button
              onClick={() => {
                onSelectChannel(channel._id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 ${activeChannelId === channel._id
                  ? 'bg-[#006239] text-white border border-[#00A870] font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'
                }`}
            >
              <span className="text-xs font-mono">#{channel.name}</span>
            </button>
            {activeChannelId === channel._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="px-3 py-1 text-[11px] text-gray-500 border-l-2 border-[#00A870]/40 ml-1.5 break-words"
              >
                {channel.description}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-3 border-t border-[#374151] text-[10px] text-gray-600 text-center space-y-0.5">
        <div className="flex items-center justify-center gap-1">
          <Shield size={12} />
          <span>Anonymous by Design</span>
        </div>
        <p>v1.0.0</p>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 bg-[#111827] border border-[#374151] text-white rounded-lg shadow-md hover:bg-[#1f2937] transition-colors focus:outline-none"
        >
          <Menu size={18} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#111827] border-r border-[#374151] text-white flex flex-col z-50 md:hidden shadow-2xl h-full"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="hidden md:flex w-64 border-r border-[#374151] bg-[#111827] text-white flex-col h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-[#374151] rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Create New Channel</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-[#1f2937] rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Channel Name</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g., feedback-requests"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
                  <textarea
                    placeholder="What is this channel for?"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 text-xs transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] text-gray-400 font-medium transition-colors text-xs"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 disabled:from-[#374151] disabled:to-[#374151] text-white font-semibold transition-all text-xs"
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}