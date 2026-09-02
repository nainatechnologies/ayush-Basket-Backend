const { z } = require('zod');

// Indian Mobile Number pattern (10 digits starting with 6,7,8,9)
const indianPhoneRegex = /^[6-9]\d{9}$/;

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

const sendRegistrationOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number')
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number')
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
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
