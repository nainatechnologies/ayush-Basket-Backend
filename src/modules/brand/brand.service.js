'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Service: Brand Service
 * Purpose: Business logic and database operations for manufacturer brands
 */

const Brand = require('./brand.model');

const getAllBrands = async () => {
  return await Brand.findAll();
};

const getBrandById = async (id) => {
  const brand = await Brand.findByPk(id);
  if (!brand) {
    const error = new Error('Brand not found.');
    error.statusCode = 404;
    throw error;
  }
  return brand;
};

module.exports = {
  getAllBrands,
  getBrandById
};
