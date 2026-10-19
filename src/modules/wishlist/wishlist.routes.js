/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [wishlist]: wishlist.routes
 */

const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('./wishlist.controller');
const { protect } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { addToWishlistSchema } = require('./wishlist.validation');

router.route('/')
  .get(protect, getWishlist)
  .post(protect, validate(addToWishlistSchema), addToWishlist);

router.route('/:id')
  .delete(protect, removeFromWishlist);

module.exports = router;
