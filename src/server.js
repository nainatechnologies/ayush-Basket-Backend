'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Application entry point and HTTP server initialization.
 */

const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.resolve(__dirname, '../.env'))
  ? path.resolve(__dirname, '../.env')
  : path.resolve(__dirname, '.env');

require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, syncDB } = require('./models');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Railway (like most hosts) terminates TLS at a reverse proxy. Without trusting
// exactly one proxy hop, Express sees the proxy's IP for every request: the rate
// limiter would throttle all users as if they were one client, and logs would be
// useless. `1` means "trust the first proxy in front of the app".
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// CORS
// Allow only the deployed storefront/admin domains and explicitly configured
// origins. FRONTEND_URL, CORS_ORIGIN and DEV_ORIGINS may contain comma-separated
// origins. See src/config/cors.js for the full rules.
// ---------------------------------------------------------------------------

const { buildCorsConfig } = require('./config/cors');

const { allowedOrigins, corsOptions } = buildCorsConfig();

// Register CORS before rate limiting, body parsing, and API routes.
// The cors middleware responds to browser OPTIONS preflight requests.
app.use(cors(corsOptions));

// ---------------------------------------------------------------------------
// Security and rate limiting
// ---------------------------------------------------------------------------

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

app.use('/api', apiLimiter);

// ---------------------------------------------------------------------------
// Request logging
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));

  try {
    const logDirectory = path.join(__dirname, '../logs');
    fs.mkdirSync(logDirectory, { recursive: true });

    const accessLogStream = fs.createWriteStream(
      path.join(logDirectory, 'access.log'),
      { flags: 'a' }
    );

    app.use(morgan('combined', { stream: accessLogStream }));
  } catch (error) {
    console.warn('[LOGGING] File logging unavailable; using console logging.');
  }
} else {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------------
// Global API request logger
// ---------------------------------------------------------------------------

app.use((req, _res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    let action = 'API Hit';
    const requestPath = req.originalUrl.toLowerCase();

    if (requestPath.includes('/api/orders') && req.method === 'POST') {
      action = 'Order placed by Customer';
    } else if (requestPath.includes('/api/orders') && req.method === 'GET') {
      action = 'Orders list accessed';
    } else if (requestPath.includes('/api/cart') && req.method === 'POST') {
      action = 'Item added to Cart by Customer';
    } else if (requestPath.includes('/api/cart') && req.method === 'GET') {
      action = 'Cart viewed by Customer';
    } else if (requestPath.includes('/api/products') && req.method === 'GET') {
      action = 'Products catalog viewed';
    } else if (requestPath.includes('/api/products') && req.method === 'POST') {
      action = 'New Product created by Admin';
    } else if (
      requestPath.includes('/api/prescriptions') &&
      req.method === 'POST'
    ) {
      action = 'Prescription uploaded by Customer';
    } else if (
      requestPath.includes('/api/prescriptions') &&
      req.method === 'GET'
    ) {
      action = 'Prescriptions accessed';
    } else if (requestPath.includes('/api/dashboard')) {
      action = 'Admin Dashboard statistics fetched';
    } else if (requestPath.includes('/api/revenue')) {
      action = 'Admin Revenue analytics fetched';
    } else if (requestPath.includes('/api/auth/login')) {
      action = 'Customer Login Attempt';
    } else if (requestPath.includes('/api/admin/login')) {
      action = 'Admin Login Attempt';
    } else if (requestPath.includes('support') && req.method === 'POST') {
      action = 'Support ticket submitted';
    }

    console.log('\n=========================================');
    console.log(`[${action}]`);
    console.log(`Method: ${req.method} | Endpoint: ${req.originalUrl}`);
    console.log('=========================================\n');
  }

  next();
});

// ---------------------------------------------------------------------------
// Routes
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

// Health check endpoints for hosting platforms
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'AyushBasket API',
    status: 'online',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'ok';

  try {
    await sequelize.authenticate();
  } catch (error) {
    dbStatus = `disconnected (${error.message})`;
  }

  res.status(200).json({
    success: true,
    service: 'AyushBasket API',
    database: dbStatus,
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString()
  });
});

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
// Static assets
// ---------------------------------------------------------------------------

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../public/assets/uploads'))
);
app.use('/public', express.static(path.join(__dirname, '../public')));

// ---------------------------------------------------------------------------
// 404 handler and central error handling
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Database connection with retries
// ---------------------------------------------------------------------------

const connectDBWithRetry = async (maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await sequelize.authenticate();

      const connTarget =
        process.env.DATABASE_URL ||
          process.env.MYSQL_URL ||
          process.env.MYSQL_PRIVATE_URL ||
          process.env.MYSQL_PUBLIC_URL
          ? 'configured cloud database'
          : `${sequelize.config.host}:${sequelize.config.port}/${sequelize.config.database}`;

      console.log(`MySQL connected: ${connTarget}`);

      await syncDB();
      return true;
    } catch (error) {
      console.error(
        `Database connection attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('Database connection failed after maximum retries.');
  return false;
};

// ---------------------------------------------------------------------------
// Start HTTP server
// ---------------------------------------------------------------------------

const start = async () => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AyushBasket API listening on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Allowed browser origins:', [...allowedOrigins]);
  });

  server.on('error', error => {
    console.error('[SERVER] HTTP server error:', error);
    process.exit(1);
  });

  const dbConnected = await connectDBWithRetry();

  if (!dbConnected) {
    console.error(
      'The HTTP server is running, but database-dependent API requests may fail.'
    );
  } else {
    try {
      const { User } = require('./models');
      const bcrypt = require('bcryptjs');
      const adminAccounts = [
        { email: 'admin@ayushbasket.com', name: 'Super Admin' },
        { email: 'ayushbasket.com', name: 'AyushBasket Admin' }
      ];
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      for (const acc of adminAccounts) {
        const existing = await User.findOne({ where: { email: acc.email } });
        if (existing) {
          existing.password = hashedPassword;
          existing.role = 'admin';
          existing.phone = '7569363718';
          await existing.save();
        } else {
          await User.create({
            name: acc.name,
            email: acc.email,
            password: hashedPassword,
            phone: '7569363718',
            role: 'admin'
          });
        }
      }
      console.log('🛡️  Admin credentials verified in database (admin@ayushbasket.com / ayushbasket.com)');
    } catch (adminErr) {
      console.warn('⚠️  Could not auto-verify admin accounts:', adminErr.message);
    }
  }
};

start().catch(error => {
  console.error('[STARTUP] Fatal error:', error);
  process.exit(1);
});

module.exports = app;
