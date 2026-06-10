'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Pencil, ArrowLeft, MessageCircle, Heart, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Post {
  _id: string;
  content: string;
  imageUrl?: string;
  authorId: string | { _id: string; name: string; avatarUrl?: string };
  createdAt: string;
  commentsCount?: number;
  comments?: any[];
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Authentication Context States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dynamic Form Field Controls
  const [isEditingName, setIsEditingName] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    setUsernameInput(parsedUser.name || parsedUser.username || '');
    setLoadingUser(false);

    // Fetch live timeline feed data
    fetchMyPosts(parsedUser._id, token);
  }, [router]);

  // Fetch real matching posts from common database feed
  const fetchMyPosts = async (userId: string, token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allPosts: Post[] = response.data;
      
      // Strict matching logic to filter down only your real posts
      const realFilteredPosts = allPosts.filter(post => {
        const postAuthorId = typeof post.authorId === 'object' ? post.authorId._id : post.authorId;
        return postAuthorId === userId;
      });

      setMyPosts(realFilteredPosts);
    } catch (error) {
      console.error('Error fetching authentic post feed history:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Profile data update logic
  const handleUpdateProfile = async (fields: { name?: string; avatarFile?: File }) => {
    setActionLoading(true);
    try {
      const formData = new FormData();
      if (fields.name) formData.append('name', fields.name);
      if (fields.avatarFile) formData.append('image', fields.avatarFile);

      const token = localStorage.getItem('token');
      const response = await axios.patch(`${BACKEND_URL}/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success || response.data.user) {
        const updatedFields = response.data.user || response.data;
        
        // Push changes up to memory tracking systems
        const synchronizedUserObject = { ...currentUser, ...updatedFields };
        setCurrentUser(synchronizedUserObject);
        localStorage.setItem('user', JSON.stringify(synchronizedUserObject));
        
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Failed to update live identity strings:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      handleUpdateProfile({ avatarFile: file });
    }
  };

  // Helper formatting asset path handlers
  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;
    if (currentUser?.avatarUrl) {
      if (currentUser.avatarUrl.startsWith('http')) return currentUser.avatarUrl;
      return `${BACKEND_URL}/${currentUser.avatarUrl.replace(/^\//, '')}`;
    }
    return null;
  };

  const buildImageSrc = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}/${path.replace(/^\//, '')}`;
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-[#00A870] font-mono text-sm tracking-wider">
        FETCHING PROFILE CONTEXT...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans pb-16">
      
      {/* Mobile-Friendly Top Navigation bar */}
      <header className="sticky top-0 z-40 w-full bg-[#111827]/80 backdrop-blur-md border-b border-gray-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => { router.push('/'); router.refresh(); }} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Community Feed
          </button>
          <span className="text-xs font-mono text-gray-500 hidden sm:inline">Active Session Profile</span>
        </div>
      </header>

      {/* Main Grid: Adapts from 1 column on mobile to 3 columns on desktops */}
      <main className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PROFILE CARD: Fully Responsive Layout Wrapper */}
        <section className="md:col-span-1 h-fit">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Avatar Selection Container */}
            <div className="relative group mb-4">
              {getAvatarSrc() ? (
                <img 
                  src={getAvatarSrc()!} 
                  alt="Avatar Identity" 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-[#00A870] shadow-md" 
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-[#00A870] to-[#006239] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md">
                  {(currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button 
                disabled={actionLoading}
                onClick={() => fileInputRef.current?.click()} 
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity duration-200 cursor-pointer"
              >
                <Camera size={18} className="text-white" />
              </button>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Editing State Inputs */}
            {isEditingName ? (
              <div className="w-full space-y-2">
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-gray-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-[#00A870] font-medium"
                />
                <div className="flex gap-2">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateProfile({ name: usernameInput.trim() })} 
                    className="flex-1 py-1.5 bg-[#00A870] text-xs font-bold rounded-md hover:bg-[#008f5d] text-white transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditingName(false)} 
                    className="flex-1 py-1.5 bg-gray-700 text-xs font-bold rounded-md hover:bg-gray-600 text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 w-full min-w-0">
                <div className="flex items-center justify-center gap-1.5 group">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-[85%]">
                    {currentUser?.name || currentUser?.username}
                  </h2>
                  <button 
                    onClick={() => setIsEditingName(true)} 
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-mono truncate px-2">{currentUser?.email}</p>
                <div className="mt-2">
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold rounded-full border border-emerald-500/20">
                    {currentUser?.role || 'user'}
                  </span>
                </div>
              </div>
            )}

            {/* Fixed Single Metric Counter Container */}
            <div className="w-full border-t border-gray-800/80 mt-5 pt-4">
              <p className="text-2xl font-mono font-bold text-white">{myPosts.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Posts Uploaded</p>
            </div>

          </div>
        </section>

        {/* FEED SECTION: Renders Real User Upload History Content */}
        <section className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono pl-1">
            My Historic Post Submissions
          </h3>

          {loadingPosts ? (
            <div className="text-center py-12 text-gray-500 font-mono text-xs">Assembling personal database records...</div>
          ) : myPosts.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-xs sm:text-sm font-mono">
              No matching records found linked to your user account.
            </div>
          ) : (
            myPosts.map((post) => {
              const postImageSrc = buildImageSrc(post.imageUrl);
              const resolvedCommentsCount = post.commentsCount ?? post.comments?.length ?? 0;

              return (
                <article 
                  key={post._id} 
                  className="bg-[#111827] border border-gray-800 rounded-xl p-4 sm:p-5 hover:border-gray-700/70 transition-all shadow-sm"
                >
                  {/* Header Row */}
                  <div className="flex items-center gap-2 mb-3">
                    {getAvatarSrc() ? (
                      <img src={getAvatarSrc()!} className="w-6 h-6 rounded-md object-cover" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center text-white text-[10px] font-bold">
                        {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-white font-mono truncate max-w-[150px]">
                      {currentUser?.name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                      • {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Text Content */}
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {/* Real Linked Image Assets Container */}
                  {postImageSrc && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-gray-950 border border-gray-800/60 max-h-72 flex items-center justify-center w-full">
                      <img 
                        src={postImageSrc} 
                        alt="Uploaded post asset" 
                        className="object-contain w-full max-h-72" 
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Live Total Comments Counter Action Bar Area */}
                  <div className="flex items-center pt-2 border-t border-gray-800/50">
                    <button 
                      onClick={() => router.push(`/posts/${post._id}`)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs font-mono group"
                    >
                      <MessageCircle size={14} className="group-hover:scale-105 transition-transform" />
                      <span>{resolvedCommentsCount} comments</span>
                    </button>
                  </div>

                </article>
              );
            })
          )}
        </section>

      </main>
    </div>
  );
}