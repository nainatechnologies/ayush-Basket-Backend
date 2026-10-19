/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [admin]: admin.routes
 */

const express = require('express');
const router = express.Router();
const { adminLogin, forgotPassword, verifyOtp, resetPassword, changePassword, getAdminProfile, updateAdminProfile, logout } = require('./admin.controller');
const { getAllCustomers } = require('../user/user.controller');
const { protect, admin } = require('../../middleware/authMiddleware');

// Public
router.post('/login', adminLogin);
router.post('/logout', logout);
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

// --------------------------------------------------------
// ALIASES FOR FRONTEND EXPECTATIONS (/api/admin/...)
// --------------------------------------------------------
const validate = require('../../middleware/validate.middleware');

// Support
const { getAllTickets, resolveTicket } = require('../support/support.controller');
const { resolveTicketSchema } = require('../support/support.validation');
router.get('/support', protect, admin, getAllTickets);
router.put('/support/:id/resolve', protect, admin, validate(resolveTicketSchema), resolveTicket);

// Prescriptions
const { getAllPrescriptions, getPrescriptionById, approvePrescription, rejectPrescription } = require('../prescription/prescription.controller');
const { approvePrescriptionSchema } = require('../prescription/prescription.validation');
router.get('/prescriptions', protect, admin, getAllPrescriptions);
router.get('/prescriptions/:id', protect, admin, getPrescriptionById);
router.put('/prescriptions/:id/approve', protect, admin, validate(approvePrescriptionSchema), approvePrescription);
router.put('/prescriptions/:id/reject', protect, admin, rejectPrescription);

// Revenue
const { getRevenue } = require('../revenue/revenue.controller');
const { getRevenueSchema } = require('../revenue/revenue.validation');
router.get('/revenue', protect, admin, validate(getRevenueSchema), getRevenue);

module.exports = router;
