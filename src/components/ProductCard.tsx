/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Eye, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (id: string) => void;
  onAddToCart: (id: string, e: React.MouseEvent) => void;
}

export default function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div 
      onClick={() => onViewDetails(product.id)}
      className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Panel */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-800 uppercase tracking-wider border border-slate-200/50">
          {product.category}
        </div>

        {/* Stock Status Overlays */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase px-3 py-1.5 border-2 border-gray-300 rounded-lg bg-white/90">
              Sold Out
            </span>
          </div>
        ) : product.stockQuantity <= 5 ? (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide animate-pulse">
            Only {product.stockQuantity} Left
          </div>
        ) : null}

        {/* Hover Action Overlay buttons */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product.id);
              }}
              className="p-3 bg-white text-slate-800 rounded-lg hover:bg-slate-50 border border-slate-200 hover:scale-110 active:scale-95 shadow-md transition-all"
              title="Quick View"
              id={`quick-view-btn-${product.id}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onAddToCart(product.id, e)}
              className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:scale-110 active:scale-95 shadow-md transition-all"
              title="Add to Cart"
              id={`quick-add-btn-${product.id}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Product Information Panel */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-sans font-medium text-sm sm:text-base text-gray-900 tracking-tight group-hover:text-gray-950 line-clamp-1 mb-1.5">
          {product.name}
        </h3>
        
        {/* Rating stars */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono font-medium text-gray-500">
            {product.rating}
          </span>
          {product.reviewsCount !== undefined && product.reviewsCount > 0 && (
            <span className="text-[11px] text-gray-400 font-sans">
              ({product.reviewsCount})
            </span>
          )}
        </div>

        {/* Price & Action row */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <span className="text-[11px] text-slate-400 block font-mono">Price</span>
            <span className="text-base sm:text-lg font-bold text-indigo-600 font-mono">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={(e) => onAddToCart(product.id, e)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600'
            }`}
            id={`add-to-cart-btn-${product.id}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
