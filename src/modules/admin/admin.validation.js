'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Validation: Admin Validation Schemas
 * Purpose: Zod schema definitions for admin authentication and management
 */

const { z } = require('zod');

const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email.'),
    password: z.string().min(1, 'Password is required.')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email.')
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email.'),
    otp: z.string().min(4, 'OTP is required.')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, 'Reset token is required.'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters.')
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters.')
  })
});

module.exports = {
  adminLoginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema
};
