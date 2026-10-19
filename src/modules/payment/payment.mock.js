/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [payment]: payment.mock
 */

const crypto = require('crypto');

/**
 * Mock Razorpay Adapter for Development
 */
class MockRazorpay {
  constructor(options) {
    this.key_id = options.key_id;
    this.key_secret = options.key_secret;
    this.orders = new MockOrders();
  }
}

class MockOrders {
  constructor() {
    this.store = new Map();
  }

  async create(options) {
    const orderId = 'order_mock_' + crypto.randomBytes(8).toString('hex');
    const order = {
      id: orderId,
      entity: 'order',
      amount: options.amount,
      amount_paid: 0,
      amount_due: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      status: 'created',
      attempts: 0,
      notes: options.notes || {},
      created_at: Math.floor(Date.now() / 1000)
    };
    this.store.set(orderId, order);
    return order;
  }
}

const isMockMode = () => {
  return process.env.NODE_ENV === 'development' && process.env.PAYMENT_MODE === 'mock';
};

const generateMockSignature = (orderId, paymentId, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(orderId + "|" + paymentId);
  return hmac.digest('hex');
};

module.exports = {
  MockRazorpay,
  isMockMode,
  generateMockSignature
};
