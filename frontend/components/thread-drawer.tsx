'use client';

import { X, MessageCircle, Trash2, Reply, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Post, Comment } from '@/app/page';

interface ThreadDrawerProps {
  post: Post;
  comments: Comment[];
  isAdmin: boolean;
  onClose: () => void;
  onAddComment: (postId: string, content: string, parentId: string | null) => void;
  onDeleteComment: (commentId: string) => void;
  onHideCreatePost?: (hide: boolean) => void;
}

const NestedComment = ({
  comment,
  allComments,
  depth = 0,
  isAdmin,
  onReply,
  onDelete,
}: {
  comment: Comment;
  allComments: Comment[];
  depth?: number;
  isAdmin: boolean;
  onReply: (commentId: string, author: string) => void;
  onDelete: (commentId: string) => void;
}) => {
  const childComments = allComments.filter(c => c.parentId === comment.id);
  const indentClass = depth > 0 ? 'ml-8' : '';
  const borderClass = depth > 0 ? 'border-l-2 border-white/30 hover:border-[#00A870]/50 pl-4 transition-colors' : '';

  return (
    <div className={`${indentClass} pb-6`}>
      <div className={`${borderClass}`}>
        {/* Comment Header */}
        <div className="flex items-start gap-3 group">
          <div className={`w-8 h-8 rounded-full ${comment.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {/* {comment.authorId.name.charAt(0)} */}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 justify-between">
              <div className="flex items-baseline gap-2">
                {/* <span className="font-mono font-semibold text-white bg-amber-400 text-sm">{comment.authorId?.name}</span> */}
                <span className="text-xs text-white/50">{comment.timestamp}</span>
              </div>
              {isAdmin && (
                <button onClick={() => onDelete(comment.id)} className="p-1 text-red-300 transition-all">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Comment Content */}
            <p className="text-sm text-white/90 mt-2 leading-relaxed break-words">{comment.content}</p>

            {/* Reply Button - passes comment id and author for targeting */}
            <button
              onClick={() => onReply(comment.id, comment.author)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-[#00A870] transition-colors"
            >
              <Reply size={12} />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {childComments.length > 0 && (
        <div className="mt-4">
          {childComments.map((childComment) => (
            <NestedComment
              key={childComment.id}
              comment={childComment}
              allComments={allComments}
              depth={depth + 1}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ThreadDrawer({
  post,
  comments,
  isAdmin,
  onClose,
  onAddComment,
  onDeleteComment,
  onHideCreatePost,
}: ThreadDrawerProps) {
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hasScrolledIntoComments, setHasScrolledIntoComments] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentsStartRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const rootComments = comments.filter(c => c.parentId === null);

  // Scroll-spy logic: hide Create Post button when scrolled into comment zone
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const commentsStart = commentsStartRef.current;

    if (!scrollContainer || !commentsStart) return;

    const handleScroll = () => {
      const commentsRect = commentsStart.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Check if comments section is in view (user has scrolled into comment zone)
      const isInCommentZone = commentsRect.top < containerRect.top + 100;
      
      if (isInCommentZone !== hasScrolledIntoComments) {
        setHasScrolledIntoComments(isInCommentZone);
        if (onHideCreatePost) {
          onHideCreatePost(isInCommentZone);
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasScrolledIntoComments, onHideCreatePost]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (onHideCreatePost) {
      onHideCreatePost(true);
    }
  };

  const handleInputBlur = () => {
    if (!replyContent.trim()) {
      setIsInputFocused(false);
      // Only show Create Post if not scrolled into comments
      if (onHideCreatePost && !hasScrolledIntoComments) {
        onHideCreatePost(false);
      }
    }
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      onAddComment(post._id, replyContent, replyingTo?.id || null);
      setReplyContent('');
      setReplyingTo(null);
      setIsInputFocused(false);
      if (onHideCreatePost && !hasScrolledIntoComments) {
        onHideCreatePost(false);
      }
    }
  };

  const handleReplyToComment = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    // Focus the input when replying
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyContent('');
    setReplyingTo(null);
    setIsInputFocused(false);
    if (onHideCreatePost && !hasScrolledIntoComments) {
      onHideCreatePost(false);
    }
  };

  return (
    <div className="w-96 border-l border-[#00845C] bg-[#006239] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#00845C] flex items-center justify-between bg-[#0a0a0a] backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 text-white font-semibold">
          <MessageCircle size={18} />
          <span>Thread</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

     
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Parent Post - Pinned */}
        <div className="px-6 py-5 border-b border-[#00845C]/50 bg-[#0a0a0a] sticky top-0 z-5">
          <div className="mb-3">
            <span className="text-xs font-bold text-[#00A870] uppercase tracking-wider">Parent Post</span>
          </div>

          <div className="flex items-start gap-3 group">
            <div className={`w-8 h-8 rounded-full ${post.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {post.author.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 justify-between">
                <div className="flex items-baseline gap-2">
                  {/* <span className="font-mono font-semibold text-white text-sm">{post.authorId?.name}</span>
                  <span className="text-xs text-white/50">{post.createdAt}</span> */}
                </div>
              </div>

              {/* Post Image in Thread */}
              {post.imageUrl && (
                <div className="mt-3 w-full h-40 rounded-xl overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt="Post media"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section - marker for scroll-spy */}
        <div ref={commentsStartRef} className="px-6 py-6">
          {rootComments.length > 0 ? (
            <div className="space-y-4">
              {rootComments.map((comment) => (
                <NestedComment
                  key={comment.id}
                  comment={comment}
                  allComments={comments}
                  depth={0}
                  isAdmin={isAdmin}
                  onReply={handleReplyToComment}
                  onDelete={onDeleteComment}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle size={32} className="mx-auto mb-3 text-white/30" />
              <p className="text-sm text-white/60">No replies yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Input */}
      <div className="px-6 py-5 border-t border-[#00845C] bg-[#0a0a0a] backdrop-blur-sm space-y-3">
        {replyingTo && (
          <div className="bg-[#1a1a1a] px-3 py-2 rounded-lg flex items-center justify-between text-xs border border-[#333]">
            <span className="text-white/70">Replying to <strong className="text-[#00A870]">@{replyingTo.author}</strong></span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={replyingTo ? `Reply to @${replyingTo.author}...` : "Reply anonymously to this thread..."}
          className="w-full min-h-16 px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 focus:border-transparent resize-none transition-all"
        />

        <div className="flex gap-2">
          <button
            onClick={handleCancelReply}
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 font-medium transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleReply}
            disabled={!replyContent.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 disabled:from-[#4A7A66] disabled:to-[#4A7A66] disabled:cursor-not-allowed text-white font-semibold transition-all text-xs"
          >
            <Send size={14} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
