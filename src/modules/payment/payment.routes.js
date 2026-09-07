const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { protect } = require('../../middleware/authMiddleware');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/status/:orderId', protect, paymentController.getStatus);

// Dev only mock simulation route
router.post('/mock-simulate-success', paymentController.mockSimulateSuccess);

// We need rawBody for webhook
// express.raw must be applied specifically to this route in server.js or using custom middleware.
// But we assume server.js passes rawBody for this webhook if handled correctly.
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

module.exports = router;
