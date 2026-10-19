/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [wishlist]: wishlist.controller
 */

const wishlistService = require('./wishlist.service');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const formatted = await wishlistService.getWishlistForUser(req.user.id);
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const item = await wishlistService.addItemToWishlist(req.user.id, req.body.product_id);
    res.status(201).json({ success: true, message: 'Added to wishlist', data: item });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    await wishlistService.removeItemFromWishlist(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
