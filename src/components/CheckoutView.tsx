/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShoppingBag, Truck, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { CartItem, Product, Order } from '../types';

interface CheckoutViewProps {
  cart: CartItem[];
  products: Product[];
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
  defaultPhone?: string;
  defaultAddress?: string;
}

export default function CheckoutView({
  cart,
  products,
  onBack,
  onOrderSuccess,
  defaultPhone = '',
  defaultAddress = ''
}: CheckoutViewProps) {
  
  // Checkout Form States
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState(defaultAddress);
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // simulated credit card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Map cart items
  const cartWithDetails = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product !== undefined) as Array<{
    productId: string;
    quantity: number;
    product: Product;
  }>;

  // Calculators
  const subtotal = cartWithDetails.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 0 && subtotal < 100 ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Shipping Address Validations
    if (!fullName.trim() || !address.trim() || !city.trim() || !zip.trim() || !phone.trim()) {
      setError('Please provide complete shipping details.');
      return;
    }

    // Payment validation simulation
    if (paymentMethod === 'Credit Card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setError('Please enter Expiry in MM/YY format.');
        return;
      }
      if (cardCVV.length < 3) {
        setError('Please enter a 3 or 4-digit CVV/CVC.');
        return;
      }
    }

    setLoading(true);
    const token = localStorage.getItem('nordic_token');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: `${fullName}, ${address}, ${city}, ${zip}. Tel: ${phone}`,
          paymentMethod,
          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete order checkout');
      }

      setSuccessOrder(data);
      onOrderSuccess(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout processing.');
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting for credit card
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    if (clean.length >= 2) {
      setCardExpiry(clean.substring(0, 2) + '/' + clean.substring(2));
    } else {
      setCardExpiry(clean);
    }
  };

  const handleCVVChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    setCardCVV(clean);
  };

  if (successOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in" id="order-success-screen">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-sm text-gray-500 mt-2">
          Thank you for choosing NORDIC. Your payment was verified, and your order is being processed.
        </p>

        {/* Order Reference Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-150 p-6 text-left my-8 space-y-3.5">
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">Order Number</span>
              <span className="text-sm font-bold text-gray-900 font-mono">{successOrder.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">Date</span>
              <span className="text-xs text-gray-600 font-mono">
                {new Date(successOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">Shipping Coordinates</span>
            <span className="text-xs text-gray-700 leading-relaxed block">{successOrder.shippingAddress}</span>
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">Amount Charged ({successOrder.paymentMethod})</span>
            <span className="text-base font-bold text-gray-950 font-mono">${successOrder.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Dispatch banner */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 text-left mb-8">
          <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-800">Swift Dispatch Activated</h4>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Your parcel will leave our distribution center in Seattle within 24 hours. A tracking code will be emailed shortly.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-950 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="checkout-view-panel">
      {/* Return link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 mb-8 transition group"
        id="checkout-back-btn"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Return to Shopping Bag</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-7 space-y-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-500" />
            <span>Secure Order Checkout</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6" id="checkout-form">
            
            {/* Section 1: Shipping Particulars */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-2 font-mono">
                1. Delivery Coordinates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    id="shipping-fullname"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Apartment, suite, unit, 100 Main St"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    id="shipping-address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">City & State</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Seattle, WA"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    id="shipping-city"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Postal ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="98101"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    id="shipping-zip"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Contact Telephone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="206-555-0199"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    id="shipping-phone"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Billing / Payment Simulation */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-2 font-mono flex justify-between items-center">
                <span>2. Payment Instruments</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 lowercase italic">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Fully Encrypted</span>
                </span>
              </h3>

              {/* Payment selector */}
              <div className="grid grid-cols-3 gap-2.5">
                {['Credit Card', 'PayPal', 'Apple Pay'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === method
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{method}</span>
                  </button>
                ))}
              </div>

              {/* Credit Card Inputs simulation */}
              {paymentMethod === 'Credit Card' ? (
                <div className="space-y-3 pt-3" id="cc-details-container">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Credit Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security Code (CVV)</label>
                      <input
                        type="password"
                        required
                        value={cardCVV}
                        onChange={(e) => handleCVVChange(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 text-center rounded-lg border border-slate-200 text-xs text-slate-500 font-medium">
                  Simulation: Proceeding will safely authorize mock transfer via {paymentMethod}.
                </div>
              )}
            </div>

            {/* Errors */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Place Order submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-md shadow-emerald-100 disabled:opacity-50 cursor-pointer"
              id="place-order-submit-btn"
            >
              {loading ? 'Processing Secure Payment...' : `Authorize & Place Order • $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary Side Panel */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl p-6 border border-slate-200 sticky top-24 space-y-6 shadow-sm" id="checkout-summary-panel">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-2 font-mono">
              Order Summary
            </h3>

            {/* List mini products in cart */}
            <div className="space-y-4 max-h-[25vh] overflow-y-auto no-scrollbar pr-1">
              {cartWithDetails.map(({ productId, quantity, product }) => (
                <div key={productId} className="flex items-center gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{product.name}</h4>
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                      Qty: {quantity} • ${product.price.toFixed(2)} each
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 font-mono">
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Breakdowns */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & handling</span>
                {shipping === 0 ? (
                  <span className="text-emerald-600 font-semibold uppercase">Free</span>
                ) : (
                  <span className="font-mono font-semibold text-gray-900">${shipping.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span>Estimated Sales Tax (8%)</span>
                <span className="font-mono font-semibold text-gray-900">${tax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm font-bold text-gray-950 pt-3 border-t border-gray-200">
                <span>Total Amount Charged</span>
                <span className="font-mono text-base">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Guarantee badge */}
            <div className="pt-2 flex items-center gap-2.5 text-[10px] text-gray-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>NORDIC Buyer Guarantee protects your dispatch. 30-day hassle-free refunds.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
