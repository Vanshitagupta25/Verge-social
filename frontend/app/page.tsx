'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import api from '@/app/api/api'
import Sidebar from '@/components/sidebar';
import Feed from '@/components/feed';
import FloatingPostFAB from '@/components/floating-post-fab';
import PostCreationScreen from '@/components/post-creation-screen';
import ChannelOnboarding from '@/components/channel-onboarding';
import SearchModal from '@/components/search-modal';
import toast from 'react-hot-toast';

export interface Channel {
  _id: string;
  name: string;
  description?: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: {
    _id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  color: string;
  content: string;
  timestamp: string;
}

export interface Post {
  _id: string;
  authorId: {
    _id: string;
    name: string;
    avatarUrl: string;
  };
  content: string;
  color: string;
  author: string;
  commentsCount?: number;
  upvotesCount?: number;
  downvotesCount?: number;
  createdAt?: string | null;
  updatedAt?: string;
  channelId?: string | null;
  imageUrl?: string | null;
}

export interface User {
  _id: string;
  email: string;
  avatarUrl: string;
  username: string;
  avatar: string;
  role: string;
  recentPosts: number;
}

export default function Page() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [joinedChannelIds, setJoinedChannelIds] = useState<string[]>([]);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);


  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0]._id);
    }
  }, [channels]);

  const activeChannel = channels.find(
    c => c._id === activeChannelId
  );

  // Hydrate session from localStorage
  useEffect(() => {
    try {
      const token = window.localStorage.getItem('token');
      const savedUserData = window.localStorage.getItem('verge_user');
      const hasCompletedOnboarding = window.localStorage.getItem('verge_onboarding_complete');

      if (token && savedUserData) {
        setCurrentUser(JSON.parse(savedUserData));
        setIsAuthenticated(true);

        if (hasCompletedOnboarding !== 'true') {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Hydration error:", error);
    }
    setIsHydrated(true);
  }, []);
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await api.get('/channels');
        setChannels(response.data);
      } catch (err) {
        setChannels([
          { _id: '1', name: 'product-feedback', description: 'Share feedback on our products' },
          { _id: '2', name: 'engineering-core', description: 'Technical discussions' }
        ]);
      }
    };
    if (isAuthenticated) fetchChannels();
  }, [isAuthenticated]);

  const addChannel = async (name: string, description: string) => {
      if (!description.trim()) {
    toast.error("Channel description is mandatory.");
    return;
  }
  if (description.trim().length < 10 || description.trim().length > 200) {
    toast.error("Description must be between 10 and 200 characters.");
    return;
  }
    try {
      const response = await api.post('/channels', { name, description });

      setChannels((prev) => [...prev, response.data]);
      toast.success('New Channel Created');

    } catch (err: any) {
      toast.error(
        err.response?.data?.message?.join("\n") ||
        "Failed in Channel creation"
      );
    }
    const newChannel: Channel = {
      _id: String(channels.length + 1),
      name,
      description,
    };
    setChannels([...channels, newChannel]);
  };

  const addPost = (newPost: Post) => {
  const formattedPost: Post = {
    ...newPost,
    imageUrl: newPost.imageUrl
  ? (newPost.imageUrl.startsWith('http')
      ? newPost.imageUrl
      : `https://res.cloudinary.com/dytms6dh7/image/upload/posts/${newPost.imageUrl.replace(/^\//, '')}`)
  : undefined,
    
    authorId: typeof newPost.authorId === 'string' ? {
      _id: newPost.authorId,
      name: currentUser?.username || currentUser?.name || 'You'
    } : newPost.authorId,
    author: newPost.author || currentUser?.username || 'You'
  };
  setPosts((prev) => [formattedPost, ...prev]); 
  
  setShowPostCreation(false);
};
  const addComment = async (postId: string, content: string, parentId: string | null = null) => {
    try {
      const response = await api.post('/comments', {
        postId,
        content,
        parentId: parentId || null
      });
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );
      toast.success('Comment Sent');
      return response.data;

    } catch (error) {
      toast.error('Comment not saved');
    }
  };

  const deletePost = async (_id: string) => {
    try {
      const token = localStorage.getItem('token');

      await api.delete(`https://instant-plsl.onrender.com/posts/${_id}`, {
        data: { token }
      });
      setPosts((prevPosts) => prevPosts.filter((p) => p._id !== _id));
      toast.success('Post successfully Cleaned');
    } catch (error) {
      console.error("Delete handler error:", error);
      toast.error('No access to delete');
    };
  }

  const deleteComment = async (comment: number, postId: string) => {
    try {
      await api.delete(`/comments/${comment}`);

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p
        )
      );
      toast.success('Comment deleted');

    } catch (error) {
      toast.error('No Access for Comment Delete!');
    }
  };

  const handleJoinChannel = (channelId: string) => {
    if (!joinedChannelIds.includes(channelId)) {
      setJoinedChannelIds([...joinedChannelIds, channelId]);
    }
  };

  const handleAuthenticate = async (user: User, token: string)
    : Promise<void> => {
    localStorage.setItem('token', token);
    localStorage.setItem('verge_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowOnboarding(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('verge_user');
    localStorage.removeItem('verge_onboarding_complete');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowOnboarding(false);
    setJoinedChannelIds([]);
    toast.success("Logged out successfully!");
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('verge_onboarding_complete', 'true');
    setShowOnboarding(false);
    if (joinedChannelIds.length > 0) {
      setActiveChannelId(joinedChannelIds[0]);
    }
  };

  const handleUpdateUsername = (newUsername: string) => {
    if (currentUser) {
      const updated = { ...currentUser, username: newUsername };
      setCurrentUser(updated);
      localStorage.setItem('verge_user', JSON.stringify(updated));
    }
  };

  const handleUpdateAvatar = (avatarImage: string) => {
    if (currentUser) {
      const updated = { ...currentUser, avatar: avatarImage };
      setCurrentUser(updated);
      localStorage.setItem('verge_user', JSON.stringify(updated));
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00A870] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#111827] text-white">
      {/* Left Sidebar Control Navigation */}
      {currentUser && (
        <Sidebar
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={setActiveChannelId}
          currentUser={currentUser}
          onCreateChannel={addChannel}
        />
      )}

      {/* Main Container Layer for Post Feed Elements */}
      <main className="flex-1 overflow-y-auto relative border-l border-gray-800">
        <Feed
          posts={posts}
          setPosts={setPosts}
          comments={comments}
          channel={activeChannel}
          activeChannelId={activeChannelId}
          currentUser={currentUser}
          onDeletePost={deletePost}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          onAuthenticate={handleAuthenticate}
          onUpdateAvatar={handleUpdateAvatar}
          onUpdateUsername={handleUpdateUsername}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          onCreatePost={addPost}
          onOpenSearch={() => setShowSearchModal(true)}
        />

        {/* Dynamic Action Trigger FAB */}
        {isAuthenticated && (
          <FloatingPostFAB onClick={() => setShowPostCreation(true)} />
        )}
      </main>

      {/* Modals & Screen Overlays Controllers */}
      <AnimatePresence>
        {showPostCreation && (
          <PostCreationScreen
            onClose={() => setShowPostCreation(false)}
            onSubmit={addPost}
            currentUser={currentUser}
            isOpen={showPostCreation}
            activeChannelId={activeChannelId}
            onPostCreated={(newPost) => addPost(newPost)}
          />
        )}

        {showOnboarding && (
          <ChannelOnboarding
            channels={channels}
            joinedChannelIds={joinedChannelIds}
            onJoinChannel={handleJoinChannel}
            onComplete={handleCompleteOnboarding}
          />
        )}

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          channels={channels}
          users={users}
          onSelectChannel={(channelId) => {
            setActiveChannelId(channelId);
            setShowSearchModal(false);
          }}
          onSelectUser={(userId) => {
            console.log(userId);
          }}
        />
      </AnimatePresence>
    </div>
  );
}
