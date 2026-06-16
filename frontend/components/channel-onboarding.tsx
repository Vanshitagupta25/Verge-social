'use client';

import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Channel } from '@/app/page';

interface ChannelOnboardingProps {
  channels: Channel[];
  joinedChannelIds: string[];
  onJoinChannel: (channelId: string) => void;
  onComplete: () => void;
}

export default function ChannelOnboarding({
  channels,
  joinedChannelIds,
  onJoinChannel,
  onComplete,
}: ChannelOnboardingProps) {
  const allJoined = channels.length > 0 && joinedChannelIds.length === channels.length;

  const handleJoinAll = async () => {
    const unjoinedChannels = channels.filter(
      (channel) => !joinedChannelIds.includes(channel._id)
    );

    if (unjoinedChannels.length === 0) return;

    unjoinedChannels.forEach((channel) => {
      onJoinChannel(channel._id);
    });
  };

  const VergeLogoSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <path d="M4 4H9L14 15L19 4H24L16.5 20.5H11.5L4 4Z" fill="currentColor" />
      <path d="M10.5 4H13.5L8.5 15H5.5L10.5 4Z" fill="currentColor" opacity="0.4" />
    </svg>
  );

  return (
    <div className="min-h-screen w-full bg-[#111827] text-white flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-4xl bg-[#111827] rounded-xl p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8 shadow-2xl"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-white mb-1">
            <VergeLogoSVG />
            <span className="text-base sm:text-lg font-extrabold tracking-tight">Verge</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Welcome to Verge</h2>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">Join channels to start sharing feedback with your team</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-h-[50vh] sm:max-h-none overflow-y-scroll sm:overflow-visible [&::-webkit-scrollbar]:none [-ms-overflow-style:none] [scrollbar-width:none]">
          {channels.map((channel, index) => {
            const isJoined = joinedChannelIds.includes(channel._id);

            return (
              <motion.div
                key={channel._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative flex flex-col justify-between rounded-lg border border-[#374151] bg-[#1f2937] hover:border-[#00A870] transition-all duration-200 p-4 sm:p-5 min-h-[170px] h-full"
              >
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm sm:text-base break-words">#{channel.name}</h3>
                  <textarea
                    value={channel.description || ""}
                    readOnly
                    rows={4}
                    className="w-full bg-transparent text-[11px] sm:text-xs text-gray-400 leading-relaxed resize-none focus:outline-none border-none overflow-hidden"
                  />
                </div>

                <motion.button
                  whileHover={!isJoined ? { scale: 1.02 } : {}}
                  whileTap={!isJoined ? { scale: 0.98 } : {}}
                  onClick={() => onJoinChannel(channel._id)}
                  disabled={isJoined}
                  className={`mt-4 w-full h-9 sm:h-10 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 ${isJoined
                    ? 'bg-[#00A870]/20 text-[#00A870] cursor-default'
                    : 'bg-[#00A870] hover:bg-[#00A870]/90 text-white shadow-md'
                    }`}
                >
                  {isJoined ? (
                    <>
                      <span>Joined</span>
                      <Check size={14} className="shrink-0" />
                    </>
                  ) : (
                    <>
                      <span>Join Channel</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6 border-t border-[#374151]">
          <button
            onClick={onComplete}
            className="text-gray-500 hover:text-white text-xs sm:text-sm font-medium transition-colors py-2 order-2 sm:order-1"
          >
            Skip Onboarding
          </button>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <motion.button
              whileHover={!allJoined ? { scale: 1.02 } : {}}
              whileTap={!allJoined ? { scale: 0.98 } : {}}
              onClick={handleJoinAll}
              disabled={allJoined}
              className={`h-10 sm:h-11 px-5 rounded-lg font-semibold transition-all text-xs sm:text-sm w-full sm:w-auto text-center ${allJoined
                ? 'bg-[#374151] text-gray-500 cursor-not-allowed'
                : 'bg-[#1f2937] hover:bg-[#374151] text-white border border-[#374151]'
                }`}
            >
              {allJoined ? 'All Joined' : 'Join All Channels'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onComplete}
              className="h-10 sm:h-11 px-5 rounded-lg font-semibold transition-all text-xs sm:text-sm bg-[#00A870] hover:bg-[#00A870]/90 text-white shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>Continue to Feed</span>
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}