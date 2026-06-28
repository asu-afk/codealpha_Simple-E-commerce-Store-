/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Product, Review, Order, OrderItem, OrderStatus, CartItem } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  users: User[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  orderItems: OrderItem[];
  carts: { [userId: string]: CartItem[] };
}

// Simple salt for SHA-512 PBKDF2 hashing
const PASSWORD_SALT = 'e_commerce_salt_91283109';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 1000, 64, 'sha512').toString('hex');
}

// Pre-seeded Data
const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Minimalist Leather Backpack',
    description: 'Crafted from premium full-grain leather, this minimalist backpack features a padded 15-inch laptop compartment, hidden pockets for secure storage, and breathable mesh back padding. Perfect for the modern creative commuter who values elegance and utility in equal measure.',
    price: 149.99,
    category: 'Accessories',
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 3,
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'prod_2',
    name: 'Active ANC Wireless Headphones',
    description: 'Immerse yourself completely in your sound. Featuring hybrid active noise cancellation (ANC), premium 40mm drivers, and custom EQ settings via the mobile app. Delivers up to 45 hours of pure listening enjoyment on a single charge, plus ultra-fast charging that grants 5 hours of playback in just 10 minutes.',
    price: 199.99,
    category: 'Electronics',
    stockQuantity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 4,
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'prod_3',
    name: 'Tactile Mechanical Keyboard',
    description: 'Experience typing as a tactile art form. This hot-swappable tenkeyless mechanical keyboard comes equipped with custom linear switches, double-shot PBT keycaps, and radiant per-key RGB backlighting. Enclosed in a robust aircraft-grade aluminum top plate for enduring performance.',
    price: 129.99,
    category: 'Electronics',
    stockQuantity: 8,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviewsCount: 2,
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    id: 'prod_4',
    name: 'Sleek Ceramic Coffee Mug',
    description: 'Designed to elevate your daily ritual. Double-walled high-fire ceramic keeps your brew hot while staying comfortable to hold. Hand-finished with a premium matte textured glaze and a natural cork base that prevents sliding and protects surfaces.',
    price: 24.99,
    category: 'Home & Living',
    stockQuantity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    rating: 4.5,
    reviewsCount: 3,
    createdAt: new Date('2026-02-10').toISOString()
  },
  {
    id: 'prod_5',
    name: 'Smart Health Sport Watch',
    description: 'Your companion for active living. Real-time heart rate monitoring, sleep staging analytics, blood oxygen tracking, and 24 specialized sports modes. Built with durable swim-proof water resistance up to 50 meters and an always-on crisp AMOLED display.',
    price: 179.99,
    category: 'Electronics',
    stockQuantity: 12,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    rating: 4.4,
    reviewsCount: 2,
    createdAt: new Date('2026-02-15').toISOString()
  },
  {
    id: 'prod_6',
    name: 'Minimalist Brass Desk Lamp',
    description: 'Breathe warmth and focused illumination into your workspace. Made of brushed antiqued brass with an adjustable shade arm. Includes a warm 2700K eye-safe flicker-free LED bulb, featuring seamless step-less rotary dimming to customize your atmosphere.',
    price: 79.99,
    category: 'Home & Living',
    stockQuantity: 18,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 2,
    createdAt: new Date('2026-02-20').toISOString()
  },
  {
    id: 'prod_7',
    name: 'Stainless Steel Insulated Bottle',
    description: 'Engineered for exceptional temperature control. Keeps beverages icy cold for 24 hours or steaming hot for 12 hours. Featuring dual-wall vacuum insulation, robust leakproof straw lid, and food-grade BPA-free stainless steel that leaves no metallic taste.',
    price: 34.99,
    category: 'Accessories',
    stockQuantity: 35,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 3,
    createdAt: new Date('2026-03-01').toISOString()
  },
  {
    id: 'prod_8',
    name: 'Premium Heavyweight Hoodie',
    description: 'Wrap yourself in absolute comfort. Crafted from massive 450gsm ultra-soft combed organic cotton with a dry hand feel. Features double-layered hood, kangaroo pouch pocket, and durable ribbed side panels. Pre-shrunk for the ultimate comfortable fit that lasts.',
    price: 69.99,
    category: 'Apparel',
    stockQuantity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 3,
    createdAt: new Date('2026-03-05').toISOString()
  }
];

