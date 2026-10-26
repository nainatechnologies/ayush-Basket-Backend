/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Sequelize MySQL database connection and pool configuration
 */

const { Sequelize } = require('sequelize');

// Support both standard DB_* and Railway MYSQL* environment variables
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_PUBLIC_URL;

const host = process.env.DB_HOST || process.env.MYSQLHOST || '193.203.184.99';
const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);
const user = process.env.DB_USER || process.env.MYSQLUSER || 'u237482260_ayushuser';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQLPASSWORD !== undefined ? process.env.MYSQLPASSWORD : 'Ayush@2026DB@#');
const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'u237482260_ayushbasket';

// Fallback defaults for application secrets and URLs (does not override system PORT)
const defaults = {
  JWT_SECRET: 'your_super_secret_jwt_key_here',
  SMS_ENABLED: 'true',
  BACKEND_URL: 'https://ayush-basket-backend-production.up.railway.app',
  RAZORPAY_KEY_ID: 'rzp_test_Tk7byRyi447zkb',
  RAZORPAY_KEY_SECRET: 'TH09BE3oOUjDUVZG8LK1VaaJ',
  RAZORPAY_WEBHOOK_SECRET: 'AyushBasket_Wh_Secret_2026!',
  PAYMENT_MODE: 'live',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// Smart SSL Detection:
// - Never force SSL on Railway internal network (railway.internal) or localhost
// - Only enable SSL if explicitly requested via DB_SSL=true or for external cloud DBs
const isInternalHost = Boolean(
  (dbUrl && (dbUrl.includes('railway.internal') || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) ||
  (host && (host.includes('railway.internal') || host.includes('localhost') || host === '127.0.0.1'))
);

const dialectOptions = {
  connectTimeout: 60000,
};

if (process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  };
} else if (process.env.DB_SSL === 'false' || isInternalHost) {
  // Explicitly disable SSL for internal networks or when DB_SSL=false
  delete dialectOptions.ssl;
} else if (Boolean(dbUrl) && process.env.NODE_ENV === 'production') {
  // External cloud MySQL URL in production
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

const poolConfig = {
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
  min: process.env.NODE_ENV === 'production' ? 2 : 0,
  acquire: 60000,
  idle: 10000
};

const retryConfig = {
  match: [/Deadlock/i, /SequelizeConnectionError/i, /ECONNREFUSED/i, /ETIMEDOUT/i],
  max: 3,
};

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: poolConfig,
      retry: retryConfig,
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    })
  : new Sequelize(
      database,
      user,
      password,
      {
        host,
        port,
        dialect: 'mysql',
        logging: false,
        dialectOptions,
        pool: poolConfig,
        retry: retryConfig,
        define: {
          underscored: true,
          timestamps: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at'
        }
      }
    );

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    const connTarget = dbUrl
      ? 'cloud database connection'
      : `${host}:${port} / ${database}`;
    console.log(`✅  MySQL connected → ${connTarget} via Sequelize`);
    return true;
  } catch (error) {
    console.error('❌  MySQL Connection Error via Sequelize:', error.message);
    return false;
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
