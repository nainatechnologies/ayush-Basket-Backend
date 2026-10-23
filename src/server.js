'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Application entry point and HTTP server initialization
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { sequelize, syncDB } = require('./models');

const app = express(); // trigger nodemon restart again
const PORT = process.env.PORT || 5000;

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Create a write stream (in append mode) for production access logs
if (process.env.NODE_ENV === 'production') {
  const logDirectory = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
  const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === 'production') {
      callback(null, process.env.FRONTEND_URL || 'https://your-production-url.com');
    } else {
      callback(null, origin || true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Necessary if you use cookies
}));
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
})); // Increased slightly in case of very large Base64 images and capturing rawBody for webhooks
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------------
// Global API Logger Middleware
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    let action = 'API Hit';
    const path = req.originalUrl.toLowerCase();

    if (path.includes('/api/orders') && req.method === 'POST') action = 'Order placed by Customer';
    else if (path.includes('/api/orders') && req.method === 'GET') action = 'Orders list accessed';
    else if (path.includes('/api/cart') && req.method === 'POST') action = 'Item added to Cart by Customer';
    else if (path.includes('/api/cart') && req.method === 'GET') action = 'Cart viewed by Customer';
    else if (path.includes('/api/products') && req.method === 'GET') action = 'Products catalog viewed';
    else if (path.includes('/api/products') && req.method === 'POST') action = 'New Product created by Admin';
    else if (path.includes('/api/prescriptions') && req.method === 'POST') action = 'Prescription uploaded by Customer';
    else if (path.includes('/api/prescriptions') && req.method === 'GET') action = 'Prescriptions accessed';
    else if (path.includes('/api/dashboard')) action = 'Admin Dashboard statistics fetched';
    else if (path.includes('/api/revenue')) action = 'Admin Revenue analytics fetched';
    else if (path.includes('/api/auth/login')) action = 'Customer Login Attempt';
    else if (path.includes('/api/admin/login')) action = 'Admin Login Attempt';
    else if (path.includes('support') && req.method === 'POST') {
      action = 'Support ticket submitted';
    }
    console.log(`\n=========================================`);
    console.log(`🔔 [${action}]`);
    console.log(`   Method: ${req.method} | Endpoint: ${req.originalUrl}`);
    console.log(`=========================================\n`);
  }
  next();
});

// ---------------------------------------------------------------------------
// Route Imports
// ---------------------------------------------------------------------------
const authRoutes = require('./modules/auth/auth.routes');
const adminAuthRoutes = require('./modules/admin/admin.routes');
const categoryRoutes = require('./modules/category/category.routes');
const brandRoutes = require('./modules/brand/brand.routes');
const productRoutes = require('./modules/product/product.routes');
const orderRoutes = require('./modules/order/order.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const addressRoutes = require('./modules/address/address.routes');
const userRoutes = require('./modules/user/user.routes');
const prescriptionRoutes = require('./modules/prescription/prescription.routes');
const supportRoutes = require('./modules/support/support.routes');
const revenueRoutes = require('./modules/revenue/revenue.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const couponRoutes = require('./modules/coupon/coupon.routes');
const reviewRoutes = require('./modules/review/review.routes');
const paymentRoutes = require('./modules/payment/payment.routes');

// ---------------------------------------------------------------------------
// Mount Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// ---------------------------------------------------------------------------
// Static File Serving
// ---------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../public/assets/uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// ---------------------------------------------------------------------------
// Health Check (does NOT expose credentials)
// ---------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = 'error';
  }
  const status = dbStatus === 'ok' ? 200 : 503;
  res.status(status).json({
    success: dbStatus === 'ok',
    service: 'AyushBasket API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler (prevents stack trace leaking to clients)
// ---------------------------------------------------------------------------
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start — Connect to DB first, then listen
// ---------------------------------------------------------------------------

const start = async () => {
  try {
    // Connect Sequelize & Sync
    await sequelize.authenticate();
    const connTarget = process.env.DATABASE_URL || process.env.MYSQL_URL
      ? 'cloud database connection'
      : `${process.env.DB_HOST}:${process.env.DB_PORT} / ${process.env.DB_NAME}`;
    console.log(`✅  MySQL connected → ${connTarget} via Sequelize`);
    await syncDB();

    // Start Express
    app.listen(PORT, () => {
      console.log(`🚀  AyushBasket API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌  Startup Error:', error.message);
    process.exit(1);
  }
};

start();
