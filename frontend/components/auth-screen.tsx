'use client';

import { Mail, Lock, LogIn, User as UserIcon, ArrowLeft, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@/app/page';
import api from '@/app/api/api.js';
import toast from 'react-hot-toast';

export default function AuthScreen({ onAuthenticate }: { onAuthenticate: (user: User, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [errorMsg, SetErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    await api.post('/auth/signup', {
      name: username,
      email,
      password,
    });

    toast.success('Account successfully created! Login Now', {
      style: {
        borderRadius: '10px',
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #374151',
      },
      iconTheme: {
        primary: '#00A870',
        secondary: '#fff',
      },
    });

    setShowSignUp(false);
  };

  const handleLogin = async () => {
    const response = await api.post('/auth/login', {
      email,
      password,
      role,
    });
    console.log(response);

    localStorage.setItem('token', response.data.access_token);

    const loggedInUser: User = {
      _id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.name,
      avatar: response.data.user.avatarUrl || null,
      recentPosts: 2,
      role: response.data.user.role,
      avatarUrl: response.data.user.avatarUrl,
    };

    toast.success(`Welcome back, ${response.data.user.name}!`, {
      style: {
        borderRadius: '10px',
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #374151',
      },
    });

    onAuthenticate(loggedInUser, response.data.access_token);
  };

  const handleAuthError = (error: any) => {
    const backendMessage = error.response?.data?.message || 'Something went wrong!';

    const finalError = Array.isArray(backendMessage)
      ? backendMessage[0]
      : backendMessage;

    toast.error(finalError, {
      style: {
        borderRadius: '10px',
        background: '#1f2937',
        color: '#fff',
        border: '1px solid #ef4444',
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    SetErrorMsg('');

    try {
      if (showSignUp) {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const VergeLogoSVG = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      <path d="M4 4H9L14 15L19 4H24L16.5 20.5H11.5L4 4Z" fill="currentColor" />
      <path d="M10.5 4H13.5L8.5 15H5.5L10.5 4Z" fill="currentColor" opacity="0.4" />
    </svg>
  );

  return (
  <div className="h-screen w-full overflow-hidden bg-[#111827] text-gray-100 flex items-center justify-center px-4">
    <div className="w-full max-w-md">
      
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-[#006239] flex items-center justify-center text-white">
            <VergeLogoSVG />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Verge
          </h1>
        </div>
        <p className="text-gray-500 text-sm">Anonymous & Structured Feedback Platform</p>
      </div>

      <div className="bg-[#1f2937] border border-[#374151] rounded-xl p-6 md:p-8 space-y-4 shadow-2xl">
        
        {showSignUp && (
          <button
            onClick={() => setShowSignUp(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </button>
        )}

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">{showSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-sm text-gray-500">{showSignUp ? 'Sign up to join the community' : 'Sign in to your account to continue'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#111827] border border-[#374151] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00A870]/50 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !username || !password}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-4 rounded-lg bg-gradient-to-r from-[#00A870] to-[#006239] hover:from-[#00A870]/90 hover:to-[#006239]/90 disabled:from-[#374151] disabled:to-[#374151] disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg"
          >
            <LogIn size={18} />
            <span>{isLoading ? (showSignUp ? 'Creating Account...' : 'Signing in...') : (showSignUp ? 'Create Account' : 'Sign In')}</span>
          </button>
        </form>

        <div className="text-center pt-3 border-t border-[rgb(55,65,81)]">
          <p className="text-sm text-gray-500">
            {showSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setShowSignUp(!showSignUp)}
              className="ml-2 text-[#00A870] hover:text-[#00A870]/80 font-semibold transition-colors"
            >
              {showSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

    </div>
  </div>
);
}