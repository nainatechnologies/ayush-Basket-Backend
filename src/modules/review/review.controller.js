/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [review]: review.controller
 */

const reviewService = require('./review.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/response');

// @desc    Customer - Add or Update a Review
// @route   POST /api/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  try {
    const review = await reviewService.addOrUpdateReview(req.user.id, req.body);
    return sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error submitting review');
  }
});

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsForProduct(req.params.productId);
    return sendSuccess(res, 200, 'Reviews fetched', reviews);
  } catch (error) {
    return sendError(res, 500, 'Server error fetching reviews');
  }
});

module.exports = { addReview, getProductReviews };
