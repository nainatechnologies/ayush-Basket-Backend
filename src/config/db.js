/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Sequelize MySQL database connection and pool configuration
 */

const { Sequelize } = require('sequelize');

// ---------------------------------------------------------------------------
// Default configuration (used when environment variables are not set)
// For production, set these via your hosting provider's environment variables.
// ---------------------------------------------------------------------------
const defaults = {
  DB_HOST: '193.203.184.99',
  DB_PORT: '3306',
  DB_USER: 'u237482260_ayushuser',
  DB_PASSWORD: 'Ayush@2026DB@#',
  DB_NAME: 'u237482260_ayushbasket',
  JWT_SECRET: 'your_super_secret_jwt_key_here',
  PORT: '5000',
  SMS_ENABLED: 'true',
  BACKEND_URL: 'http://192.168.0.3:5000',
  RAZORPAY_KEY_ID: 'rzp_test_Tk7byRyi447zkb',
  RAZORPAY_KEY_SECRET: 'TH09BE3oOUjDUVZG8LK1VaaJ',
  RAZORPAY_WEBHOOK_SECRET: 'AyushBasket_Wh_Secret_2026!',
  PAYMENT_MODE: 'live',
};

// Apply defaults — only sets a variable if it's not already defined in the environment
for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

const dialectOptions = {};
if (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false' && Boolean(dbUrl))) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  };
}

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false,
      dialectOptions,
      pool: {
        max: process.env.NODE_ENV === 'production' ? 20 : 5,
        min: process.env.NODE_ENV === 'production' ? 2 : 0,
        acquire: 60000,
        idle: 10000
      },
      retry: {
        match: [/Deadlock/i, /SequelizeConnectionError/i],
        max: 3,
      },
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
        logging: false,
        dialectOptions,
        pool: {
          max: process.env.NODE_ENV === 'production' ? 20 : 5,
          min: process.env.NODE_ENV === 'production' ? 2 : 0,
          acquire: 60000,
          idle: 10000
        },
        retry: {
          match: [/Deadlock/i, /SequelizeConnectionError/i],
          max: 3,
        },
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
      : `${process.env.DB_HOST}:${process.env.DB_PORT} / ${process.env.DB_NAME}`;
    console.log(`✅  MySQL connected → ${connTarget} via Sequelize`);
  } catch (error) {
    console.error('❌  MySQL Connection Error via Sequelize:', error.message);
    process.exit(1);
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
