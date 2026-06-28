/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  imageUrl: string;
  rating: number; // 1 to 5 stars
  reviewsCount?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  // Included in API responses for client rendering
  productName?: string;
  productImageUrl?: string;
}

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  // Included in API responses for detailed views
  items?: OrderItem[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserSession {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

// Chat with AI Assistant types
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: string;
}
