'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Utility: otpHelper.js
 */

const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string}
 */
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Computes an HMAC-SHA256 hash of the OTP using the server secret salt.
 * Ensures the OTP is never stored in plaintext in the database.
 *
 * @param {string} otp
 * @returns {string} - 64-character hex hash
 */
const hashOTP = (otp) => {
  if (!otp) return '';
  const salt = process.env.OTP_SECRET || process.env.JWT_SECRET || 'ayushbasket_secure_otp_salt';
  return crypto.createHmac('sha256', salt).update(String(otp).trim()).digest('hex');
};

/**
 * Safely verifies an incoming OTP against the stored hash (or legacy plaintext).
 *
 * @param {string} candidateOtp - The user-supplied OTP
 * @param {string} storedHash - The hash stored in the DB (or legacy plaintext)
 * @returns {boolean}
 */
const verifyOTP = (candidateOtp, storedHash) => {
  if (!candidateOtp || !storedHash) return false;

  const candidateHash = hashOTP(candidateOtp);

  // Constant-time comparison for hashed values
  if (storedHash.length === candidateHash.length) {
    try {
      return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return false;
    }
  }

  // Graceful fallback for legacy plaintext entries (length <= 10)
  if (storedHash.length <= 10) {
    return String(candidateOtp).trim() === String(storedHash).trim();
  }

  return false;
};

module.exports = {
  generateSecureOTP,
  hashOTP,
  verifyOTP
};
