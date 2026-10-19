/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [review]: review.routes
 */

const express = require('express');
const router = express.Router();
const { addReview, getProductReviews } = require('./review.controller');
const { protect } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { addReviewSchema } = require('./review.validation');

router.post('/', protect, validate(addReviewSchema), addReview);
router.get('/product/:productId', getProductReviews);

module.exports = router;
