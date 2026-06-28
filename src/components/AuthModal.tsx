/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserSession } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (session: UserSession, token: string) => void;
}

export default function AuthModal({ onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Shared Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register-only Fields
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend Validations
    if (!email || !password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!isLogin && username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { username, email, password, phone, address };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success
      localStorage.setItem('nordic_token', data.token);
      onAuthSuccess({
        userId: data.user.id,
        username: data.user.username,
        email: data.user.email,
        isAdmin: !!data.user.isAdmin
      }, data.token);
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(prev => !prev);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal-overlay">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Modal Container */}
      <div 
        className="relative bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="auth-modal-panel"
      >
        
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLogin ? 'Sign in to access your dashboard & orders' : 'Join NORDIC for a seamless shopping experience'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            id="close-auth-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-55 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition"
                    id="auth-username-input"
                  />
                </div>
              </div>
            )}

            {/* Email (Mandatory) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-55 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition"
                  id="auth-email-input"
                />
              </div>
            </div>

            {/* Password (Mandatory) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-55 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition"
                  id="auth-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <span className="block text-[10px] text-gray-400 mt-1">
                  Must be at least 6 characters long
                </span>
              )}
            </div>

            {/* Phone (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="123-456-7890 (optional)"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-55 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition"
                    id="auth-phone-input"
                  />
                </div>
              </div>
            )}

            {/* Shipping Address (Register Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Default Shipping Address
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 w-4.5 h-4.5 text-gray-400 self-start mt-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Pine St, New York, NY 10001 (optional)"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-55 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition resize-none"
                    id="auth-address-input"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm disabled:opacity-50 cursor-pointer"
              id="auth-submit-btn"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In to My Account' : 'Register New Account'}
            </button>
          </form>

          {/* Seed accounts helper for easy logging in */}
          {isLogin && (
            <div className="mt-4 bg-gray-50 border border-gray-150 p-3 rounded-xl">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Demo Credentials</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <div>
                  <span className="block font-semibold text-gray-800">Standard User:</span>
                  <button 
                    onClick={() => { setEmail('user@store.com'); setPassword('password123'); }}
                    className="text-gray-500 hover:text-gray-950 underline font-mono text-[10px]"
                  >
                    user@store.com
                  </button>
                </div>
                <div>
                  <span className="block font-semibold text-gray-800">Admin Staff:</span>
                  <button 
                    onClick={() => { setEmail('admin@store.com'); setPassword('admin123'); }}
                    className="text-gray-500 hover:text-gray-950 underline font-mono text-[10px]"
                  >
                    admin@store.com
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Tab Trigger */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs">
            <span className="text-gray-400">
              {isLogin ? "Don't have an account yet?" : 'Already have a registered account?'}
            </span>{' '}
            <button
              type="button"
              onClick={handleToggleMode}
              className="font-bold text-gray-900 hover:underline cursor-pointer"
              id="toggle-auth-mode-btn"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
