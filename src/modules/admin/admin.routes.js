const express = require('express');
const router = express.Router();
const { adminLogin, forgotPassword, verifyOtp, resetPassword, changePassword, getAdminProfile, updateAdminProfile } = require('./admin.controller');
const { getAllCustomers } = require('../user/user.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

// Public
router.post('/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected – must be logged in as admin
router.put('/change-password', protect, admin, changePassword);

// Admin Profile
router.get('/profile', protect, admin, getAdminProfile);
router.put('/profile', protect, admin, updateAdminProfile);

// Admin – List all customers
router.get('/customers', protect, admin, getAllCustomers);

module.exports = router;
