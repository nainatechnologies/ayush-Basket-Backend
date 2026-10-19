'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Controller: Admin Controller
 * Purpose: Request dispatching for administrator authentication, password reset, and profile management
 */

const adminService = require('./admin.service');

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const result = await adminService.loginAdmin(email, password);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    res.cookie('token', result.token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Admin Forgot Password
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = await adminService.sendForgotPasswordOtp(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/admin/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    const result = await adminService.verifyAdminOtp(email, otp);
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken: result.resetToken
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Reset Password (after OTP verified)
// @route   POST /api/admin/reset-password
// @access  Public (with resetToken)
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    await adminService.resetAdminPassword(resetToken, newPassword, confirmPassword);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Change Password (when logged in)
// @route   PUT /api/admin/change-password
// @access  Private/Admin
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    await adminService.changeAdminPassword(req.user.id, currentPassword, newPassword, confirmPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
const getAdminProfile = async (req, res, next) => {
  try {
    const user = await adminService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const data = await adminService.updateProfile(req.user.id, { name, phone });
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Admin Logout
// @route   POST /api/admin/logout
// @access  Public
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Admin logged out successfully.' });
};

module.exports = {
  adminLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getAdminProfile,
  updateAdminProfile,
  logout
};