const initialReviews: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    username: 'Sarah Jenkins',
    rating: 5,
    comment: 'The quality of the leather is outstanding! Smells great and easily fits my 15" MacBook Pro with plenty of space for other daily accessories.',
    createdAt: new Date('2026-02-15').toISOString()
  },
  {
    id: 'rev_2',
    productId: 'prod_1',
    username: 'Mark Davis',
    rating: 4,
    comment: 'Very sleek and comfortable to wear. I wish the water bottle pocket was slightly wider, but overall a premium feeling backpack.',
    createdAt: new Date('2026-03-02').toISOString()
  },
  {
    id: 'rev_3',
    productId: 'prod_1',
    username: 'Elena Rostova',
    rating: 5,
    comment: 'Exceeded all my expectations! Highly recommend if you want to look professional while carrying your laptop to coffee shops.',
    createdAt: new Date('2026-03-10').toISOString()
  },
  {
    id: 'rev_4',
    productId: 'prod_2',
    username: 'Alex Rivera',
    rating: 5,
    comment: 'The noise cancellation is on par with premium brands that cost twice as much. Battery life seems infinite! Very comfortable for long study sessions.',
    createdAt: new Date('2026-02-28').toISOString()
  },
  {
    id: 'rev_5',
    productId: 'prod_2',
    username: 'Chloe Bennett',
    rating: 4,
    comment: 'Sound quality is extremely rich, beautiful bass response. Bass is punchy but not muddy. The app is simple and intuitive.',
    createdAt: new Date('2026-03-12').toISOString()
  }
];

