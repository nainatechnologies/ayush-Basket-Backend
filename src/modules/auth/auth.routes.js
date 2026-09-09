const express = require('express');
const router = express.Router();
const { register, sendRegistrationOtp, resendOtp, login, forgotPassword, verifyOtp, resetPassword, logout } = require('./auth.controller');

const validate = require('../../middleware/validate.middleware');
const { registerSchema, sendRegistrationOtpSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } = require('./auth.validation');

// @route   POST /api/auth/send-registration-otp
// @desc    Send OTP before registration
// @access  Public
router.post('/send-registration-otp', validate(sendRegistrationOtpSchema), sendRegistrationOtp);

// @route   POST /api/auth/resend-otp
// @desc    Resend registration OTP
// @access  Public
router.post('/resend-otp', resendOtp);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(registerSchema), register);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', validate(loginSchema), login);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', logout);

module.exports = router;
