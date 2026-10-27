/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [auth]: auth.validation
 */

const { z } = require('zod');

// Indian Mobile Number pattern (10 digits starting with 6,7,8,9)
const indianPhoneRegex = /^[6-9]\d{9}$/;

// Password pattern: one uppercase, one lowercase, one number, one special char, length 6 to 8
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/;
const passwordErrorMessage = 'Password must be 6 to 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.';

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().regex(passwordRegex, passwordErrorMessage),
    phone: z.string().transform(v => v.replace(/\D/g, '').slice(-10)).refine(v => indianPhoneRegex.test(v), 'Please enter a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

const sendRegistrationOtpSchema = z.object({
  body: z.object({
    phone: z.string().transform(v => v.replace(/\D/g, '').slice(-10)).refine(v => indianPhoneRegex.test(v), 'Please enter a valid 10-digit Indian mobile number')
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required')
  }).refine(
    (data) => Boolean((data.email && data.email.trim()) || (data.phone && data.phone.trim()) || (data.identifier && data.identifier.trim())),
    {
      message: 'Please provide email or phone number',
      path: ['email']
    }
  )
});

const forgotPasswordSchema = z.object({
  body: z.object({
    phone: z.string().transform(v => v.replace(/\D/g, '').slice(-10)).refine(v => indianPhoneRegex.test(v), 'Please enter a valid 10-digit Indian mobile number')
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().transform(v => v.replace(/\D/g, '').slice(-10)).refine(v => indianPhoneRegex.test(v), 'Please enter a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().regex(passwordRegex, passwordErrorMessage),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
});

module.exports = {
  registerSchema,
  sendRegistrationOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema
};
