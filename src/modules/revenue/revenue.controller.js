/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [revenue]: revenue.controller
 */

const revenueService = require('./revenue.service');

// @desc    Get revenue analytics
// @route   GET /api/revenue/analytics
// @access  Private/Admin
const getRevenue = async (req, res) => {
  try {
    const data = await revenueService.getRevenueData(req.query);
    
    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ success: false, message: 'Server error fetching revenue.' });
  }
};

module.exports = { getRevenue };
