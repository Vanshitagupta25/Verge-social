'use client'
import { MessageCircle, ArrowBigDown, ArrowBigUp, MoreHorizontal } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import type { Post, Comment, Channel, User } from '@/app/page';
import AuthScreen from '@/components/auth-screen';
import ImageLightbox, { type ImageMetrics } from '@/components/image-lightbox';
import api from '@/app/api/api'
import { toast } from 'react-hot-toast';
import { FeedHeader } from './feed-header';
import { DeleteModal } from './DeleteModal';
import axios from 'axios';

interface FeedProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  comments: Comment[];
  channel?: Channel;
  activeChannelId: string | null;
  onCreatePost: (newPost: any) => void;
  onDeletePost: (id: string) => Promise<void>;
  onUpdatePost: (id: string, content: string,) => Promise<void>;
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
  onUpdatePost,
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const metrics = lightboxImage?.postId
    ? postMetrics[lightboxImage.postId]
    : undefined;

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = useCallback(
    async (currentCursor?: string, isChannelSwitch = false) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!isAuthenticated || !token || token === 'null' || token === 'undefined') {
        return;
      }
      if (loading && !isChannelSwitch) return;

      setLoading(true);

      try {
        let url = `/posts?limit=5`;

        if (activeChannelId && activeChannelId !== 'null' && activeChannelId !== 'undefined') {
          url += `&channelId=${activeChannelId}`;
        }
        if (currentCursor) {
          url += `&cursor=${currentCursor}`;
        }
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
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openMenu]);

  useEffect(() => {
    if (editingPostId && editInputRef.current) {
      editInputRef.current.focus()

      const len = editText.length;
      editInputRef.current.setSelectionRange(len, len)

      const textarea = editInputRef.current;

      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [editingPostId]);

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

    try {
      const { data } = await api.post(`votes/${postId}/upvote`);
      console.log('Vote response:', data);
      setPostMetrics((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          upvotesCount: data.upvotesCount,
          downvotesCount: data.downvotesCount,
        },
      }))
      setUserUpvotes((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }));

      setUserDownvotes((prev) => ({
        ...prev,
        [postId]: false,
      }));

    } catch (err) {
      console.error(err);
      toast.error('Failed to register upvote');
    }
  };

  const handleDownvote = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    try {
      const { data } = await api.post(`votes/${postId}/downvote`);
      console.log('Vote response:', data);
      setPostMetrics((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          upvotesCount: data.upvotesCount,
          downvotesCount: data.downvotesCount,
        },
      }))
      setUserDownvotes((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }));

      setUserUpvotes((prev) => ({
        ...prev,
        [postId]: false,
      }));
    } catch (err) {
      console.error(err);
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
  const handleEditCLick = async (e: React.MouseEvent, _id: string, post: Post) => {
    e.stopPropagation();
    setEditingPostId(_id);
    setEditText(post.content);
    setOpenMenu(null);
  }
  const handleDeleteClick = (e: React.MouseEvent, _id: string) => {
    e.stopPropagation();
    setPostToDelete(_id);
    setIsDeleteModalOpen(true);
    setOpenMenu(null);
  };
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    const id = postToDelete;

    setIsDeleteModalOpen(false);
    setPostToDelete(null);

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        throw new Error('Token missing');
      }
      const response = await axios.delete(
        `https://instant-plsl.onrender.com/posts/${id}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.data?.success) {
        setPosts(prevPosts =>
          prevPosts.filter(item => item._id !== id)
        );

        toast.success('Post Deleted Successfully');
        router.push('/');
      }
    } catch (error) {
      console.error('Deletion request failed:', error);
      toast.error('Failed to delete post');
    } finally {
      setLoading(false);
    }
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
  const handleSaveEdit = async (postId: string, content: string) => {
    if (!editText.trim() || editText === content) {
      setIsUpdating(false);
      return;
    }
    setIsUpdating(true);

    try {
      await onUpdatePost(postId, editText);

    setIsUpdating(false);
    setEditingPostId(null);
    setEditText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
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
      <FeedHeader
        channel={channel}
        currentUser={currentUser}
        onOpenSearch={onOpenSearch}
        onUpdateUsername={onUpdateUsername}
        onUpdateAvatar={onUpdateAvatar}
        onLogout={onLogout}
      />

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={menuRef}>
        <div className="px-2 md:px-4">
          {posts.map((post, i) => {
            const postKey =
              post._id && post._id === ""
                ? post._id
                : `new-post-fallback-${i}`;

            const imageSrc = post.imageUrl;


            const isOwner =
              currentUser && post.authorId?._id
                ? String(post.authorId?._id) === String(currentUser)
                : false;
            console.log("isowner", isOwner)


            const isAdmin = userRole === "admin";
            console.log("isadmin", isAdmin);

            const postAuthorIdStr =
              post.authorId && typeof post.authorId === "object"
                ? post.authorId._id
                : post.authorId;

            const currentUserIdStr = currentUser?._id;

            const authorName =
              postAuthorIdStr &&
                currentUserIdStr &&
                postAuthorIdStr === currentUserIdStr
                ? currentUser.username
                : post.authorId && typeof post.authorId === "object"
                  ? post.authorId.name
                  : post.author || "Anonymous";

            const authorAvatar =
              post.authorId && typeof post.authorId === "object"
                ? post.authorId.avatarUrl
                : null;

            return (
              <div
                ref={i === posts.length - 1 ? lastPostRef : null}
                key={postKey}
                onClick={(e) =>{
                  if(editingPostId === post._id) return;
                  navigateToThread(e, post._id);
                }}
                className="px-3 py-2 border-b border-[#2d3748] cursor-pointer"
              >
                <div className="flex-1 min-w-0">

                  {/* Author Row */}
                  <div className="flex items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">

                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full ${post.color || "bg-emerald-600"
                            } flex items-center justify-center text-white text-xs font-bold`}
                        >
                          {authorName?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="font-medium text-white text-sm">
                        {authorName}
                      </span>

                      <span className="text-xs text-gray-500">
                        {getRelativeTime(post.createdAt || "")}
                      </span>
                    </div>
                    <div
                      className="relative ml-auto"
                      
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(
                            openMenu === post._id
                              ? null
                              : post._id
                          );
                        }}
                        className="p-1 text-gray-500 hover:text-white"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenu === post._id && (
                        <div className="absolute right-0 top-full mt-1 w-28 bg-black border border-gray-700 rounded-md shadow-xl z-[9999]">

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCLick(e, post._id, post);
                            }}
                            className="block w-full text-left px-3 py-2 text-white hover:bg-gray-800"
                          >
                            Edit
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(e, post._id);
                            }}
                            className="block w-full text-left px-3 py-2 text-red-400 hover:bg-gray-800"
                          >
                            Delete
                          </button>

                        </div>
                      )}
                    </div>
                  </div>
                  {editingPostId === post._id ? (
                    <div className="mt-2 relative">
                      <textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        disabled={isUpdating}
                        className="w-full  border border-[#374151] rounded-2xl px-3 py-4 pr-24 text-sm text-white focus:outline-none focus:border-[#374151]
                        resize-none overflow-hidden"
                      />
                      <div className="bottom-1.5 right-2 flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(post._id, post.content)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs bg-[#00A870] text-white rounded-lg hover:bg-[#00A870]/80 disabled:opacity-50"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setIsUpdating(false)
                            setEditingPostId(null)
                            setEditText('');
                          }}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-1">
                      <p className="text-sm text-gray-200 leading-5 whitespace-pre-wrap">
                        {shouldTruncate(post.content || "") &&
                          !expandedPosts[post._id]
                          ? getTruncatedContent(post.content || "")
                          : post.content}
                      </p>

                      {shouldTruncate(post.content || "") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(e, post._id);
                          }}
                          className="mt-1 text-sm font-medium text-[#00A870]"
                        >
                          {expandedPosts[post._id]
                            ? "Read Less"
                            : "Read More"}
                        </button>
                      )}
                    </div>

                  )}


                  {imageSrc && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(e, {
                          ...post,
                          imageUrl: imageSrc,
                        });
                      }}
                      className="mt-1 mb-2 w-full max-w-[520px] rounded-lg overflow-hidden bg-[#374151] cursor-pointer"
                    >
                      <img
                        src={imageSrc}
                        alt="Post media"
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="flex items-center gap-2 text-xs font-medium">

                    <div
                      className={`flex items-center border rounded-full mt-2 px-1 py-[2px]
                ${userUpvotes[post._id]
                          ? "bg-red-500 border-red-500 text-white"
                          : userDownvotes[post._id]
                            ? "bg-[#006239] text-white"
                            : "bg-gray-800 border-gray-700 text-gray-400"
                        }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(e, post._id);
                        }}
                        className="p-0.5 rounded-full"
                      >
                        <ArrowBigUp
                          size={18}
                          fill={
                            userUpvotes[post._id]
                              ? "currentColor"
                              : "none"
                          }
                          strokeWidth={2}
                        />
                      </button>

                      <span className="min-w-[24px] text-center text-sm font-semibold">
                        {getUpvoteCount(post._id) -
                          getDownvoteCount(post._id)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownvote(e, post._id);
                        }}
                        className="p-0.5 rounded-full"
                      >
                        <ArrowBigDown
                          size={18}
                          fill={
                            userDownvotes[post._id]
                              ? "currentColor"
                              : "none"
                          }
                          strokeWidth={2}
                        />
                      </button>
                    </div>

                    <button
                      className="flex items-center gap-1 text-gray-400 hover:text-white border border-gray-700 rounded-full px-2 py-1 mt-2 bg-gray-800 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>{post.commentsCount}</span>
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
