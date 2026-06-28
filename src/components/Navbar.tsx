/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Search, User, Sparkles, LogOut, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentUser: UserSession | null;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenAI: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  onResetView: () => void;
  showFilters: boolean;
}

export default function Navbar({
  currentUser,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenProfile,
  onOpenAI,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  onResetView,
  showFilters
}: NavbarProps) {
  const categories = ['All', 'Electronics', 'Accessories', 'Home & Living', 'Apparel'];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            onClick={onResetView}
            className="flex items-center gap-2 cursor-pointer select-none group"
            id="nav-logo"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white transition-all duration-300 group-hover:bg-indigo-700 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900 block leading-tight">AURA</span>
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block -mt-0.5">E-Store</span>
            </div>
          </div>

          {/* Search bar & Filters - only shown on home product list */}
          {showFilters ? (
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative items-center" id="search-container">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-800 font-medium"
                id="search-input"
              />
            </div>
          ) : (
            <div className="hidden md:block flex-1"></div>
          )}

          {/* Action Menu Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* AI Assistant Trigger */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100/50 transition-colors duration-200 text-xs sm:text-sm font-semibold"
              title="Open Gemini AI Shop Companion"
              id="ai-companion-btn"
            >
              <Sparkles className="w-4 h-4 animate-pulse text-indigo-600" />
              <span className="hidden sm:inline">AI Shop Companion</span>
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              title="Shopping Cart"
              id="shopping-cart-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Dashboard Tab (if Admin) */}
            {currentUser?.isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 p-2 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200 text-sm font-medium"
                title="Admin Dashboard"
                id="admin-dashboard-btn"
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="hidden lg:inline text-xs">Admin</span>
              </button>
            )}

            {/* User Account Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2" id="user-controls">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-xs sm:text-sm font-medium"
                  id="user-profile-btn"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Log Out"
                  id="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 cursor-pointer"
                id="signin-btn"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search - only shown on home product list */}
        {showFilters && (
          <div className="md:hidden pb-4 pt-1" id="search-mobile-container">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                id="search-input-mobile"
              />
            </div>
          </div>
        )}

        {/* Category Filters row - only shown on home list */}
        {showFilters && (
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar border-t border-slate-100" id="category-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategorySelect(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
