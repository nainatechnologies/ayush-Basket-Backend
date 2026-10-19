'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Model: PaymentAttempt
 * Purpose: Sequelize model definition for payment attempt tracking and transaction state
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const PaymentAttempt = sequelize.define('PaymentAttempt', {
  internalOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'internal_order_id'
  },
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'razorpay_order_id'
  },
  razorpayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'razorpay_payment_id'
  },
  amount: {
    type: DataTypes.INTEGER, // in paise
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending' // pending, authorized, captured, failed, refunded
  },
  provider: {
    type: DataTypes.STRING(50),
    defaultValue: 'razorpay'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payment_attempts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PaymentAttempt;
