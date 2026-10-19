/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [brand]: brand.routes
 */

const express = require('express');
const router = express.Router();
const brandController = require('./brand.controller');

router.get('/', brandController.getAllBrands);

module.exports = router;
