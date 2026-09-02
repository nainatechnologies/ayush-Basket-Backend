const express = require('express');
const router = express.Router();
const { addOrderItems, getMyOrders, getOrders, getOrderById, updateOrderStatus, cancelOrder } = require('./order.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { addOrderSchema, updateOrderStatusSchema, cancelOrderSchema } = require('./order.validation');

// POST   /api/orders        — place an order (customer)
// GET    /api/orders        — get all orders (admin only)
router.route('/')
  .post(protect, validate(addOrderSchema), addOrderItems)
  .get(protect, admin, getOrders);

// GET    /api/orders/myorders  — get logged-in customer's orders
router.route('/myorders')
  .get(protect, getMyOrders);

// GET    /api/orders/:id       — get a single order (customer sees own, admin sees all)
router.route('/:id')
  .get(protect, getOrderById);

// GET    /api/orders/:id/invoice — download order tax invoice
router.route('/:id/invoice')
  .get(protect, require('./order.controller').downloadInvoice);

// PUT    /api/orders/:id/status   — update order status (admin only)
router.route('/:id/status')
  .put(protect, admin, validate(updateOrderStatusSchema), updateOrderStatus);

// PUT    /api/orders/:id/cancel   — cancel order (customer)
router.route('/:id/cancel')
  .put(protect, validate(cancelOrderSchema), cancelOrder);

module.exports = router;
