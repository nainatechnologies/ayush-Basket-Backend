/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [cart]: cart.routes
 */

const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('./cart.controller');
const { protect } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('./cart.validation');

router.route('/')
  .get(protect, getCart)
  .delete(protect, clearCart);

router.route('/items')
  .post(protect, validate(addToCartSchema), addToCart);

router.route('/items/:id')
  .put(protect, validate(updateCartItemSchema), updateCartItem)
  .delete(protect, removeCartItem);

module.exports = router;
