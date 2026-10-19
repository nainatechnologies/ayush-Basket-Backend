/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [revenue]: revenue.routes
 */

const express = require('express');
const router = express.Router();
const { getRevenue } = require('./revenue.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

router.get('/analytics', protect, admin, getRevenue);

module.exports = router;
