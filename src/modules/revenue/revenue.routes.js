const express = require('express');
const router = express.Router();
const { getRevenue } = require('./revenue.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

router.get('/analytics', protect, admin, getRevenue);

module.exports = router;
