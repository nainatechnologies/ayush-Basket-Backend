/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [coupon]: coupon.controller
 */

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


const updateCoupon = asyncHandler(async (req, res) => {
  try {
    const coupon = await couponService.updateCouponById(req.params.id, req.body);
    return sendSuccess(res, 200, 'Coupon updated', coupon);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error updating coupon');
  }
});

const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    await couponService.deleteCouponById(req.params.id);
    return sendSuccess(res, 200, 'Coupon deleted');
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error deleting coupon');
  }
});

const getActiveCoupons = asyncHandler(async (req, res) => {
  try {
    const coupons = await couponService.getActiveCoupons();
    return sendSuccess(res, 200, 'Active coupons fetched', coupons);
  } catch (error) {
    return sendError(res, 500, 'Server error fetching active coupons');
  }
});

module.exports = { createCoupon, getAdminCoupons, validateCoupon, updateCoupon, deleteCoupon, getActiveCoupons };

