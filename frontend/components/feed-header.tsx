import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import ProfileToggle from './profile-toggle';

interface FeedHeaderProps {
  channel?: {
    name: string;
    description?: string;
  };
  currentUser: any;
  onOpenSearch: () => void;
  onUpdateUsername: (username: string) => void;
  onUpdateAvatar: (avatar: string) => void;
  onLogout: () => void;
}

export function FeedHeader({
  channel,
  currentUser,
  onOpenSearch,
  onUpdateUsername,
  onUpdateAvatar,
  onLogout,
}: FeedHeaderProps) {
  return (
    <div className="px-4 md:px-6 py-4 border-b border-[#374151] bg-[#006239] sticky top-0 z-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="sticky top-0 z-10 bg-[#111827]/95 backdrop-blur px-4 md:px-6 py-3 border-b border-[#374151]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pl-4 md:pl-0">
            <div className="w-8 h-8 rounded-full border border-[#00A870] flex items-center justify-center flex-shrink-0">
              <span className="text-[#00A870] text-sm font-bold">#</span>
            </div>

            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-white truncate">
                {channel?.name || "general"}
              </h2>

              {channel?.description && (
                <p className="text-xs text-gray-400 truncate">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSearch}
              className="p-2 rounded-full hover:border-[#00A870] hover:bg-[#00A870]/10 transition-colors"
              title="Search"
            >
              <Search size={18} className="text-gray-300" />
            </motion.button>

            {currentUser && (
              <ProfileToggle
                currentUser={currentUser}
                onUpdateUsername={onUpdateUsername}
                onUpdateAvatar={onUpdateAvatar}
                onLogout={onLogout}
              />
            )}
          </div>
        </div>
      </motion.div>

    </div>

  );
}