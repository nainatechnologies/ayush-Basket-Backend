/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Sequelize MySQL database connection and pool configuration
 */

const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (!dbUrl && missing.length > 0) {
  console.error('\n❌  STARTUP ERROR: Missing required database environment variables!');
  console.error('   Missing:', missing.join(', '));
  console.error('\n🔧  Fix for Local Development:');
  console.error('   Create a .env file in the project root by copying .env.example:');
  console.error('   cp .env.example .env');
  console.error('\n🌐  Fix for Cloud Deployment (Render, Railway, Fly.io, Heroku, VPS, etc.):');
  console.error('   Your .env file is excluded by .gitignore and is NOT deployed to the server.');
  console.error('   You must define the environment variables in your hosting provider\'s Dashboard:');
  console.error('   Option 1: Add individual variables:');
  console.error('     - DB_HOST');
  console.error('     - DB_PORT (e.g. 3306)');
  console.error('     - DB_USER');
  console.error('     - DB_PASSWORD');
  console.error('     - DB_NAME');
  console.error('   Option 2: Add a single connection string:');
  console.error('     - DATABASE_URL=mysql://user:password@host:port/dbname');
  console.error('   Also ensure other required secrets are set (e.g. JWT_SECRET, FRONTEND_URL).\n');
  process.exit(1);
}

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
        logging: false, // set to console.log to see SQL queries
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
