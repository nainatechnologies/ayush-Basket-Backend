/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [category]: category.routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');

router.get('/', categoryController.getAllCategories);
router.get('/:id/products', categoryController.getProductsByCategory);

module.exports = router;
