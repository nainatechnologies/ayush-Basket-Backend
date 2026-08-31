const express = require('express');
const router = express.Router();
const { getRevenue } = require('./revenue.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { getRevenueSchema } = require('./revenue.validation');

router.get('/', protect, admin, validate(getRevenueSchema), getRevenue);

module.exports = router;
