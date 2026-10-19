/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [user]: user.routes
 */

const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, changePassword } = require('./user.controller');
const { protect } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('./user.validation');

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validate(updateProfileSchema), updateUserProfile);

router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

module.exports = router;
