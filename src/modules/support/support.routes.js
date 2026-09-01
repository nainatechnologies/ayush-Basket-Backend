const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getAllTickets, resolveTicket } = require('./support.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { createTicketSchema, resolveTicketSchema } = require('./support.validation');
const upload = require('../../middleware/uploadMiddleware');

// Customer routes
router.post('/', protect, upload.none(), (req, res, next) => {
  require('fs').writeFileSync('support_debug.json', JSON.stringify(req.body, null, 2));
  next();
}, validate(createTicketSchema), createTicket);
router.get('/my', protect, getMyTickets);

// Admin routes
router.get('/admin', protect, admin, getAllTickets);
router.put('/admin/:id/resolve', protect, admin, validate(resolveTicketSchema), resolveTicket);

module.exports = router;
