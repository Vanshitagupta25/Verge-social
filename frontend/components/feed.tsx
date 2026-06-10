'use client'
import { MessageCircle, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Post, Comment, Channel, User } from '@/app/page';
import ProfileToggle from './profile-toggle';
import AuthScreen from '@/components/auth-screen';
import ImageLightbox, { type ImageMetrics } from '@/components/image-lightbox';
import api from '@/app/api/api'
import { toast } from 'react-hot-toast';
import { DeleteModal } from './DeleteModal';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

interface FeedProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  comments: Comment[];
  channel?: Channel;
  activeChannelId: string | null;
  onCreatePost: (newPost: any) => void;
  onDeletePost: (id: string) => Promise<void>;
  onAddComment: (id: string, content: string, parentId: string | null) => Promise<void>;
  onDeleteComment: (commentId: number, postId: string) => Promise<void>;
  currentUser: User | null;
  isAuthenticated: boolean;
  onAuthenticate: (user: User, token: string) => Promise<void>;
  onLogout: () => void;
  onUpdateUsername: (newUsername: string) => void;
  onUpdateAvatar: (avatarImage: string) => void;
  onOpenSearch: () => void;
}
export default function Feed({
  posts,
  setPosts,
  comments,
  activeChannelId,
  currentUser,
  channel,
  isAuthenticated,
  onAuthenticate,
  onLogout,
  onCreatePost,
  onUpdateUsername,
  onUpdateAvatar,
  onOpenSearch,
}: FeedProps) {
  const router = useRouter();
  const [postMetrics, setPostMetrics] = useState<Record<string, { upvotesCount: number; downvotesCount: number; comments: number }>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [lightboxImage, setLightboxImage] = useState<{ url: string; postId: string; metrics: ImageMetrics; } | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<Record<string, boolean>>({});
  const [userDownvotes, setUserDownvotes] = useState<Record<string, boolean>>({});

  const metrics = lightboxImage?.postId
    ? postMetrics[lightboxImage.postId]
    : undefined;
  const fetchPosts = useCallback(
    async (currentCursor?: string, isChannelSwitch = false) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!isAuthenticated || !token || token === 'null' || token === 'undefined') {
        return;
      }

      if (loading && !isChannelSwitch) return;
      console.log("fetch posts trigger", activeChannelId, "Is Switch:", isChannelSwitch);

      setLoading(true);

      try {
        let url = `/posts?limit=5`;

        if (activeChannelId && activeChannelId !== 'null' && activeChannelId !== 'undefined') {
          url += `&channelId=${activeChannelId}`;
        }

        if (currentCursor) {
          url += `&cursor=${currentCursor}`;
        }
        console.log("url", url);

        const response = await api.get(url);
        const { data, meta } = response.data;
        const nextCursor = meta?.nextCursor;
        const backendHasMore = meta?.hasNextPage ?? false;

        const formattedPosts = data.map((post: any) => ({
          ...post,
          _id: post._id,
          id: post._id
        }));

        setPosts((prev) => {
          if (!currentCursor || isChannelSwitch) {
            return formattedPosts;
          }

          const existingIds = new Set(prev.map((p) => p._id));
          const newPosts = formattedPosts.filter(
            (p: any) => !existingIds.has(p._id)
          );

          return [...prev, ...newPosts];
        });

        setCursor(nextCursor);
        setHasMore(backendHasMore);
      } catch (err) {
        console.error("Fetch posts execution error", err);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [activeChannelId, setPosts, isAuthenticated, loading]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    setCursor(undefined);
    setHasMore(true);
    fetchPosts(undefined, true);
  }, [activeChannelId, isAuthenticated]);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          cursor
        ) {
          fetchPosts(cursor);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, hasMore, cursor, fetchPosts]
  );

  useEffect(() => {
  }, [posts]);

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  useEffect(() => {
    const initialMetrics: Record<string, { upvotesCount: number; downvotesCount: number; comments: number }> = {};

    posts.forEach((post) => {
      initialMetrics[post._id] = {
        upvotesCount: post.upvotesCount ?? 0,
        downvotesCount: post.downvotesCount ?? 0,
        comments: post.commentsCount || 0,
      };
    });

    setPostMetrics(initialMetrics);
  }, [posts]);

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={onAuthenticate} />;
  }

  const handleUpvote = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    const isAlreadyUpvoted = !!userUpvotes[postId];
    const upvoteDelta = isAlreadyUpvoted ? -1 : 1;

    setUserUpvotes((prev) => ({ ...prev, [postId]: !isAlreadyUpvoted }));

    const previousMetrics = { ...postMetrics };
    setPostMetrics((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        upvotesCount: Math.max(0, (prev[postId]?.upvotesCount || 0) + upvoteDelta),
        downvotesCount: prev[postId]?.downvotesCount || 0,
        comments: prev[postId]?.comments || 0,
      },
    }));

    try {
      await api.post(`votes/${postId}/upvote`);
    } catch (err) {
      console.error(err);
      setPostMetrics(previousMetrics);
      setUserUpvotes((prev) => ({ ...prev, [postId]: isAlreadyUpvoted }));
      toast.error('Failed to register upvote');
    }
  };

  const handleDownvote = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    const isAlreadyDownvoted = !!userDownvotes[postId];
    const downvoteDelta = isAlreadyDownvoted ? -1 : 1;

    setUserDownvotes((prev) => ({ ...prev, [postId]: !isAlreadyDownvoted }));

    const previousMetrics = { ...postMetrics };
    setPostMetrics((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        upvotesCount: prev[postId]?.upvotesCount || 0,
        downvotesCount: Math.max(0, (prev[postId]?.downvotesCount || 0) + downvoteDelta),
        comments: prev[postId]?.comments || 0,
      },
    }));

    try {
      await api.post(`votes/${postId}/downvote`);
    } catch (err) {
      console.error(err);
      setPostMetrics(previousMetrics);
      setUserDownvotes((prev) => ({ ...prev, [postId]: isAlreadyDownvoted }));
      toast.error('Failed to register downvote');
    }
  };
  const toggleExpand = (
    e: React.MouseEvent,
    postId: string
  ) => {
    e.stopPropagation();
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const openLightbox = (
    e: React.MouseEvent,
    post: Post
  ) => {
    e.stopPropagation();
    if (post.imageUrl) {
      setLightboxImage({
        url: post.imageUrl,
        postId: post._id,
        metrics: {
          comments: getCommentCount(post._id),
          upvotesCounts: getUpvoteCount(post._id),
          downvotesCounts: getDownvoteCount(post._id),
        },
      });
    }
  };
  const navigateToThread = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    localStorage.setItem('verge_posts', JSON.stringify(posts));
    localStorage.setItem('verge_comments', JSON.stringify(comments));

    router.push(`/thread/${postId}`);
  };

  const getCommentCount = (postId: string) => {
    return comments.filter(c => c.postId === postId && c.parentId === null).length;
  };
  const getUpvoteCount = (postId: string) => {
    return postMetrics[postId]?.upvotesCount || 0;
  };

  const getDownvoteCount = (postId: string) => {
    return postMetrics[postId]?.downvotesCount || 0;
  };
  const handleDeleteClick = (e: React.MouseEvent, _id: string) => {
    e.stopPropagation();
    setPostToDelete(_id);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        throw new Error('Token missing');
      }
      console.log("checking token", token);
      const response = await axios.delete(`http://localhost:8000/posts/${postToDelete}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {

          token: token
        }

      });
      console.log("response for delt url", response);

      if (response.status === 200 || response.data?.success) {
        setPosts((prevPosts) => prevPosts.filter((item) => item._id !== postToDelete));

        toast.success('Post Deleted Successfully');
        setIsDeleteModalOpen(false);
        setPostToDelete(null);

        router.push('/');
      }
    } catch (error) {
      console.error("Deletion request failed:", error);
      toast.success('Post Deleted Successfully');
    } finally {
      setLoading(false);
    }
  };
  const resolveImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // This is the fallback for your legacy/broken database records
    return `https://res.cloudinary.com/dytms6dh7/image/upload/posts/${url.replace(/^\//, '')}`;
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    },
  }
  const TEXT_TRUNCATE_LIMIT = 180;

  const shouldTruncate = (content?: string) => {
    if (!content) return false;
    return content.length > TEXT_TRUNCATE_LIMIT;
  };
  const getTruncatedContent = (content?: string) => {
    if (!content) return '';

    return content.slice(0, TEXT_TRUNCATE_LIMIT) + '...';
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
    } else if (elapsed < msPerHour * 24) {
      const hours = Math.round(elapsed / msPerHour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.round(elapsed / msPerDay);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };
  return (
    <div className="flex-1 h-screen flex flex-col bg-[#111827]">
      {/* Feed Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 md:px-6 py-4 border-b border-[#374151] bg-[#006239] sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          {/* Left */}
          <div>
            <h2 className="text-lg font-bold text-white">
              #{channel?.name || 'general'}
            </h2>
            <p className="text-xs text-white/70 mt-1">
              {channel?.description || 'Discussions'}
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSearch}
              className="p-2 transition-colors"
              title="Search"
            >
              <Search size={18} className="text-white/80 hover:text-white" />
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

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-auto py-3 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-3 px-3 md:px-5 max-w-xl">
          {posts.map((post, i) => {
            const postKey = post._id && post._id !== "" ? post._id : `new-post-fallback-${i}-${Date.now()}`;

            const imageSrc = resolveImageUrl(post.imageUrl);

            const postAuthorIdStr = post.authorId && typeof post.authorId === 'object'
              ? post.authorId._id
              : post.authorId;

            const currentUserIdStr = currentUser?._id;

            const authorName = postAuthorIdStr && currentUserIdStr && postAuthorIdStr === currentUserIdStr
              ? (currentUser.name || currentUser.username)
              : (post.authorId && typeof post.authorId === 'object' ? post.authorId.name : (post.author || 'Anonymous'));

            const canDelete =
              currentUser?.role === 'admin' ||
              (postAuthorIdStr && currentUserIdStr && postAuthorIdStr === currentUserIdStr);

            return (
              <div
                ref={i === posts.length - 1 ? lastPostRef : null}
                key={postKey}
                className="p-4 md:p-6 hover:bg-transparent border-b border-[#2d3748] rounded-none cursor-pointer group"
              >
                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-3 mb-3 justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${post.color || 'bg-emerald-600'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {authorName ? authorName.charAt(0).toUpperCase() : 'P'}
                      </div>

                      <span className="font-mono font-semibold text-white text-sm">
                        {authorName}
                      </span>

                      <span className="text-xs text-gray-500">
                        · {getRelativeTime(post.createdAt || '')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canDelete}
                      onClick={(e) => handleDeleteClick(e, post._id)}
                      className={`p-1.5 transition-all duration-200 rounded-lg ${canDelete
                        ? 'text-red-400 opacity-100 hover:bg-red-500/10 cursor-pointer'
                        : 'text-gray-600 opacity-30 cursor-not-allowed'
                        }`}
                      title={canDelete ? "Delete Post" : "You do not have permission to delete this post"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {shouldTruncate(post.content || '') && !expandedPosts[post._id]
                        ? getTruncatedContent(post.content || '')
                        : post.content}
                    </p>

                    {shouldTruncate(post.content || '') && (
                      <button
                        onClick={(e) => toggleExpand(e, post._id)}
                        className="mt-2 text-sm font-medium text-[#00A870]"
                      >
                        {expandedPosts[post._id] ? 'Read Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                  {imageSrc && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(e, { ...post, imageUrl: imageSrc });
                      }}
                      className="mb-4 w-fit max-w-[520px] rounded-xl overflow-hidden bg-[#374151] cursor-pointer"
                    >
                      <img
                        src={imageSrc}
                        alt="Post media"
                        className="w-full h-[320px] object-cover"
                        onError={(e) => {
                          console.log("Image load failed, URL was:", imageSrc);
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-4 md:gap-6 pt-1 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <button
                        onClick={(e) => handleUpvote(e, post._id)}
                        className={`p-1.5 rounded-lg transition-colors ${userUpvotes[post._id]
                          ? 'bg-[#00A870]/30 text-[#00A870]'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                          }`}
                      >
                        <ChevronUp size={18} />
                      </button>
                      <span className={userUpvotes[post._id] ? 'text-[#00A870]' : ''}>
                        {getUpvoteCount(post._id)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400">
                      <button
                        onClick={(e) => handleDownvote(e, post._id)}
                        className={`p-1.5 rounded-lg transition-colors ${userDownvotes[post._id]
                          ? 'bg-red-500/30 text-red-400'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                          }`}
                      >
                        <ChevronDown size={18} />
                      </button>
                      <span className={userDownvotes[post._id] ? 'text-red-400' : ''}>
                        {getDownvoteCount(post._id)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => navigateToThread(e, post._id)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span>{post?.commentsCount ?? 0}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ImageLightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        postId={lightboxImage?.postId}

        imageUrl={
          lightboxImage?.url
            ? lightboxImage.url.startsWith('http')
              ? lightboxImage.url
              : `https://res.cloudinary.com/dbq123abc/image/upload/posts/${lightboxImage.url.replace(/^\//, '')}`
            : null
        }
        metrics={lightboxImage?.metrics}
      />
      <div className="bg-[#111827] text-white">
        <DeleteModal
          isOpen={isDeleteModalOpen}
          isLoading={loading}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setPostToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title={
            currentUser?.role === 'admin'
              ? "Admin: Delete Post?"
              : "Delete Post?"
          }
          description="Are you sure you want to permanently delete this post from the platform? This action cannot be undone."
        />
      </div>
    </div>
  );
}