class Database {
  private schema: Schema = {
    users: [],
    products: [],
    reviews: [],
    orders: [],
    orderItems: [],
    carts: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(fileContent);
        // Ensure products are seeded even if db exists but products are empty
        if (!this.schema.products || this.schema.products.length === 0) {
          this.schema.products = initialProducts;
          this.save();
        }
        if (!this.schema.reviews || this.schema.reviews.length === 0) {
          this.schema.reviews = initialReviews;
          this.save();
        }
      } else {
        // Seed default DB
        this.schema.users = [
          {
            id: 'u_admin',
            username: 'admin',
            email: 'admin@store.com',
            passwordHash: hashPassword('admin123'),
            phone: '123-456-7890',
            address: '100 Admin HQ, San Francisco, CA',
            isAdmin: true,
            createdAt: new Date('2026-01-01').toISOString()
          },
          {
            id: 'u_user',
            username: 'jane',
            email: 'user@store.com',
            passwordHash: hashPassword('password123'),
            phone: '987-654-3210',
            address: '456 Willow Avenue, Seattle, WA',
            isAdmin: false,
            createdAt: new Date('2026-01-05').toISOString()
          }
        ];
        this.schema.products = initialProducts;
        this.schema.reviews = initialReviews;
        this.schema.orders = [];
        this.schema.orderItems = [];
        this.schema.carts = {};
        this.save();
      }
    } catch (e) {
      console.error('Failed to initialize local file database:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.schema.users;
  }

  public getUserById(id: string): User | undefined {
    return this.schema.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.schema.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.schema.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.schema.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUserProfile(userId: string, updates: Partial<Pick<User, 'phone' | 'address'>>): User | undefined {
    const userIndex = this.schema.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return undefined;
    this.schema.users[userIndex] = {
      ...this.schema.users[userIndex],
      ...updates
    };
    this.save();
    return this.schema.users[userIndex];
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.schema.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.schema.products.find(p => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewsCount'>): Product {
    const newProduct: Product = {
      ...product,
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };
    this.schema.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | undefined {
    const productIndex = this.schema.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return undefined;
    this.schema.products[productIndex] = {
      ...this.schema.products[productIndex],
      ...updates
    };
    this.save();
    return this.schema.products[productIndex];
  }

  public deleteProduct(productId: string): boolean {
    const productIndex = this.schema.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return false;
    this.schema.products.splice(productIndex, 1);
    
    // Also cleanup reviews and cart entries associated
    this.schema.reviews = this.schema.reviews.filter(r => r.productId !== productId);
    Object.keys(this.schema.carts).forEach(userId => {
      this.schema.carts[userId] = this.schema.carts[userId].filter(c => c.productId !== productId);
    });
    this.save();
    return true;
  }

  // --- Reviews ---
  public getReviewsForProduct(productId: string): Review[] {
    return this.schema.reviews.filter(r => r.productId === productId);
  }

  public addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...review,
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.schema.reviews.push(newReview);
    
    // Recalculate average rating and reviewsCount for the product
    const product = this.getProductById(review.productId);
    if (product) {
      const productReviews = this.getReviewsForProduct(review.productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = parseFloat((totalRating / productReviews.length).toFixed(1));
      this.updateProduct(review.productId, {
        rating: avgRating,
        reviewsCount: productReviews.length
      });
    }

    this.save();
    return newReview;
  }

  // --- Cart operations ---
  public getCart(userId: string): CartItem[] {
    return this.schema.carts[userId] || [];
  }

  public updateCart(userId: string, items: CartItem[]): CartItem[] {
    // Validate inventory availability
    const validatedItems: CartItem[] = [];
    for (const item of items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        // Enforce inventory constraints
        const qty = Math.max(1, Math.min(item.quantity, prod.stockQuantity));
        if (qty > 0) {
          validatedItems.push({ productId: item.productId, quantity: qty });
        }
      }
    }
    this.schema.carts[userId] = validatedItems;
    this.save();
    return validatedItems;
  }

  // --- Orders ---
  public getOrders(userId?: string): Order[] {
    let ordersList = this.schema.orders;
    if (userId) {
      ordersList = ordersList.filter(o => o.userId === userId);
    }
    // Return with items attached
    return ordersList.map(o => ({
      ...o,
      items: this.getOrderItems(o.id)
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(orderId: string): Order | undefined {
    const order = this.schema.orders.find(o => o.id === orderId);
    if (!order) return undefined;
    return {
      ...order,
      items: this.getOrderItems(orderId)
    };
  }

  private getOrderItems(orderId: string): OrderItem[] {
    return this.schema.orderItems
      .filter(item => item.orderId === orderId)
      .map(item => {
        const prod = this.getProductById(item.productId);
        return {
          ...item,
          productName: prod ? prod.name : 'Unknown Product',
          productImageUrl: prod ? prod.imageUrl : ''
        };
      });
  }

  public createOrder(userId: string, orderData: {
    shippingAddress: string;
    paymentMethod: string;
    items: { productId: string; quantity: number }[];
  }): Order {
    const orderId = 'ord_' + Math.random().toString(36).substr(2, 9);
    
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    // Deduct stock and assemble items
    for (const cartItem of orderData.items) {
      const product = this.getProductById(cartItem.productId);
      if (!product) continue;

      const purchasedQty = Math.min(cartItem.quantity, product.stockQuantity);
      if (purchasedQty <= 0) continue;

      // Update product stock
      this.updateProduct(product.id, {
        stockQuantity: product.stockQuantity - purchasedQty
      });

      const price = product.price;
      totalPrice += price * purchasedQty;

      orderItems.push({
        id: 'item_' + Math.random().toString(36).substr(2, 9),
        orderId,
        productId: product.id,
        quantity: purchasedQty,
        priceAtPurchase: price
      });
    }

    const newOrder: Order = {
      id: orderId,
      userId,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      status: OrderStatus.PENDING,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.schema.orders.push(newOrder);
    this.schema.orderItems.push(...orderItems);
    
    // Clear user's cart on success
    this.schema.carts[userId] = [];
    
    this.save();
    return {
      ...newOrder,
      items: this.getOrderItems(orderId)
    };
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
    const orderIndex = this.schema.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return undefined;
    
    this.schema.orders[orderIndex] = {
      ...this.schema.orders[orderIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    this.save();
    return this.getOrderById(orderId);
  }
}

export const db = new Database();
