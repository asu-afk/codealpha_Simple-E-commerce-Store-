/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Plus, Edit2, Trash2, Package, RefreshCw, Layers, CheckCircle, ArrowLeft, Truck } from 'lucide-react';
import { Product, Order, OrderStatus } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
  products: Product[];
  onRefreshProducts: () => void;
}

export default function AdminDashboard({ onBack, products, onRefreshProducts }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  
  // Products Management States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState('Electronics');
  const [prodFormStock, setProdFormStock] = useState('');
  const [prodFormImageUrl, setProdFormImageUrl] = useState('');
  const [productError, setProductError] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Orders Management States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchAdminOrders();
    }
  }, [activeTab]);

  const fetchAdminOrders = async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    const token = localStorage.getItem('nordic_token');
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve store orders');
      }
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setOrdersError(err.message || 'Error fetching orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormDesc('');
    setProdFormPrice('');
    setProdFormCategory('Electronics');
    setProdFormStock('');
    setProdFormImageUrl('');
    setProductError(null);
    setProductSuccess(null);
    setShowProductForm(true);
  };

  const handleOpenEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setProdFormName(prod.name);
    setProdFormDesc(prod.description);
    setProdFormPrice(String(prod.price));
    setProdFormCategory(prod.category);
    setProdFormStock(String(prod.stockQuantity));
    setProdFormImageUrl(prod.imageUrl);
    setProductError(null);
    setProductSuccess(null);
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);
    setProductSuccess(null);

    if (!prodFormName || !prodFormDesc || !prodFormPrice || !prodFormStock || !prodFormImageUrl) {
      setProductError('All fields are mandatory.');
      return;
    }

    setSubmittingProduct(true);
    const token = localStorage.getItem('nordic_token');
    
    const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    const body = {
      name: prodFormName,
      description: prodFormDesc,
      price: Number(prodFormPrice),
      category: prodFormCategory,
      stockQuantity: Number(prodFormStock),
      imageUrl: prodFormImageUrl
    };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit product details');
      }

      setProductSuccess(editingProduct ? 'Product details updated successfully!' : 'Product added successfully to inventory!');
      onRefreshProducts();
      setTimeout(() => {
        setShowProductForm(false);
        setEditingProduct(null);
      }, 1500);
    } catch (err: any) {
      setProductError(err.message || 'Error processing product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product from database? This is irreversible.')) return;
    
    const token = localStorage.getItem('nordic_token');
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete product');
      }

      onRefreshProducts();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setStatusUpdatingId(orderId);
    const token = localStorage.getItem('nordic_token');

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order status');
      }

      // Refresh admin order list
      fetchAdminOrders();
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard-panel">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition group self-start"
          id="admin-back-btn"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Exit Admin Workspace</span>
        </button>

        <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-150 rounded-xl">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'products'
                ? 'bg-gray-950 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Catalog</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'orders'
                ? 'bg-gray-950 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            id="tab-admin-orders-btn"
          >
            <Truck className="w-4 h-4" />
            <span>Customer Orders</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 mb-6">
        <Shield className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Admin Store Control Center</h1>
      </div>

      {/* TABS 1: PRODUCTS INVENTORY */}
      {activeTab === 'products' && (
        <div className="space-y-6" id="admin-products-tab">
          
          <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Products Catalog Directory</h3>
              <p className="text-xs text-gray-400">Add, edit details, adjust stock, or purge products from directory</p>
            </div>
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-gray-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-gray-800 transition cursor-pointer"
              id="admin-add-product-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Product form slide-in / modal overlay */}
          {showProductForm && (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-150 relative space-y-4 animate-fade-in" id="product-form-box">
              <h2 className="text-sm font-bold text-gray-950 uppercase tracking-wider border-b border-gray-200 pb-2 mb-2 font-mono">
                {editingProduct ? `Edit Details: ${editingProduct.name}` : 'Register New Catalog Product'}
              </h2>

              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    placeholder="ANC Headset Extreme"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    id="form-prod-name"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Product Category</label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    id="form-prod-category"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(e.target.value)}
                    placeholder="99.99"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                    id="form-prod-price"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Initial Stock Level</label>
                  <input
                    type="number"
                    required
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                    id="form-prod-stock"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Unsplash Product Image URL</label>
                  <input
                    type="url"
                    required
                    value={prodFormImageUrl}
                    onChange={(e) => setProdFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden"
                    id="form-prod-imageurl"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Specifications Description</label>
                  <textarea
                    rows={3}
                    required
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    placeholder="Enter thorough details about size, material specifications, and features..."
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden resize-none"
                    id="form-prod-desc"
                  ></textarea>
                </div>

                {/* Messages */}
                {productError && (
                  <div className="sm:col-span-6 p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                    {productError}
                  </div>
                )}
                {productSuccess && (
                  <div className="sm:col-span-6 p-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                    {productSuccess}
                  </div>
                )}

                <div className="sm:col-span-6 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="px-5 py-2 bg-gray-950 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50"
                    id="form-prod-submit"
                  >
                    {submittingProduct ? 'Saving...' : editingProduct ? 'Update Product Details' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid list of admin products */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-3xs" id="admin-inventory-list">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                    <th className="p-4 pl-6">Preview</th>
                    <th className="p-4">Title / ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock Left</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/20 transition">
                      <td className="p-4 pl-6">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-150"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900 block truncate max-w-[180px]">{prod.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{prod.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-md font-mono">{prod.category}</span>
                      </td>
                      <td className="p-4 font-bold font-mono text-gray-950">
                        ${prod.price.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold font-mono ${prod.stockQuantity <= 5 ? 'text-amber-600 animate-pulse' : 'text-gray-700'}`}>
                          {prod.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditForm(prod)}
                          className="p-1.5 text-gray-500 hover:text-gray-950 hover:bg-gray-50 rounded-lg border border-gray-100 transition"
                          title="Edit Details"
                          id={`admin-edit-prod-${prod.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-100 transition"
                          title="Purge product"
                          id={`admin-delete-prod-${prod.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TABS 2: CUSTOMER ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6" id="admin-orders-tab">
          
          <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Customer Purchase Orders</h3>
              <p className="text-xs text-gray-400">Track logs, view shipping destination, and advance delivery steps</p>
            </div>
            <button
              onClick={fetchAdminOrders}
              className="p-2 bg-white text-gray-600 hover:text-gray-900 border border-gray-150 rounded-xl hover:shadow-xs transition"
              title="Refresh order logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 mt-3 font-medium">Fetching orders list...</p>
            </div>
          ) : ordersError ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-semibold">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 p-12 text-center rounded-2xl text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-600">No client orders recorded yet.</p>
              <p className="text-xs mt-1">Check back when customers complete payment checkouts.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-3xs" id="admin-orders-list">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
                      <th className="p-4 pl-6">Order ID</th>
                      <th className="p-4">Customer info</th>
                      <th className="p-4">Items Manifest</th>
                      <th className="p-4">Amount Charged</th>
                      <th className="p-4">Delivery State</th>
                      <th className="p-4 pr-6 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                    {orders.map((ord) => {
                      const isStatusUpdating = statusUpdatingId === ord.id;
                      
                      return (
                        <tr key={ord.id} className="hover:bg-gray-50/20 transition" id={`admin-order-row-${ord.id}`}>
                          <td className="p-4 pl-6 font-bold font-mono text-gray-900">
                            #{ord.id}
                            <span className="block text-[9px] text-gray-400 font-normal font-mono mt-0.5">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="block text-gray-600 leading-normal max-w-[200px] truncate" title={ord.shippingAddress}>
                              {ord.shippingAddress}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5 max-w-[180px] truncate">
                              {ord.items?.map((item, idx) => (
                                <span key={idx} className="block text-[11px] text-gray-600 truncate">
                                  {item.quantity}x {item.productName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-bold font-mono text-gray-950">
                            ${ord.totalPrice.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              ord.status === OrderStatus.CANCELLED
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : ord.status === OrderStatus.DELIVERED
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : ord.status === OrderStatus.SHIPPED
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <select
                              disabled={isStatusUpdating}
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden text-gray-700"
                              id={`admin-order-status-select-${ord.id}`}
                            >
                              {Object.values(OrderStatus).map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
