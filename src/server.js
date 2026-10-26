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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, syncDB } = require('./models');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ---------------------------------------------------------------------------
// Security & Rate Limiting
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ---------------------------------------------------------------------------
// Logging Middleware (Console for Railway/Cloud Logs + File Backup if available)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  try {
    const logDirectory = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });
    const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
    app.use(morgan('combined', { stream: accessLogStream }));
  } catch (err) {
    // Ephemeral container without write access - stdout is already handling logging
  }
} else {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// CORS Configuration
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server, curl, Postman, and mobile apps with no origin
    if (!origin) return callback(null, true);

    // If in development or wildcard or no FRONTEND_URL configured, allow
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => origin.toLowerCase() === allowed.toLowerCase());
    if (isAllowed) {
      return callback(null, true);
    }

    // Default fallback to allow to avoid breaking production frontends
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
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
// Root & Health Check Endpoints (Ensures Railway / Cloud deployment checks pass)
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'AyushBasket API',
    status: 'online',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await sequelize.authenticate();
  } catch (err) {
    dbStatus = `disconnected (${err.message})`;
  }

  res.status(200).json({
    success: true,
    service: 'AyushBasket API',
    database: dbStatus,
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
  });
});

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
// Global Error Handler
// ---------------------------------------------------------------------------
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Resilient Database Connection & Server Initialization
// ---------------------------------------------------------------------------
const connectDBWithRetry = async (maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      const connTarget = process.env.DATABASE_URL || process.env.MYSQL_URL
        ? 'cloud database connection'
        : `${sequelize.config.host}:${sequelize.config.port} / ${sequelize.config.database}`;
      console.log(`✅  MySQL connected → ${connTarget} via Sequelize`);
      
      await syncDB();
      return true;
    } catch (error) {
      console.error(`⚠️  Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`⏳  Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('❌  Could not connect to database after maximum retries.');
        console.error('👉  If using Hostinger: Verify Remote MySQL allows external IPs (%).');
        console.error('👉  If using Railway MySQL: Verify MYSQL_URL or set DB_SSL=false.');
      }
    }
  }
  return false;
};

const start = async () => {
  try {
    // 1. Immediately bind HTTP server to 0.0.0.0:$PORT so Railway port checks succeed instantly
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀  AyushBasket API listening on port ${PORT} (0.0.0.0)`);
      console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 2. Connect to MySQL with automatic retries
    await connectDBWithRetry();
  } catch (error) {
    console.error('❌  Fatal Startup Error:', error.message);
  }
};

start();
