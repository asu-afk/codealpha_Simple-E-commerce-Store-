/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db, hashPassword } from './src/server/db';
import { OrderStatus, Order } from './src/types';

// Load env variables
dotenv.config();

const PORT = 3000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'e_commerce_secure_token_secret_key_7781';

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for generating tokens
function generateToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

// Helper for verifying tokens
function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = Buffer.from(parts[0], 'base64').toString('utf-8');
    const signature = parts[1];
    const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch (e) {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }
    const user = db.getUserById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    // Attach user session details
    req.body.userContext = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: !!user.isAdmin
    };
    next();
  };

  const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
    authenticateUser(req, res, () => {
      if (!req.body.userContext.isAdmin) {
        res.status(403).json({ error: 'Administrator privileges required' });
        return;
      }
      next();
    });
  };

  // --- API Endpoints ---

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password, phone, address } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters long' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if email or username already exists
    if (db.getUserByEmail(email)) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    if (db.getUserByUsername(username)) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }

    const passwordHash = hashPassword(password);
    const user = db.createUser({
      username,
      email,
      passwordHash,
      phone: phone || '',
      address: address || '',
      isAdmin: false
    });

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: !!user.isAdmin,
        createdAt: user.createdAt
      }
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: !!user.isAdmin,
        createdAt: user.createdAt
      }
    });
  });

  // Auth: Current User Details
  app.get('/api/auth/me', authenticateUser, (req, res) => {
    const user = db.getUserById(req.body.userContext.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: !!user.isAdmin,
        createdAt: user.createdAt
      }
    });
  });

  // Auth: Update Profile Details
  app.put('/api/auth/profile', authenticateUser, (req, res) => {
    const { phone, address } = req.body;
    const updated = db.updateUserProfile(req.body.userContext.userId, { phone, address });
    if (!updated) {
      res.status(404).json({ error: 'User profile update failed' });
      return;
    }
    res.json({
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        isAdmin: !!updated.isAdmin,
        createdAt: updated.createdAt
      }
    });
  });

  // Products: Retrieve All with filtering, search, and sorting
  app.get('/api/products', (req, res) => {
    const { search, category, sort } = req.query;
    let products = db.getProducts();

    // 1. Search filter
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    // 2. Category filter
    if (category && typeof category === 'string' && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // 3. Sorting
    if (sort && typeof sort === 'string') {
      if (sort === 'price_asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    res.json(products);
  });

  // Products: Single Product Details with reviews
  app.get('/api/products/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const reviews = db.getReviewsForProduct(product.id);
    res.json({
      ...product,
      reviews
    });
  });

  // Products: Add a review for a product
  app.post('/api/products/:id/reviews', authenticateUser, (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const product = db.getProductById(productId);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
      return;
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      res.status(400).json({ error: 'Comment must be at least 3 characters' });
      return;
    }

    const newReview = db.addReview({
      productId,
      username: req.body.userContext.username,
      rating,
      comment: comment.trim()
    });

    res.status(201).json(newReview);
  });

  // Admin Product Creation
  app.post('/api/products', authenticateAdmin, (req, res) => {
    const { name, description, price, category, stockQuantity, imageUrl } = req.body;
    if (!name || !description || price === undefined || !category || stockQuantity === undefined || !imageUrl) {
      res.status(400).json({ error: 'All fields (name, description, price, category, stockQuantity, imageUrl) are required' });
      return;
    }

    const newProd = db.createProduct({
      name,
      description,
      price: Number(price),
      category,
      stockQuantity: Number(stockQuantity),
      imageUrl
    });

    res.status(201).json(newProd);
  });

  // Admin Product Update
  app.put('/api/products/:id', authenticateAdmin, (req, res) => {
    const { name, description, price, category, stockQuantity, imageUrl } = req.body;
    const updated = db.updateProduct(req.params.id, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      category,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
      imageUrl
    });

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(updated);
  });

  // Admin Product Deletion
  app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });

  // Shopping Cart: Retrieve saved cart
  app.get('/api/cart', authenticateUser, (req, res) => {
    const cart = db.getCart(req.body.userContext.userId);
    res.json(cart);
  });

  // Shopping Cart: Update saved cart
  app.post('/api/cart', authenticateUser, (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }
    const updated = db.updateCart(req.body.userContext.userId, items);
    res.json(updated);
  });

  // Orders: Retrieve past orders
  app.get('/api/orders', authenticateUser, (req, res) => {
    const { userId, isAdmin } = req.body.userContext;
    // Admins can request all, standard users only see their own
    if (isAdmin) {
      const allOrders = db.getOrders();
      res.json(allOrders);
    } else {
      const userOrders = db.getOrders(userId);
      res.json(userOrders);
    }
  });

  // Orders: Create a new order
  app.post('/api/orders', authenticateUser, (req, res) => {
    const { shippingAddress, paymentMethod, items } = req.body;
    if (!shippingAddress || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Shipping address, payment method, and non-empty items array are required' });
      return;
    }

    try {
      const order = db.createOrder(req.body.userContext.userId, {
        shippingAddress,
        paymentMethod,
        items
      });
      res.status(201).json(order);
    } catch (e) {
      res.status(500).json({ error: 'Order creation failed due to database or validation error' });
    }
  });

  // Orders: Single Order Status details
  app.get('/api/orders/:id', authenticateUser, (req, res) => {
    const { userId, isAdmin } = req.body.userContext;
    const order = db.getOrderById(req.params.id);
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== userId && !isAdmin) {
      res.status(403).json({ error: 'Access denied to this order' });
      return;
    }

    res.json(order);
  });

  // Admin Order Status Update
  app.put('/api/orders/:id/status', authenticateAdmin, (req, res) => {
    const { status } = req.body;
    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const updated = db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(updated);
  });

  // AI Assistant: Contextual recommendations & inventory chatting
  app.post('/api/ai/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    try {
      const products = db.getProducts();
      
      // Structure inventory details so Gemini has exact product specs to recommend real products
      const productsListStr = products.map(p => 
        `- [Product ID: ${p.id}] "${p.name}" in category "${p.category}" costs $${p.price}. Description: ${p.description} (Stock: ${p.stockQuantity}, Rating: ${p.rating}/5)`
      ).join('\n');

      const systemPrompt = `You are "Gemini Shop Companion", an ultra-helpful, highly charming, and precise AI shopping assistant in a premium e-commerce web application.
Your goal is to guide users to find real products in our store, answer questions about inventory, and suggest items matching their preferences.

Strict rules:
1. ONLY recommend products that exist in the inventory list below. Do NOT invent, hallucinate, or suggest any products that are not explicitly present.
2. If a user asks for something we don't have, politely explain we don't carry it, and suggest the closest alternative from our real inventory (or let them know).
3. Use formatted Markdown with bold names, lists, and clear spacing.
4. Keep answers friendly, exciting, and highly legible, with an elegant, helpful tone.

CURRENT PRODUCT INVENTORY IN THE STORE:
${productsListStr}

Respond to the user's conversation history elegantly. Provide clear product suggestions when appropriate.`;

      // Transform history into contents format for @google/genai SDK
      // Map user/assistant sender to correct role 'user' / 'model'
      const contents = messages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const responseText = aiResponse.text || "I'm sorry, I couldn't process that request. Let me know if I can help you find any products!";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error('Gemini chat API error:', error);
      res.status(500).json({ 
        error: 'AI Companion failed to respond', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });


  // --- Vite Dev Server Middleware / Static Production Serve ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Commerce Store server started at http://localhost:${PORT}`);
  });
}

startServer();
