const express = require('express');
const router = express.Router();
const { createCoupon, getAdminCoupons, validateCoupon } = require('./coupon.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { createCouponSchema, validateCouponSchema } = require('./coupon.validation');

router.post('/validate', protect, validate(validateCouponSchema), validateCoupon);
router.post('/', protect, admin, validate(createCouponSchema), createCoupon);
router.get('/admin', protect, admin, getAdminCoupons);

module.exports = router;
