/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [payment]: payment.service
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PaymentAttempt, Order, OrderItem, Product, Address, User, sequelize } = require('../../models');
const { MockRazorpay, isMockMode } = require('./payment.mock');
const couponService = require('../coupon/coupon.service');
const smsService = require('../../services/smsService');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  if (isMockMode()) {
    return new MockRazorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'mock_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret'
    });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured in the environment.');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const createPaymentOrder = async (userId, data) => {
  const { orderItems, address_id, couponCode } = data;
  
  if (!orderItems || orderItems.length === 0) {
    throw new Error('Cart is empty');
  }

  const address = await Address.findOne({ where: { id: address_id, userId } });
  if (!address) {
    const error = new Error('Address not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const t = await sequelize.transaction();

  try {
    let totalAmount = 0;
    
    // Calculate total on server
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
      
      if (!product) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }
      const isOutOfStock = Number(product.stock) <= 0 || 
        (product.status && (
          product.status.toLowerCase() === 'out of stock' ||
          product.status.toLowerCase() === 'out_of_stock' ||
          product.status.toLowerCase() === 'inactive' ||
          product.status.toLowerCase() === 'not active'
        ));

      if (isOutOfStock || product.stock < item.quantity) {
        throw new Error(`Product ${product.name} is out of stock`);
      }
      
      const itemPrice = product.offerPrice ? parseFloat(product.offerPrice) : parseFloat(product.price);
      totalAmount += itemPrice * item.quantity;
    }

    let finalAmount = totalAmount;
    let appliedCouponId = null;

    if (couponCode) {
      try {
        const couponValidation = await couponService.validateCouponForCart(couponCode, totalAmount);
        finalAmount -= couponValidation.discountAmount;
        appliedCouponId = couponValidation.coupon.id;
      } catch (err) {
        throw new Error('Invalid coupon: ' + err.message);
      }
    }

    // Razorpay uses paise
    const amountInPaise = Math.round(finalAmount * 100);

    // Create internal order first
    const internalOrder = await Order.create({
      userId,
      addressId: address_id,
      couponId: appliedCouponId,
      totalAmount: finalAmount,
      paymentMethod: 'online', // Using Razorpay
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    // 1. Create Razorpay Order
    const razorpay = getRazorpayInstance();
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${internalOrder.id}`,
      notes: {
        userId: userId,
        internalOrderId: internalOrder.id
      }
    });

    // 2. Create Payment Attempt
    await PaymentAttempt.create({
      internalOrderId: internalOrder.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'pending',
      provider: 'razorpay'
    }, { transaction: t });

    await t.commit();

    return {
      internalOrderId: internalOrder.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'mock_key_id'
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const verifyPayment = async (userId, data) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  const attempt = await PaymentAttempt.findOne({ where: { razorpayOrderId: razorpay_order_id } });
  if (!attempt) {
    throw new Error('Payment attempt not found for this order');
  }

  const internalOrder = await Order.findOne({ where: { id: attempt.internalOrderId, userId } });
  if (!internalOrder) {
    throw new Error('Internal order not found or unauthorized');
  }

  // Verify Signature
  const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    attempt.status = 'failed';
    attempt.notes = JSON.stringify({ error: 'Signature mismatch' });
    await attempt.save();
    throw new Error('Invalid payment signature');
  }

  // Mark as success
  attempt.razorpayPaymentId = razorpay_payment_id;
  attempt.status = 'captured'; // typically captured automatically for simple setups
  await attempt.save();

  internalOrder.paymentStatus = 'paid';
  internalOrder.status = 'pending';
  internalOrder.transactionId = razorpay_payment_id;
  await internalOrder.save();

  // Trigger order-placed SMS for online payment (guarded against duplicates)
  try {
    let recipientPhone = null;
    if (internalOrder.addressId) {
      const addr = await Address.findByPk(internalOrder.addressId);
      recipientPhone = addr?.phone;
    }
    if (!recipientPhone) {
      const u = await User.findByPk(userId, { attributes: ['phone'] });
      recipientPhone = u?.phone;
    }
    if (recipientPhone) {
      smsService.sendOrderPlacedSMS(internalOrder, recipientPhone).catch(err => {
        console.error('[Payment Verification SMS] Non-fatal notification error:', err.message);
      });
    }
  } catch (smsErr) {
    console.error('[Payment Verification SMS] Error resolving phone:', smsErr.message);
  }

  return { success: true, message: 'Payment verified successfully', orderId: internalOrder.id };
};

const handleWebhook = async (event, body) => {
  // Typical events: payment.captured, payment.failed
  // For safety, parse the event
  if (!body.payload || !body.payload.payment || !body.payload.payment.entity) return;

  const paymentEntity = body.payload.payment.entity;
  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  if (!razorpayOrderId) return;

  const attempt = await PaymentAttempt.findOne({ where: { razorpayOrderId } });
  if (!attempt) return;

  const internalOrder = await Order.findByPk(attempt.internalOrderId);
  if (!internalOrder) return;

  if (event === 'payment.captured') {
    attempt.status = 'captured';
    attempt.razorpayPaymentId = razorpayPaymentId;
    await attempt.save();

    if (internalOrder.paymentStatus !== 'paid') {
      internalOrder.paymentStatus = 'paid';
      internalOrder.status = 'pending';
      internalOrder.transactionId = razorpayPaymentId;
      await internalOrder.save();

      // Trigger order-placed SMS via webhook capture
      try {
        let recipientPhone = null;
        if (internalOrder.addressId) {
          const addr = await Address.findByPk(internalOrder.addressId);
          recipientPhone = addr?.phone;
        }
        if (!recipientPhone && internalOrder.userId) {
          const u = await User.findByPk(internalOrder.userId, { attributes: ['phone'] });
          recipientPhone = u?.phone;
        }
        if (recipientPhone) {
          smsService.sendOrderPlacedSMS(internalOrder, recipientPhone).catch(err => {
            console.error('[Payment Webhook SMS] Non-fatal notification error:', err.message);
          });
        }
      } catch (smsErr) {
        console.error('[Payment Webhook SMS] Error resolving phone:', smsErr.message);
      }
    }
  } else if (event === 'payment.failed') {
    attempt.status = 'failed';
    attempt.razorpayPaymentId = razorpayPaymentId;
    await attempt.save();
  }
};

const getProviderStatus = async (orderId, userId) => {
  const internalOrder = await Order.findOne({ where: { id: orderId, userId } });
  if (!internalOrder) {
    throw new Error('Order not found');
  }

  const attempt = await PaymentAttempt.findOne({ 
    where: { internalOrderId: orderId, provider: 'razorpay' },
    order: [['created_at', 'DESC']]
  });

  if (!attempt || !attempt.razorpayOrderId) {
    return { status: internalOrder.paymentStatus };
  }

  // If already paid, just return
  if (internalOrder.paymentStatus === 'paid') {
    return { status: 'paid', razorpayPaymentId: attempt.razorpayPaymentId };
  }

  // Fetch from Razorpay
  try {
    const razorpay = getRazorpayInstance();
    const rzpOrder = await razorpay.orders.fetch(attempt.razorpayOrderId);
    
    if (rzpOrder.status === 'paid') {
      // Reconcile
      attempt.status = 'captured';
      await attempt.save();

      internalOrder.paymentStatus = 'paid';
      internalOrder.status = 'pending';
      await internalOrder.save();

      return { status: 'paid' };
    } else {
      return { status: 'pending' };
    }
  } catch (error) {
    console.error('Error fetching Razorpay order status:', error);
    return { status: internalOrder.paymentStatus };
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getRazorpayInstance,
  getProviderStatus
};
