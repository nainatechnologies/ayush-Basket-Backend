'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Twilio SMS service for order lifecycle and transactional messaging
 */

const { sendSMS, normalizePhoneNumber, maskPhoneNumber } = require('../utils/smsHelper');
const { OrderNotification } = require('../models');

/**
 * Checks if a notification has already been successfully sent for this order and type.
 *
 * @param {number} orderId
 * @param {string} type - 'ORDER_PLACED' | 'ORDER_ACCEPTED' | 'ORDER_COMPLETED'
 * @returns {Promise<boolean>}
 */
const hasNotificationBeenSent = async (orderId, type) => {
  try {
    const existing = await OrderNotification.findOne({
      where: { orderId, notificationType: type, status: 'sent' }
    });
    return !!existing;
  } catch (err) {
    console.error(`[SMS Service] Error checking notification status for Order ${orderId}:`, err.message);
    return false;
  }
};

/**
 * Logs or updates the notification record in the database.
 * Handles the unique index on (order_id, notification_type) safely.
 *
 * @param {number} orderId
 * @param {string} type
 * @param {string} phone
 * @param {string} templateId
 * @param {object} response - { success: boolean, data?: object, error?: string }
 */
const logNotification = async (orderId, type, phone, templateId, response) => {
  try {
    const status = response.success ? 'sent' : 'failed';
    const providerMessageId = response?.data?.sid
      ? String(response.data.sid).substring(0, 250)
      : response?.error
        ? String(response.error).substring(0, 250)
        : null;

    const existing = await OrderNotification.findOne({
      where: { orderId, notificationType: type }
    });

    if (existing) {
      existing.phoneNumber = phone;
      existing.templateId = templateId || '';
      existing.status = status;
      existing.providerMessageId = providerMessageId;
      await existing.save();
    } else {
      await OrderNotification.create({
        orderId,
        notificationType: type,
        phoneNumber: phone,
        templateId: templateId || '',
        status,
        providerMessageId
      });
    }
  } catch (err) {
    console.error(`[SMS Service] Failed to log notification for Order ${orderId} [${type}]:`, err.message);
  }
};

/**
 * 1. Customer receives an order-placed confirmation after an order is successfully created.
 *
 * @param {object} order
 * @param {string} phone
 */
