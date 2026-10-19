'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Controller: Category Controller
 * Purpose: Request dispatching for category retrieval and category-filtered products
 */

const categoryService = require('./category.service');
const productService = require('../product/product.service');
const jwt = require('jsonwebtoken');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    let userId = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Optional auth
      }
    }
    
    const formatted = await productService.getCustomerProducts({ category: categoryId }, userId);
    res.status(200).json({ success: true, count: formatted.length, data: formatted, products: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getProductsByCategory
};
