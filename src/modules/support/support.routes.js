const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getAllTickets, resolveTicket } = require('./support.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { createTicketSchema, resolveTicketSchema } = require('./support.validation');

// Customer routes
router.post('/', protect, validate(createTicketSchema), createTicket);
router.get('/my', protect, getMyTickets);

// Admin routes
router.get('/admin', protect, admin, getAllTickets);
router.put('/admin/:id/resolve', protect, admin, validate(resolveTicketSchema), resolveTicket);

module.exports = router;
