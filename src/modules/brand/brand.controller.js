'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Controller: Brand Controller
 * Purpose: Request dispatching for brand catalog queries
 */

const brandService = require('./brand.service');

const getAllBrands = async (req, res, next) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBrands
};
