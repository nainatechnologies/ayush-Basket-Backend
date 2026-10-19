/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [user]: user.controller
 */

const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/response');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    return sendSuccess(res, 200, 'Profile fetched', user);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error fetching profile');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 200, 'Profile updated', {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gstNumber: user.gstNumber,
      createdAt: user.created_at
    });
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error updating profile');
  }
});

// @desc    Get all customers (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllCustomers = asyncHandler(async (req, res) => {
  try {
    const formattedCustomers = await userService.getAllCustomersWithStats();
    return sendSuccess(res, 200, 'Customers fetched', formattedCustomers, { count: formattedCustomers.length });
  } catch (error) {
    return sendError(res, 500, 'Server error fetching customers');
  }
});

// @desc    Customer – Change Password (when logged in)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changeUserPassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, 200, 'Password changed successfully.');
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error changing password');
  }
});

module.exports = { getUserProfile, updateUserProfile, getAllCustomers, changePassword };
