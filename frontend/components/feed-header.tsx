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
    <div className="sticky top-0 z-20 bg-gradient-to-r from-[#00A870] to-[#006239] hover:to-[#006239]/90 text-white border-b border-[#343536]">
      <div className="h-14 pl-8 pr-4 flex items-center justify-between">

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 text-sm">#</span>

          <h2 className="text-sm font-semibold text-white truncate">
            {channel?.name || "general"}
          </h2>

          {channel?.description && (
            <span className="hidden md:block text-xs text-gray-300 truncate max-w-[250px]">
              · {channel.description}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full hover:bg-[#272729] transition-colors"
            title="Search"
          >
            <Search size={18} className="text-gray-400" />
          </button>

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
    </div>
  );
}