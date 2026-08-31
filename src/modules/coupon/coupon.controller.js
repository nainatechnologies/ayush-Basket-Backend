const couponService = require('./coupon.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/response');

// @desc    Admin - Create Coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await couponService.createNewCoupon(req.body);
    return sendSuccess(res, 201, 'Coupon created successfully', coupon);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error creating coupon');
  }
});

// @desc    Admin - Get All Coupons
// @route   GET /api/coupons/admin
// @access  Private/Admin
const getAdminCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await couponService.getAllCoupons();
    return sendSuccess(res, 200, 'Coupons fetched', coupons);
  } catch (error) {
    return sendError(res, 500, 'Server error fetching coupons');
  }
});

// @desc    Customer - Validate Coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const result = await couponService.validateCouponForCart(code, cartTotal);
    return sendSuccess(res, 200, 'Coupon applied successfully', result);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error validating coupon');
  }
});

module.exports = { createCoupon, getAdminCoupons, validateCoupon };