const sendOrderPlacedSMS = async (order, phone) => {
  const type = 'ORDER_PLACED';
  try {
    if (!order || !order.id) return { success: false, message: 'Invalid order.' };

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      console.warn(`[SMS Service] Order #${order.id}: Missing or invalid recipient phone: ${maskPhoneNumber(phone)}`);
      return { success: false, message: 'Invalid phone number.' };
    }

    if (await hasNotificationBeenSent(order.id, type)) {
      console.log(`[SMS Service] Order #${order.id} ${type} notification already sent. Skipping.`);
      return { success: true, message: 'Already sent.' };
    }

    const amountText = order.totalAmount ? ` (Amount: ₹${order.totalAmount})` : '';
    const msg = `Dear Customer, your AyushBasket order #${order.id}${amountText} has been placed successfully. We will notify you once your order is confirmed. Thank you for shopping with AyushBasket.`;

    const response = await sendSMS(normalizedPhone, msg);
    await logNotification(order.id, type, normalizedPhone, '', response);
    return response;
  } catch (error) {
    console.error(`[SMS Service] Error in sendOrderPlacedSMS for Order #${order?.id}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 2. Customer receives an update when the admin accepts/confirms the order for dispatch.
 *
 * @param {object} order
 * @param {string} phone
 */
const sendOrderAcceptedSMS = async (order, phone) => {
  const type = 'ORDER_ACCEPTED';
  try {
    if (!order || !order.id) return { success: false, message: 'Invalid order.' };

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      console.warn(`[SMS Service] Order #${order.id}: Missing or invalid recipient phone: ${maskPhoneNumber(phone)}`);
      return { success: false, message: 'Invalid phone number.' };
    }

    if (await hasNotificationBeenSent(order.id, type)) {
      console.log(`[SMS Service] Order #${order.id} ${type} notification already sent. Skipping.`);
      return { success: true, message: 'Already sent.' };
    }

    const msg = `Dear Customer, your AyushBasket order #${order.id} has been confirmed and is being processed for dispatch. Thank you for shopping with AyushBasket.`;

    const response = await sendSMS(normalizedPhone, msg);
    await logNotification(order.id, type, normalizedPhone, '', response);
    return response;
  } catch (error) {
    console.error(`[SMS Service] Error in sendOrderAcceptedSMS for Order #${order?.id}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 3. Customer receives an update when the admin marks the order out for delivery / dispatched.
 *
 * @param {object} order
 * @param {string} phone
 */
const sendOrderOutForDeliverySMS = async (order, phone) => {
  const type = 'ORDER_OUT_FOR_DELIVERY';
  try {
    if (!order || !order.id) return { success: false, message: 'Invalid order.' };

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      console.warn(`[SMS Service] Order #${order.id}: Missing or invalid recipient phone: ${maskPhoneNumber(phone)}`);
      return { success: false, message: 'Invalid phone number.' };
    }

    if (await hasNotificationBeenSent(order.id, type)) {
      console.log(`[SMS Service] Order #${order.id} ${type} notification already sent. Skipping.`);
      return { success: true, message: 'Already sent.' };
    }

    const msg = `Dear Customer, your AyushBasket order #${order.id} has been dispatched and is out for delivery. Thank you for shopping with AyushBasket.`;

    const response = await sendSMS(normalizedPhone, msg);
    await logNotification(order.id, type, normalizedPhone, '', response);
    return response;
  } catch (error) {
    console.error(`[SMS Service] Error in sendOrderOutForDeliverySMS for Order #${order?.id}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 4. Customer receives a thank-you message after the order is delivered or marked complete.
 * Triggered strictly once.
 *
 * @param {object} order
 * @param {string} phone
 */
const sendOrderCompletedSMS = async (order, phone) => {
  const type = 'ORDER_COMPLETED';
  try {
    if (!order || !order.id) return { success: false, message: 'Invalid order.' };

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      console.warn(`[SMS Service] Order #${order.id}: Missing or invalid recipient phone: ${maskPhoneNumber(phone)}`);
      return { success: false, message: 'Invalid phone number.' };
    }

    if (await hasNotificationBeenSent(order.id, type)) {
      console.log(`[SMS Service] Order #${order.id} ${type} thank-you message already sent. Skipping.`);
      return { success: true, message: 'Already sent.' };
    }

    const msg = `Thank you for shopping with AyushBasket! Your order #${order.id} has been delivered successfully. We appreciate your trust and look forward to serving you again.`;

    const response = await sendSMS(normalizedPhone, msg);
    await logNotification(order.id, type, normalizedPhone, '', response);
    return response;
  } catch (error) {
    console.error(`[SMS Service] Error in sendOrderCompletedSMS for Order #${order?.id}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Optional: Prescription uploaded notification
 *
 * @param {object} prescription
 * @param {string} phone
 */
const sendPrescriptionUploadedSMS = async (prescription, phone) => {
  const type = 'PRESCRIPTION_UPLOADED';
  try {
    if (!prescription || !prescription.id) return;
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return;

    const msg = `Dear Customer, your AyushBasket prescription upload #${prescription.id} has been received successfully. We will call you shortly to confirm your order. Thank you.`;
    const response = await sendSMS(normalizedPhone, msg);
    await logNotification(prescription.id, type, normalizedPhone, '', response);
  } catch (error) {
    console.error(`[SMS Service] Error in sendPrescriptionUploadedSMS for Prescription #${prescription?.id}:`, error.message);
  }
};

module.exports = {
  sendOrderPlacedSMS,
  sendOrderAcceptedSMS,
  sendOrderOutForDeliverySMS,
  sendOrderCompletedSMS,
  sendPrescriptionUploadedSMS,
  hasNotificationBeenSent,
  logNotification
};
