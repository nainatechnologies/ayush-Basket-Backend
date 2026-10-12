'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for sensitive OTP generation and resend endpoints.
 * Limits to 5 requests per 10 minutes per IP.
 */
const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait a few minutes before trying again.'
  }
});

/**
 * Strict rate limiter for OTP verification attempts to prevent brute-force code guessing.
 * Limits to 10 verification attempts per 10 minutes per IP.
 */
const otpVerifyRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 verification attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please wait a few minutes before trying again.'
  }
});

module.exports = {
  otpRateLimiter,
  otpVerifyRateLimiter
};
