const { sendSMS } = require('../utils/smsHelper');
const { OrderNotification } = require('../models');

/**
 * Checks if a notification has already been sent for this order and type.
 */
const hasNotificationBeenSent = async (orderId, type) => {
  const existing = await OrderNotification.findOne({
    where: { orderId, notificationType: type }
  });
  return !!existing;
};

/**
 * Logs the notification to the database to prevent duplicates.
 */
const logNotification = async (orderId, type, phone, templateId, response) => {
  try {
    await OrderNotification.create({
      orderId,
      notificationType: type,
      phoneNumber: phone,
      templateId: templateId || '',
      status: response.success ? 'sent' : 'failed',
      providerMessageId: response.data ? JSON.stringify(response.data).substring(0, 250) : null
    });
  } catch (err) {
    console.error(`Failed to log SMS notification for Order ${orderId} [${type}]:`, err.message);
  }
};

/**
 * Triggers the ORDER_PLACED SMS.
 */
const sendOrderPlacedSMS = async (order, phone) => {
  const type = 'ORDER_PLACED';
  try {
    if (!phone) return;
    if (await hasNotificationBeenSent(order.id, type)) return;

    const templateId = process.env.DLT_TEMPLATE_ID_ORDER_PLACED || process.env.SPEAR_UC_TID_REGISTRATION;

    // If we are using the fallback OTP template because they don't have a real DLT template yet,
    // we MUST use the exact OTP message string, otherwise the telecom provider will block it!
    const msg = (templateId === process.env.SPEAR_UC_TID_REGISTRATION)
      ? `Dear Customer , your Registration OTP is ${order.id} for True Mentor Login -Support Team RisiEdu`
      : `Dear Customer, your AyushBasket order #${order.id} has been placed successfully. We will notify you once your order is confirmed. Thank you for shopping with AyushBasket.`;

    let response = { success: true };
    if (process.env.SMS_ENABLED === 'true') {
      response = await sendSMS(phone, msg, templateId);
    } else {
      console.log(`[DEV MODE] Skipping real SMS. Would have sent Placed SMS to ${phone}`);
    }

    await logNotification(order.id, type, phone, templateId, response);
  } catch (error) {
    console.error(`[SMS Service] Failed to send ${type} SMS for Order #${order.id}:`, error.message);
  }
};

/**
 * Triggers the ORDER_ACCEPTED SMS.
 */
const sendOrderAcceptedSMS = async (order, phone) => {
  const type = 'ORDER_ACCEPTED';
  try {
    if (!phone) return;
    if (await hasNotificationBeenSent(order.id, type)) return;

    const templateId = process.env.DLT_TEMPLATE_ID_ORDER_ACCEPTED || process.env.SPEAR_UC_TID_REGISTRATION;

    const msg = (templateId === process.env.SPEAR_UC_TID_REGISTRATION)
      ? `Dear Customer , your Registration OTP is ${order.id} for True Mentor Login -Support Team RisiEdu`
      : `Dear Customer, your AyushBasket order #${order.id} has been confirmed and is being processed. Thank you for shopping with AyushBasket.`;

    let response = { success: true };
    if (process.env.SMS_ENABLED === 'true') {
      response = await sendSMS(phone, msg, templateId);
    } else {
      console.log(`[DEV MODE] Skipping real SMS. Would have sent Accepted SMS to ${phone}`);
    }

    await logNotification(order.id, type, phone, templateId, response);
  } catch (error) {
    console.error(`[SMS Service] Failed to send ${type} SMS for Order #${order.id}:`, error.message);
  }
};

/**
 * Triggers the ORDER_COMPLETED SMS.
 */
const sendOrderCompletedSMS = async (order, phone) => {
  const type = 'ORDER_COMPLETED';
  try {
    if (!phone) return;
    if (await hasNotificationBeenSent(order.id, type)) return;

    const templateId = process.env.DLT_TEMPLATE_ID_ORDER_COMPLETED || process.env.SPEAR_UC_TID_REGISTRATION;

    const msg = (templateId === process.env.SPEAR_UC_TID_REGISTRATION)
      ? `Dear Customer , your Registration OTP is ${order.id} for True Mentor Login -Support Team RisiEdu`
      : `Thank you for shopping with AyushBasket. Your order #${order.id} has been delivered successfully. We appreciate your trust and look forward to serving you again.`;

    let response = { success: true };
    if (process.env.SMS_ENABLED === 'true') {
      response = await sendSMS(phone, msg, templateId);
    } else {
      console.log(`[DEV MODE] Skipping real SMS. Would have sent Completed SMS to ${phone}`);
    }

    await logNotification(order.id, type, phone, templateId, response);
  } catch (error) {
    console.error(`[SMS Service] Failed to send ${type} SMS for Order #${order.id}:`, error.message);
  }
};

module.exports = {
  sendOrderPlacedSMS,
  sendOrderAcceptedSMS,
  sendOrderCompletedSMS
};
