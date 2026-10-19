'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Service: Admin Service
 * Purpose: Business logic for administrator authentication, credential recovery, and profile management
 */

const { User, OtpToken } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const loginAdmin = async (email, password) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
  if (!user) {
    const error = new Error('Invalid admin credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid admin credentials.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  };
};

const sendForgotPasswordOtp = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
  if (!user) {
    return { success: true, message: 'If that email is registered, you will receive an OTP.' };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OtpToken.update(
    { used: true },
    { where: { userId: user.id, used: false } }
  );

  await OtpToken.create({
    userId: user.id,
    otp,
    expiresAt
  });

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `AyushBasket Admin Support <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Your Password Reset OTP - AyushBasket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2e6c80; text-align: center;">AyushBasket Password Reset</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your admin account password. Your OTP code is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 4px; letter-spacing: 2px;">
              ${otp}
            </span>
          </div>
          <p style="color: #555; font-size: 14px;">This code will expire in <strong>10 minutes</strong>. If you did not request this reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} AyushBasket. All rights reserved.</p>
        </div>
      `
    });
  } catch (emailError) {
    console.error('[Admin ForgotPassword] Email delivery notice:', emailError.message);
    console.log(`[DEV OTP Notice] OTP for ${user.email} is: ${otp}`);
  }

  return { success: true, message: 'If that email is registered, you will receive an OTP.' };
};

const verifyAdminOtp = async (email, otp) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
  if (!user) {
    const error = new Error('Invalid request.');
    error.statusCode = 400;
    throw error;
  }

  const tokenRecord = await OtpToken.findOne({
    where: { userId: user.id, otp, used: false },
    order: [['created_at', 'DESC']]
  });

  if (!tokenRecord) {
    const error = new Error('Invalid or already used OTP.');
    error.statusCode = 400;
    throw error;
  }

  const expiresTime = typeof tokenRecord.expiresAt === 'string'
    ? new Date(tokenRecord.expiresAt.endsWith('Z') ? tokenRecord.expiresAt : tokenRecord.expiresAt + 'Z').getTime()
    : new Date(tokenRecord.expiresAt).getTime();

  if (Date.now() > expiresTime) {
    const error = new Error('OTP has expired. Please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  const resetToken = jwt.sign(
    { id: user.id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  tokenRecord.used = true;
  await tokenRecord.save();

  return { resetToken };
};

const resetAdminPassword = async (resetToken, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.statusCode = 400;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    const error = new Error('Reset token is invalid or expired. Please restart the process.');
    error.statusCode = 400;
    throw error;
  }

  if (decoded.purpose !== 'password_reset') {
    const error = new Error('Invalid reset token.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(decoded.id);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    const error = new Error('New password must be different from current password.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return true;
};

const changeAdminPassword = async (adminId, currentPassword, newPassword, confirmPassword) => {
  if (newPassword !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(adminId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    const error = new Error('New password must be different from current password.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return true;
};

const getProfile = async (adminId) => {
  const user = await User.findByPk(adminId, {
    attributes: { exclude: ['password'] }
  });
  if (!user) {
    const error = new Error('Admin user not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateProfile = async (adminId, data) => {
  const user = await User.findByPk(adminId);
  if (!user) {
    const error = new Error('Admin user not found.');
    error.statusCode = 404;
    throw error;
  }
  if (data.name && data.name.trim()) user.name = data.name.trim();
  if (data.phone !== undefined) user.phone = data.phone;
  await user.save();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
};

module.exports = {
  loginAdmin,
  sendForgotPasswordOtp,
  verifyAdminOtp,
  resetAdminPassword,
  changeAdminPassword,
  getProfile,
  updateProfile
};
