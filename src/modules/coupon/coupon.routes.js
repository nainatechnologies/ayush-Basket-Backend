/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [coupon]: coupon.routes
 */

const express = require('express');
const router = express.Router();
const { createCoupon, getAdminCoupons, validateCoupon, updateCoupon, deleteCoupon, getActiveCoupons } = require('./coupon.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { createCouponSchema, validateCouponSchema } = require('./coupon.validation');

router.post('/validate', validate(validateCouponSchema), validateCoupon);
router.get('/active', getActiveCoupons);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);
router.post('/', protect, admin, validate(createCouponSchema), createCoupon);
router.get('/admin', protect, admin, getAdminCoupons);

module.exports = router;
