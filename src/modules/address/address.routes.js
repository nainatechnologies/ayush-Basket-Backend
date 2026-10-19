/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [address]: address.routes
 */

const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('./address.controller');
const { protect } = require('../../middleware/authMiddleware');

const validate = require('../../middleware/validate.middleware');
const { addAddressSchema, updateAddressSchema } = require('./address.validation');

router.route('/')
  .get(protect, getAddresses)
  .post(protect, validate(addAddressSchema), addAddress);

router.route('/:id')
  .put(protect, validate(updateAddressSchema), updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;
