/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, X } from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartViewProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClose: () => void;
  onCheckout: () => void;
  isSignedIn: boolean;
}

export default function CartView({
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClose,
  onCheckout,
  isSignedIn
}: CartViewProps) {
  
  // Helper to map and calculate cart items
  const cartWithDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  }).filter(item => item.product !== undefined) as Array<{
    productId: string;
    quantity: number;
    product: Product;
  }>;

  // Calculators
  const subtotal = cartWithDetails.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxRate = 0.08; // 8% Tax
  const tax = subtotal * taxRate;
  const shippingThreshold = 100;
  const shipping = subtotal > 0 && subtotal < shippingThreshold ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100" id="cart-drawer-panel">
          
          {/* Header Panel */}
          <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Your Shopping Bag</h2>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                {cart.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              id="close-cart-drawer-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar" id="cart-items-container">
            {cartWithDetails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center" id="empty-cart-view">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Your bag is empty</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                  Explore our premium catalog to add carefully crafted essentials.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition cursor-pointer shadow-md shadow-indigo-100"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartWithDetails.map(({ productId, quantity, product }) => (
                <div 
                  key={productId}
                  className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition"
                  id={`cart-item-${productId}`}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium uppercase font-mono block mb-1.5">
                      {product.category}
                    </span>

                    {/* Quantity Selector Panel */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-md px-2 py-1 bg-slate-50">
                        <button
                          onClick={() => onUpdateQuantity(productId, quantity - 1)}
                          disabled={quantity <= 1}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 disabled:opacity-20"
                          id={`cart-dec-qty-${productId}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono text-slate-800 px-2.5 min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(productId, quantity + 1)}
                          disabled={quantity >= product.stockQuantity}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 disabled:opacity-20"
                          id={`cart-inc-qty-${productId}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(productId)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove item"
                        id={`cart-remove-item-${productId}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-950 font-mono block">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                    {quantity > 1 && (
                      <span className="text-[10px] text-gray-400 font-mono block">
                        ${product.price.toFixed(2)} each
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary & Actions panel */}
          {cartWithDetails.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-4" id="cart-summary-panel">
              <div className="space-y-2.5 text-xs">
                
                {/* Subtotal */}
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-semibold uppercase">Free</span>
                  ) : (
                    <span className="font-mono font-semibold">${shipping.toFixed(2)}</span>
                  )}
                </div>

                {/* Tax */}
                <div className="flex justify-between text-gray-500">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono font-semibold">${tax.toFixed(2)}</span>
                </div>

                {/* Shipping Threshold banner */}
                {subtotal < shippingThreshold && (
                  <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-lg border border-indigo-100 text-[10px] text-center font-medium">
                    Add <span className="font-bold font-mono">${(shippingThreshold - subtotal).toFixed(2)}</span> more to qualify for <span className="font-bold">FREE SHIPPING</span>!
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2.5 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {isSignedIn ? (
                  <button
                    onClick={onCheckout}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer text-sm"
                    id="checkout-btn"
                  >
                    <span>Proceed to Secure Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={onCheckout}
                      className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer text-sm"
                      id="checkout-auth-redirect-btn"
                    >
                      <span>Sign In to Complete Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">
                      Join or login to securely save your billing & shipping information.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
