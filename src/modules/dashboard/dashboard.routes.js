/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [dashboard]: dashboard.routes
 */

const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentOrders } = require('./dashboard.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { getRecentOrdersSchema } = require('./dashboard.validation');

router.route('/stats')
  .get(protect, admin, getDashboardStats);

router.route('/recent-orders')
  .get(protect, admin, validate(getRecentOrdersSchema), getRecentOrders);

module.exports = router;
