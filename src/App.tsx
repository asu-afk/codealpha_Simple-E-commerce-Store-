/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Grid, SlidersHorizontal, MessageSquare, Package, ArrowUpRight, Check } from 'lucide-react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import CartView from './components/CartView';
import AuthModal from './components/AuthModal';
import CheckoutView from './components/CheckoutView';
import OrderHistoryView from './components/OrderHistoryView';
import AdminDashboard from './components/AdminDashboard';
import AICompanion from './components/AICompanion';
import { Product, CartItem, UserSession } from './types';

type ActivePage = 'list' | 'detail' | 'checkout' | 'orders' | 'admin';

export default function App() {
  // Navigation View Router
  const [activePage, setActivePage] = useState<ActivePage>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Auth / Session States
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Store Products Directory
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Filtering / Sorting Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_asc, price_desc, rating

  // Drawers / Popup Overlays
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Toast message notify
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Boot session check
  useEffect(() => {
    checkActiveSession();
    fetchStoreProducts();
  }, []);

  const checkActiveSession = async () => {
    const savedToken = localStorage.getItem('nordic_token');
    if (!savedToken) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setCurrentUser({
          userId: userData.id,
          username: userData.username,
          email: userData.email,
          isAdmin: !!userData.isAdmin
        });
        setToken(savedToken);
        // Load saved cart state
        fetchSavedCart(savedToken);
      } else {
        // Stale or invalid token
        localStorage.removeItem('nordic_token');
      }
    } catch (err) {
      console.error('Session validation error:', err);
    }
  };

  const fetchStoreProducts = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error('Could not fetch store inventory');
      }
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setProductsError(err.message || 'Error loading products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSavedCart = async (activeToken: string) => {
    try {
      const res = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.items || []);
      }
    } catch (err) {
      console.error('Cart retrieval error:', err);
    }
  };

  const syncCartWithServer = async (newCart: CartItem[]) => {
    const savedToken = localStorage.getItem('nordic_token');
    if (!savedToken) return;

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ items: newCart })
      });
    } catch (err) {
      console.error('Cart synchronization error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Cart Operations
  const handleAddToCart = (productId: string, quantity: number = 1, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Check stock level first
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    if (targetProduct.stockQuantity <= 0) {
      showToast('This product is currently sold out!');
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === productId);
      let updated: CartItem[];

      if (existingIdx > -1) {
        const finalQty = Math.min(prev[existingIdx].quantity + quantity, targetProduct.stockQuantity);
        updated = [...prev];
        updated[existingIdx] = { ...prev[existingIdx], quantity: finalQty };
      } else {
        updated = [...prev, { productId, quantity: Math.min(quantity, targetProduct.stockQuantity) }];
      }

      // Sync backend
      if (currentUser) {
        syncCartWithServer(updated);
      }
      return updated;
    });

    showToast(`Added "${targetProduct.name}" to your shopping bag.`);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const finalQty = Math.min(newQty, targetProduct.stockQuantity);

    setCart(prev => {
      const updated = prev.map(item => 
        item.productId === productId ? { ...item, quantity: finalQty } : item
      );
      if (currentUser) {
        syncCartWithServer(updated);
      }
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      if (currentUser) {
        syncCartWithServer(updated);
      }
      return updated;
    });
  };

  const handleAuthSuccess = (session: UserSession, activeToken: string) => {
    setCurrentUser(session);
    setToken(activeToken);
    showToast(`Welcome back, ${session.username}!`);
    
    // Fetch user's cart on login and merge with current local guest cart
    fetchSavedCart(activeToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('nordic_token');
    setCurrentUser(null);
    setToken(null);
    setCart([]);
    setActivePage('list');
    showToast('Signed out of session successfully.');
  };

  // View specific product (used by AI Concierge links too)
  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActivePage('detail');
    setIsAIOpen(false); // Close AI panel to focus details page
  };

  // Filtered and Sorted products computed list
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default: // newest
        return b.id.localeCompare(a.id); // higher IDs are newer seed listings
    }
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F4F4F7] flex flex-col font-sans" id="ecommerce-layout-root">
      
      {/* Dynamic Floating Toast feedback notifier */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-slide-up max-w-sm border border-indigo-800">
          <Check className="w-4 h-4 text-indigo-300" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar
        currentUser={currentUser}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setActivePage('admin')}
        onOpenProfile={() => setActivePage('orders')}
        onOpenAI={() => setIsAIOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onResetView={() => { setActivePage('list'); setSelectedProductId(null); }}
        showFilters={activePage === 'list'}
      />

      {/* Main Interactive Screen Router */}
      <main className="flex-1 pb-16">
        
        {/* VIEW 1: PRODUCT LISTING PAGE */}
        {activePage === 'list' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="product-directory-screen">
            
            {/* Catalog Grid Sub-header & sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Grid className="w-5 h-5 text-gray-500" />
                  <span>Explore Premium Essentials</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Carefully curated Nordic workspace and daily accessories</p>
              </div>

              {/* Sorting selectors */}
              <div className="flex items-center gap-2 self-start sm:self-center" id="sorting-controls">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium font-mono">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-slate-800 font-medium"
                  id="sort-select"
                >
                  <option value="newest">New Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Error or empty catalog states */}
            {productsError ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl text-center max-w-xl mx-auto" id="catalog-error">
                <p className="font-semibold text-sm mb-4">Error: {productsError}</p>
                <button 
                  onClick={fetchStoreProducts}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                >
                  Retry Connection
                </button>
              </div>
            ) : loadingProducts ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-12" id="catalog-loading">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-xl"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-3xs max-w-xl mx-auto" id="catalog-empty">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-4">
                  <Grid className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">No products match your search query</h3>
                <p className="text-xs text-gray-400 mt-1">Try tweaking filters or keyword phrasing.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="mt-6 px-4 py-2 bg-gray-955 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8" id="product-grid">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onViewDetails={handleViewProduct}
                    onAddToCart={(id, e) => handleAddToCart(id, 1, e)}
                  />
                ))}
              </div>
            )}

            {/* Smart Banner promo section to increase AI usage */}
            <div className="mt-16 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-indigo-150">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>Next Gen AI Assistant</span>
                </span>
                <h3 className="text-lg sm:text-2xl font-bold tracking-tight">Need tailored suggestions for your workspace?</h3>
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                  Chat with our Gemini-powered Shop Companion! It reads live store stock and provides recommendations matching your budget instantly.
                </p>
              </div>
              <button
                onClick={() => setIsAIOpen(true)}
                className="px-5 py-3 rounded-lg bg-white text-indigo-600 hover:text-indigo-700 transition font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap cursor-pointer"
              >
                <span>Ask Gemini Shop Companion</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: PRODUCT DETAILS VIEW */}
        {activePage === 'detail' && selectedProductId && (
          <div className="animate-fade-in" id="product-detail-view-container">
            <ProductDetails
              productId={selectedProductId}
              currentUser={currentUser}
              onAddToCart={(id, qty) => handleAddToCart(id, qty)}
              onBack={() => { setActivePage('list'); setSelectedProductId(null); }}
            />
          </div>
        )}

        {/* VIEW 3: SECURE CHECKOUT PAGE */}
        {activePage === 'checkout' && (
          <div className="animate-fade-in" id="checkout-view-container">
            <CheckoutView
              cart={cart}
              products={products}
              onBack={() => { setActivePage('list'); setIsCartOpen(true); }}
              onOrderSuccess={() => {
                setCart([]); // Clear cart
                showToast('Payment verified successfully!');
              }}
              defaultPhone={currentUser?.email === 'user@store.com' ? '206-555-0199' : ''}
              defaultAddress={currentUser?.email === 'user@store.com' ? '123 Pine St, Seattle, WA 98101' : ''}
            />
          </div>
        )}

        {/* VIEW 4: USER ORDER LOGS / PROFILE VIEW */}
        {activePage === 'orders' && (
          <div className="animate-fade-in" id="orders-view-container">
            <OrderHistoryView
              onBack={() => setActivePage('list')}
            />
          </div>
        )}

        {/* VIEW 5: ADMIN INSTRUMENTS PANEL */}
        {activePage === 'admin' && (
          <div className="animate-fade-in" id="admin-view-container">
            <AdminDashboard
              onBack={() => setActivePage('list')}
              products={products}
              onRefreshProducts={fetchStoreProducts}
            />
          </div>
        )}

      </main>

      {/* Footer Branding credits */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
          <div>
            <span className="font-bold text-gray-800">NORDIC E-Commerce Store</span>
            <span className="block mt-0.5 font-mono">Simulated Sandbox Environment</span>
          </div>
          <p className="sm:text-right font-mono">
            Crafted with clean layouts, custom stars, and server-side Gemini AI.
          </p>
        </div>
      </footer>

      {/* OVERLAY DRAWER 1: SLIDING SHOPPING CART */}
      {isCartOpen && (
        <CartView
          cart={cart}
          products={products}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => {
            setIsCartOpen(false);
            if (currentUser) {
              setActivePage('checkout');
            } else {
              setIsAuthOpen(true);
            }
          }}
          isSignedIn={currentUser !== null}
        />
      )}

      {/* OVERLAY DRAWER 2: AUTH MODAL */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* OVERLAY DRAWER 3: AI SHOP ASSISTANT PANEL */}
      {isAIOpen && (
        <AICompanion
          onClose={() => setIsAIOpen(false)}
          onViewProduct={handleViewProduct}
        />
      )}

    </div>
  );
}
