const crypto = require('crypto');
const paymentService = require('./payment.service');
const { PaymentAttempt, Order } = require('../../models');

const createOrder = async (req, res) => {
  try {
    const result = await paymentService.createPaymentOrder(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: result
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating payment order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyPayment(req.user.id, req.body);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(400).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

const webhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
    // When express.raw() is used or verify function is used in express.json, we get req.rawBody
    const rawBody = req.rawBody || req.body; // fallback (dangerous, prefer rawBody)
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).send('Signature missing');
    }

    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(rawBody.toString())
                                    .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature');
    }

    // Since we used rawBody for verification, req.body may need to be parsed if not already
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = body.event;

    await paymentService.handleWebhook(event, body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getStatus = async (req, res) => {
  try {
    const internalOrderId = req.params.orderId;
    const result = await paymentService.getProviderStatus(internalOrderId, req.user.id);

    res.status(200).json({
      success: true,
      status: result.status,
      message: `Payment is ${result.status}`
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    console.error('Error getting status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const mockSimulateSuccess = async (req, res) => {
  // ONLY for development and only if mock mode enabled
  if (process.env.NODE_ENV !== 'development' || process.env.PAYMENT_MODE !== 'mock') {
    return res.status(403).json({ success: false, message: 'Mock simulation disabled in this environment' });
  }

  try {
    const { orderId } = req.body;
    const attempt = await PaymentAttempt.findOne({ where: { internalOrderId: orderId, provider: 'razorpay' }, order: [['created_at', 'DESC']] });
    if (!attempt) return res.status(404).json({ success: false, message: 'No payment attempt found' });

    const razorpay_order_id = attempt.razorpayOrderId;
    const razorpay_payment_id = 'pay_mock_' + Math.random().toString(36).substring(7);
    
    const { generateMockSignature } = require('./payment.mock');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret';
    const razorpay_signature = generateMockSignature(razorpay_order_id, razorpay_payment_id, secret);

    res.status(200).json({
      success: true,
      data: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  webhook,
  getStatus,
  mockSimulateSuccess
};
