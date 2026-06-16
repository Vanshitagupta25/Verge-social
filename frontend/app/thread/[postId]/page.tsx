'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, Trash2, MoreVertical, Reply, Send, X, Edit3, Check } from 'lucide-react';
import api from '@/app/api/api';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  postId: string;
  parentId: string | null;
  authorId: {
    _id?: string;
    name: string;
    avatarUrl: string;
  };
  color?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  editedOnce?: boolean;
}

interface Post {
  _id: string;
  channelId: string;
  authorId: {
    _id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  color: string;
  createdAt: string;
  content: string;
  commentsCount: number;
  imageUrl?: string;
}

const NestedComment = ({
  comment,
  allComments,
  depth = 0,
  isAdmin,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
}: {
  comment: Comment;
  allComments: Comment[];
  depth?: number;
  currentUserId: string | null;
  isAdmin: boolean;
  onReply: (commentId: string, authorId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => Promise<void>;
}) => {
  const childComments = comment.replies || [];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editLimitUsed, setEditLimitUsed] = useState<Record<string, boolean>>({});

  const indentClass = depth > 0 ? 'ml-6 md:ml-8' : '';
  const borderClass = depth > 0 ? 'border-l-2 border-[#374151] hover:border-[#00A870]/50 pl-4 transition-colors' : '';

  const canEdit = (comment: any) => {
    return isOwner && !comment.editedOnce;
  };
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();

      const len = editText.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const isOwner = currentUserId && comment.authorId?._id ? String(comment.authorId._id) === String(currentUserId) : false;
  console.log("isOwner", isOwner);
  console.log("currentuserId", currentUserId);

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }
    if (comment.editedOnce) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);

    try {
      await onEdit(comment._id, editText);
      comment.editedOnce = true;

      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now.getTime() - past.getTime();

    if (elapsed < msPerMinute) {
      return 'Just now';
    } else if (elapsed < msPerHour) {
      const mins = Math.round(elapsed / msPerMinute);
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (elapsed < msPerDay) {
      const hours = Math.round(elapsed / msPerHour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.round(elapsed / msPerDay);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${indentClass} pb-4`}
    >
      <div className={`${borderClass}`}>
        <div className="flex items-start gap-3 group">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full ${comment.color || "bg-emerald-600"
              } flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}
          >
            {comment.authorId?.avatarUrl ? (
              <img
                src={comment.authorId.avatarUrl}
                alt={comment.authorId.name}
                className="w-full h-full object-cover"
              />
            ) : (
              comment.authorId?.name?.charAt(0).toUpperCase() || "A"
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* HEADER ROW */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-baseline gap-2 truncate">
                <span className="font-mono font-semibold text-white text-sm truncate">
                  {comment.authorId?.name || "Anonymous"}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {getRelativeTime(comment.createdAt)}
                </span>
              </div>

              {(isOwner || isAdmin) && (
                <div
                  className="relative flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setOpenMenu(
                        openMenu === comment._id ? null : comment._id
                      )
                    }
                    className="p-1 text-gray-400 hover:text-white rounded"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenu === comment._id && (
                    <div className="absolute right-0 mt-2 w-32 bg-[#111827] border border-[#374151] rounded-lg shadow-lg z-50 overflow-hidden">

                      {isOwner && !comment.editedOnce && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setEditText(comment.content);
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1f2937]"
                        >
                          Edit
                        </button>
                      )}

                      {(isAdmin || isOwner) && (
                        <button
                          onClick={() => {
                            onDelete(comment._id);
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#1f2937]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CONTENT OR EDIT BOX */}
            {isEditing ? (
              <div className="mt-2 relative">
                {/* INPUT */}
                <input
                  ref={inputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  disabled={isSavingEdit}
                  className="w-full bg-[#1f2937] border border-[#374151] rounded-2xl px-4 py-6 pr-24 text-sm text-white focus:outline-none focus:border-[#00A870]"
                />

                {/* BUTTONS INSIDE INPUT */}
                <div className="absolute bottom-1.5 right-2 flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="px-3 py-1 text-xs bg-[#00A870] text-white rounded-lg hover:bg-[#00A870]/80 disabled:opacity-50"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isSavingEdit}
                    className="px-3 py-1 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-200 mt-2 leading-relaxed break-words">
                {comment.content}
              </p>
            )}

            {/* Reply */}
            <button
              onClick={() =>
                onReply(
                  comment._id,
                  comment.authorId?.name || "Anonymous"
                )
              }
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#00A870] transition-colors"
            >
              <Reply size={12} />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHILD COMMENTS */}
      {childComments.length > 0 && (
        <div className="mt-4">
          {childComments.map((childComment) => (
            <NestedComment
              key={childComment._id}
              comment={childComment}
              allComments={allComments}
              depth={depth + 1}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = userRole === 'admin';
  console.log("isadmin", isAdmin);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.id);
        setUserRole(payload.role);
      } catch (e) {
        console.error("Token parsing error:", e);
      }
    }
  }, []);

  const refreshComments = async () => {
    try {
      const commentsRes = await api.get(`comments/post/${targetId}`);
      const rawComments = commentsRes.data.comments || commentsRes.data.data || commentsRes.data;
      setComments(Array.isArray(rawComments) ? rawComments : []);
    } catch (err) {
      console.error("Error refreshing comments", err);
    }
  };

  useEffect(() => {
    if (!targetId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token found, skipping authenticated post fetch.");
      return;
    }

    const fetchThreadData = async () => {
      setIsLoading(true);
      try {
        const postRes = await api.get(`posts/${targetId}`);
        console.log("post res", postRes.data);
        const fetchedPost: Post = postRes.data;
        setPost(fetchedPost);

        await refreshComments();
      } catch (error) {
        console.error('Error fetching data from API, looking for local fallback:', error);

        const savedPosts = localStorage.getItem('verge_posts');
        const savedComments = localStorage.getItem('verge_comments');

        if (savedPosts) {
          const localPosts: Post[] = JSON.parse(savedPosts);
          const foundPost = localPosts.find(p => p._id === targetId);
          if (foundPost) setPost(foundPost);
        }

        if (savedComments) {
          const allComments: Comment[] = JSON.parse(savedComments);
          const postComments = allComments.filter(c => c.postId === targetId);
          setComments(postComments);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreadData();
  }, [targetId]);

  const handleGoBack = () => {
    router.back();
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !post || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/comments', {
        postId: post._id,
        parentId: replyingTo?.id || null,
        content: replyContent,
      });
      console.log("response", response);

      await refreshComments();
      toast.success('Reply submitted!');
    } catch (error) {
      console.error('API failed to save comment, using local backup state:', error);

      const newComment: Comment = {
        _id: `${post._id}-${Date.now()}`,
        postId: post._id,
        parentId: replyingTo?.id || null,
        authorId: { name: 'Anonymous User' },
        color: 'bg-emerald-600',
        content: replyContent,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString()
      };

      const updatedComments = [...comments, newComment];
      setComments(updatedComments);

      try {
        const savedComments = localStorage.getItem('verge_comments');
        const allComments: Comment[] = savedComments ? JSON.parse(savedComments) : [];
        const otherComments = allComments.filter(c => c.postId !== post._id);
        localStorage.setItem('verge_comments', JSON.stringify([...otherComments, ...updatedComments]));
      } catch (storageError) {
        console.error('Storage update failed:', storageError);
      }
    } finally {
      setReplyContent('');
      setReplyingTo(null);
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    inputRef.current?.focus();
  };

  const handleEditComment = async (
    commentId: string,
    newContent: string,
    alreadyEditedOnce?: boolean
  ) => {
    try {
      if (!newContent.trim()) return;

      if (alreadyEditedOnce) {
        toast.error("You can only edit this comment once");
        return;
      }

      await api.put(`comments/${commentId}`, {
        content: newContent,
      });

      toast.success("Comment updated successfully");
      await refreshComments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update comment");
      throw error;
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    const previousComments = [...comments];

    const filterDeleted = (list: Comment[]): Comment[] => {
      return list
        .filter(c => c._id !== commentId)
        .map(c => {
          if (c.replies) {
            return { ...c, replies: filterDeleted(c.replies) };
          }
          return c;
        });
    };

    const updatedComments = filterDeleted(comments);
    setComments(updatedComments);

    try {
      const savedComments = localStorage.getItem('verge_comments');
      const allComments: Comment[] = savedComments ? JSON.parse(savedComments) : [];
      const otherComments = allComments.filter(c => c.postId !== targetId);
      localStorage.setItem('verge_comments', JSON.stringify([...otherComments, ...updatedComments]));
    } catch (error) {
      console.error('Error deleting comment locally:', error);
    }

    try {
      await api.delete(`comments/${commentId}`);
      toast.success('Comment deleted');
      await refreshComments();
    } catch (error) {
      console.error('API call to delete comment failed:', error);
      toast.error('Failed to delete comment');
      setComments(previousComments);
    }
  };

  const rootComments = Array.isArray(comments) && post?._id
    ? comments.filter(c => c && c.postId && String(c.postId) === String(post._id))
    : [];

  if (isLoading || !post) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00A870] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading thread...</p>
        </div>
      </div>
    );
  }

  const getRelativeTime = (dateString: string): string => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now.getTime() - past.getTime();

    if (elapsed < msPerMinute) {
      return 'Just now';
    } else if (elapsed < msPerHour) {
      const mins = Math.round(elapsed / msPerMinute);
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (elapsed < msPerDay) {
      const hours = Math.round(elapsed / msPerHour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.round(elapsed / msPerDay);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  }; 7


  return (
    <div className="min-h-screen bg-[#111827] text-gray-100">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-[#111827]/95 backdrop-blur-sm border-b border-[#374151]"
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-white">Thread</h1>
            <p className="text-xs text-gray-500">{rootComments.length} replies</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f2937] rounded-xl border border-[#374151] overflow-hidden mb-6"
        >
          <div className="p-4 md:p-6">
            <div className="flex gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full ${post.color || "bg-blue-600"
                      } flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                  >
                    {post?.authorId?.avatarUrl ? (
                      <img
                        src={post.authorId.avatarUrl}
                        alt={post.authorId.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      post?.authorId?.name?.charAt(0).toUpperCase() || "A"
                    )}
                  </div>
                  <div>
                    <span className="font-mono font-semibold text-white">{post?.authorId?.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-500 ml-2">{post?.createdAt ? getRelativeTime(post.createdAt) : ''}</span>
                  </div>
                </div>

                <p className="text-gray-200 leading-relaxed mb-4">{post.content}</p>

                {post.imageUrl && (
                  <div className="mb-4 w-full rounded-xl overflow-hidden bg-[#111827]">
                    <img
                      src={post.imageUrl}
                      alt="Post media"
                      className="mb-4 w-full rounded-xl overflow-hidden bg-[#111827]"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error("Cloudinary image failed to load:", post.imageUrl);
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#00A870]">
                  <MessageCircle size={14} />
                  <span>
                    {post?.commentsCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        <section className="mb-32">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={18} className="text-[#00A870]" />
            <h2 className="text-sm font-semibold text-white">Replies ({rootComments.length})</h2>
          </div>

          {rootComments.length > 0 ? (
            <div className="space-y-4">
              {rootComments.map((comment) => (
                <NestedComment
                  key={comment._id}
                  comment={comment}
                  allComments={comments}
                  depth={0}
                  isAdmin={isAdmin}
                  onReply={handleReplyToComment}
                  onDelete={handleDeleteComment}
                  onEdit={handleEditComment}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1f2937] rounded-xl border border-[#374151]">
              <MessageCircle size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-400">No replies yet. Start the conversation!</p>
            </div>
          )}
        </section>
      </main>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-[#374151] p-4"
      >
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#1f2937] px-3 py-2 rounded-lg flex items-center justify-between text-xs border border-[#374151]"
              >
                <span className="text-gray-400">
                  Replying to <strong className="text-[#00A870]">@{replyingTo.author}</strong>
                </span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.author}...` : "Add a reply..."}
              className="flex-1 min-h-12 max-h-32 px-4 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 resize-none"
              rows={1}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReply}
              disabled={!replyContent.trim() || isSubmitting}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 disabled:from-[#374151] disabled:to-[#374151] disabled:cursor-not-allowed text-white font-semibold transition-all"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}