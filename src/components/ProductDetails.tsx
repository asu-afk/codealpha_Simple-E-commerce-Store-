/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, ArrowLeft, Plus, Minus, ShoppingCart, MessageSquare, Clock } from 'lucide-react';
import { Product, Review, UserSession } from '../types';

interface ProductDetailsProps {
  productId: string;
  currentUser: UserSession | null;
  onAddToCart: (id: string, qty: number) => void;
  onBack: () => void;
}

export default function ProductDetails({ productId, currentUser, onAddToCart, onBack }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buy Quantity State
  const [quantity, setQuantity] = useState(1);

  // Review Form States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve product details');
      }
      const data = await res.json();
      setProduct(data);
      setReviews(data.reviews || []);
    } catch (e: any) {
      setError(e.message || 'Error loading product');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product.id, quantity);
      // Reset quantity input
      setQuantity(1);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setReviewError(null);
    setReviewSuccess(false);

    if (reviewComment.trim().length < 3) {
      setReviewError('Review comment must be at least 3 characters long');
      return;
    }

    // Read Bearer token from local storage
    const token = localStorage.getItem('nordic_token');
    if (!token) {
      setReviewError('Please login to leave a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const newReview = await res.json();
      setReviews(prev => [newReview, ...prev]);
      setReviewSuccess(true);
      setReviewComment('');
      setReviewRating(5);
      
      // Refresh general details to update aggregated rating count
      fetchProductDetails();
    } catch (err: any) {
      setReviewError(err.message || 'Error posting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" id="product-details-loading">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-gray-500">Loading product particulars...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" id="product-details-error">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 mb-6">
          <p className="font-semibold">{error || 'Product not found'}</p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:text-gray-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Product Directory</span>
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id={`product-detail-view-${product.id}`}>
      {/* Return back header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 mb-8 transition group"
        id="back-to-list-btn"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Return to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Column: Visual Showcase */}
        <div className="lg:col-span-6">
          <div className="aspect-square w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-55 shadow-xs">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Right Column: Descriptions & Purchase Control */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          
          {/* Metadata Block */}
          <div className="mb-6">
            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase block mb-2 font-mono">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
              {product.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold font-mono text-gray-700">{product.rating}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500 font-medium">
                {reviews.length} Verified Reviews
              </span>
            </div>
          </div>

          {/* Pricing tag */}
          <div className="bg-white rounded-xl p-5 mb-6 border border-slate-200">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 font-mono">USD (including local taxes)</span>
            </div>
            
            {/* Inventory Indicator */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isOutOfStock ? 'bg-red-500' : product.stockQuantity <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}></span>
              <span className="text-xs text-gray-600 font-medium">
                {isOutOfStock ? (
                  <span className="text-red-600 font-semibold uppercase">Currently Out of Stock</span>
                ) : product.stockQuantity <= 5 ? (
                  <span className="text-amber-600 font-semibold">Running Low! Only {product.stockQuantity} units left</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">In Stock ({product.stockQuantity} units available)</span>
                )}
              </span>
            </div>
          </div>

          {/* Product Description */}
          <div className="mb-8 prose prose-sm text-gray-600 leading-relaxed max-w-none">
            <p className="text-sm">{product.description}</p>
          </div>

          {/* Checkout Controls */}
          {!isOutOfStock && (
            <div className="border-t border-gray-100 pt-6 mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              
              {/* Quantity Counter */}
              <div className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2.5 bg-white min-w-[140px]">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition"
                  id="dec-qty-btn"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold font-mono text-slate-800 select-none">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={quantity >= product.stockQuantity}
                  className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition"
                  id="inc-qty-btn"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add To Cart Big Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-100 cursor-pointer text-sm"
                id="details-add-to-cart-btn"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add {quantity} Item{quantity > 1 ? 's' : ''} to Shopping Bag</span>
              </button>
            </div>
          )}

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-900">Swift Dispatch</span>
                <span className="block text-[10px] text-gray-400">Shipped within 24 hours</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-900">Authentic Reviews</span>
                <span className="block text-[10px] text-gray-400">100% verified buyers</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Customer Review Panel Section */}
      <div className="mt-16 pt-12 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Reviews List Column */}
          <div className="lg:col-span-7">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-8 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <span>Customer Reviews ({reviews.length})</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 font-medium">No reviews recorded yet for this product.</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-6" id="reviews-list">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs" id={`review-${rev.id}`}>
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <span className="font-semibold text-sm text-gray-900 block">{rev.username}</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-150'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a Review Submission Column */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl p-6 border border-slate-200 sticky top-24 shadow-sm" id="review-form-container">
              <h3 className="text-base font-bold text-gray-900 tracking-tight mb-4">
                Write a Review
              </h3>

              {currentUser ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Overall Rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 focus:outline-hidden group"
                          id={`select-star-${star}`}
                        >
                          <Star
                            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                              star <= reviewRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-250'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Your Comments
                    </label>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience using this product..."
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-800"
                      id="review-comment-textarea"
                    ></textarea>
                  </div>

                  {/* Messages */}
                  {reviewError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-100">
                      Thank you! Your product review has been submitted successfully.
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50 text-sm cursor-pointer shadow-md shadow-indigo-100"
                    id="submit-review-btn"
                  >
                    {submittingReview ? 'Submitting Your Review...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">You must be registered and signed in to leave reviews for our products.</p>
                  <p className="text-xs text-gray-400">Join our community or log in using the header buttons.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
