/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Package, Clock, ShieldCheck, MapPin, CheckCircle, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderHistoryViewProps {
  onBack: () => void;
}

export default function OrderHistoryView({ onBack }: OrderHistoryViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('nordic_token');
    if (!token) {
      setError('Please login to view your order history.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve order history');
      }
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancellingId(orderId);
    const token = localStorage.getItem('nordic_token');

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: OrderStatus.CANCELLED })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to cancel order');
      }

      // Refresh order list
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error cancelling order');
    } finally {
      setCancellingId(null);
    }
  };

  // Helper to render current timeline step index
  const getStatusStep = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.PENDING: return 1;
      case OrderStatus.PROCESSING: return 2;
      case OrderStatus.SHIPPED: return 3;
      case OrderStatus.DELIVERED: return 4;
      default: return 0; // Cancelled
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="order-history-loading">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">Retrieving order database entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="order-history-view-panel">
      {/* Back button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition group"
          id="orders-back-btn"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Return to Catalog</span>
        </button>
        <button
          onClick={fetchOrders}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
          title="Refresh orders list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-gray-600" />
        <span>Your Order History</span>
      </h1>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-55 flex items-center justify-center text-gray-400 mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No orders placed yet</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
            Once you complete checkout, your order manifests and tracking logs will populate here.
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-4 py-2 bg-gray-955 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition cursor-pointer"
          >
            Start Browsing Products
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="orders-list">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStep = getStatusStep(order.status);
            const isCancelled = order.status === OrderStatus.CANCELLED;

            return (
              <div 
                key={order.id}
                onClick={() => toggleExpand(order.id)}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                  isExpanded ? 'border-gray-300 shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-3xs'
                }`}
                id={`order-card-${order.id}`}
              >
                
                {/* Collapsed view banner summary */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">#{order.id}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium truncate max-w-[320px]">
                      Delivered to: {order.shippingAddress.split(',')[0]}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">Paid Amount</span>
                      <span className="text-sm font-extrabold text-gray-950 font-mono">${order.totalPrice.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : order.status === OrderStatus.DELIVERED
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : order.status === OrderStatus.SHIPPED
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {order.status}
                      </span>

                      {/* Cancel order quick action if pending */}
                      {order.status === OrderStatus.PENDING && (
                        <button
                          disabled={cancellingId === order.id}
                          onClick={(e) => handleCancelOrder(order.id, e)}
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition"
                          id={`cancel-order-${order.id}`}
                        >
                          {cancellingId === order.id ? 'Wait...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-gray-50 bg-gray-50/20 space-y-6" id={`order-expanded-${order.id}`}>
                    
                    {/* Status Tracking Steps Timeline */}
                    {!isCancelled ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-mono block">
                          Delivery Tracking
                        </span>
                        
                        <div className="grid grid-cols-4 gap-2 relative">
                          {/* Background lines */}
                          <div className="absolute top-2.5 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 -z-10"></div>
                          <div 
                            className="absolute top-2.5 left-[12.5%] h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
                            style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 75}%` }}
                          ></div>

                          {/* Step 1: Pending */}
                          <div className="text-center">
                            <div className={`w-5.5 h-5.5 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                              currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                              1
                            </div>
                            <span className="block text-[9px] font-bold text-gray-600 uppercase mt-1">Pending</span>
                          </div>

                          {/* Step 2: Processing */}
                          <div className="text-center">
                            <div className={`w-5.5 h-5.5 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                              currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                              2
                            </div>
                            <span className="block text-[9px] font-bold text-gray-600 uppercase mt-1">Processing</span>
                          </div>

                          {/* Step 3: Shipped */}
                          <div className="text-center">
                            <div className={`w-5.5 h-5.5 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                              currentStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                              3
                            </div>
                            <span className="block text-[9px] font-bold text-gray-600 uppercase mt-1">Shipped</span>
                          </div>

                          {/* Step 4: Delivered */}
                          <div className="text-center">
                            <div className={`w-5.5 h-5.5 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                              currentStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}>
                              4
                            </div>
                            <span className="block text-[9px] font-bold text-gray-600 uppercase mt-1">Delivered</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs">
                        <XCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">This order has been cancelled and refunded. No delivery attempts will occur.</span>
                      </div>
                    )}

                    {/* Detailed Ordered Items */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide font-mono block">
                        Ordered Essentials
                      </span>

                      <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 p-3 space-y-3">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 pt-3 first:pt-0">
                            {item.productImageUrl && (
                              <img
                                src={item.productImageUrl}
                                alt={item.productName}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 truncate">{item.productName}</h4>
                              <span className="text-[10px] text-gray-400 block font-mono">
                                Qty: {item.quantity} • ${item.priceAtPurchase.toFixed(2)} each
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-gray-950 font-mono">
                              ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address coordinates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
                        <span className="flex items-center gap-1.5 font-bold text-gray-500 uppercase tracking-wide font-mono text-[9px]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Shipping Destination</span>
                        </span>
                        <p className="text-gray-700 leading-relaxed font-medium">
                          {order.shippingAddress}
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
                        <span className="flex items-center gap-1.5 font-bold text-gray-500 uppercase tracking-wide font-mono text-[9px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Billing & Payment</span>
                        </span>
                        <p className="text-gray-700 font-medium">
                          Method: {order.paymentMethod}
                        </p>
                        <p className="text-gray-500 text-[10px] font-medium mt-0.5">
                          Charged on transaction logs. Verified and secure.
                        </p>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
