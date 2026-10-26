/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [auth]: auth.service
 */

const { Op } = require('sequelize');
const { User, OtpToken, RegistrationOtp } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  sendSMS,
  sendTwilioVerifyOTP,
  checkTwilioVerifyOTP,
  normalizePhoneNumber,
  maskPhoneNumber
} = require('../../utils/smsHelper');
const { generateSecureOTP, hashOTP, verifyOTP } = require('../../utils/otpHelper');

/**
 * Returns an array of phone format variants (10-digit national, E.164 +91, with/without prefixes)
 * so database lookups match regardless of how the phone was previously stored.
 */
const getPhoneVariants = (phone) => {
  if (!phone) return [];
  const raw = String(phone).trim();
  const digits = raw.replace(/\D/g, '').slice(-10);
  const e164 = normalizePhoneNumber(raw);
  const variants = new Set();
  if (e164) variants.add(e164);
  if (digits && digits.length === 10) {
    variants.add(digits);
    variants.add(`+91${digits}`);
    variants.add(`91${digits}`);
    variants.add(`0${digits}`);
  } else if (raw) {
    variants.add(raw);
  }
  return Array.from(variants);
};

const resendRegistrationOTP = async (phone) => {
  const phoneVariants = getPhoneVariants(phone);
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || phoneVariants.length === 0) {
    const error = new Error('Invalid phone number format.');
    error.statusCode = 400;
    throw error;
  }

  // Check user doesn't already exist
  const existingPhone = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });
  if (existingPhone) {
    const error = new Error('An account with this phone number already exists. Please login.');
    error.statusCode = 409;
    throw error;
  }

  // Invalidate old unused OTPs for this phone
  await RegistrationOtp.update({ used: true }, { where: { phone: { [Op.in]: phoneVariants }, used: false } });

  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (verifyServiceSid) {
    const verifyRes = await sendTwilioVerifyOTP(normalizedPhone);
    if (verifyRes.success) {
      await RegistrationOtp.create({
        phone: normalizedPhone,
        otp: 'TWILIO_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false
      });
      return true;
    }
  }

  const otp = generateSecureOTP();
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await RegistrationOtp.create({ phone: normalizedPhone, otp: hashedOtp, expiresAt, used: false });

  console.log(`[AUTH] Resending Registration OTP to ${maskPhoneNumber(normalizedPhone)}`);

  const message = `Dear Customer, your OTP is ${otp} for AyushBasket registration. Valid for 10 minutes.`;
  await sendSMS(normalizedPhone, message);

  return true;
};

const sendRegistrationOTP = async (phone) => {
  const phoneVariants = getPhoneVariants(phone);
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || phoneVariants.length === 0) {
    const error = new Error('Invalid phone number format.');
    error.statusCode = 400;
    throw error;
  }
  
  // Check if user already exists
  const existingPhone = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });
  if (existingPhone) {
    const error = new Error('An account with this phone number already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Invalidate previous unused OTPs
  await RegistrationOtp.update({ used: true }, { where: { phone: { [Op.in]: phoneVariants }, used: false } });

  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (verifyServiceSid) {
    const verifyRes = await sendTwilioVerifyOTP(normalizedPhone);
    if (verifyRes.success) {
      await RegistrationOtp.create({
        phone: normalizedPhone,
        otp: 'TWILIO_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false
      });
      return true;
    }
  }

  const otp = generateSecureOTP();
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Save securely hashed OTP to database
  await RegistrationOtp.create({
    phone: normalizedPhone,
    otp: hashedOtp,
    expiresAt,
    used: false
  });

  console.log(`[AUTH] Registration OTP generated for ${maskPhoneNumber(normalizedPhone)}`);

  // Send SMS using Twilio
  const message = `Dear Customer, your Registration OTP is ${otp} for AyushBasket.`;
  await sendSMS(normalizedPhone, message);

  return true;
};

const registerUser = async (data) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const phoneVariants = getPhoneVariants(data.phone);
  const normalizedPhone = normalizePhoneNumber(data.phone);
  const rawDigits = String(data.phone || '').replace(/\D/g, '').slice(-10);

  if (!normalizedPhone || phoneVariants.length === 0) {
    const error = new Error('Invalid phone number format.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Find active pending OTP record
  const activeRecord = await RegistrationOtp.findOne({
    where: { phone: { [Op.in]: phoneVariants }, used: false },
    order: [['created_at', 'DESC']]
  });

  if (!activeRecord) {
    const error = new Error('Invalid OTP or no pending verification request found.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate OTP based on issuance method
  if (activeRecord.otp === 'TWILIO_VERIFY') {
    const checkRes = await checkTwilioVerifyOTP(normalizedPhone, data.otp);
    if (!checkRes.approved) {
      const error = new Error('Invalid OTP or verification failed.');
      error.statusCode = 400;
      throw error;
    }
    activeRecord.used = true;
    await activeRecord.save();
  } else {
    const isValid = verifyOTP(data.otp, activeRecord.otp);
    if (!isValid) {
      const error = new Error('Invalid OTP or verification failed.');
      error.statusCode = 400;
      throw error;
    }

    const expiresTime = typeof activeRecord.expiresAt === 'string' 
      ? new Date(activeRecord.expiresAt.endsWith('Z') ? activeRecord.expiresAt : activeRecord.expiresAt + 'Z').getTime()
      : new Date(activeRecord.expiresAt).getTime();

    if (Date.now() > expiresTime) {
      const error = new Error('OTP has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    activeRecord.used = true;
    await activeRecord.save();
  }

  // 2. Ensure email/phone aren't already taken
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const existingPhone = await User.findOne({ where: { phone: { [Op.in]: phoneVariants } } });
  if (existingPhone) {
    const error = new Error('An account with this phone number already exists.');
    error.statusCode = 409;
    throw error;
  }

  // 3. Create User
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const newUser = await User.create({
    name: data.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: rawDigits || normalizedPhone,
    role: 'customer'
  });

  const token = jwt.sign(
    { id: newUser.id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { user: newUser, token };
};

const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    const error = new Error('Email or phone number and password are required.');
    error.statusCode = 400;
    throw error;
  }

  let user;
  const isEmail = String(identifier).includes('@');
  if (isEmail) {
    const normalizedEmail = String(identifier).toLowerCase().trim();
    user = await User.findOne({ where: { email: normalizedEmail, role: 'customer' } });
  } else {
    const phoneVariants = getPhoneVariants(String(identifier));
    user = await User.findOne({ where: { phone: { [Op.in]: phoneVariants }, role: 'customer' } });
  }

  if (!user) {
    const error = new Error('Invalid credentials. No account found.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email/phone or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { user, token };
};

const generateForgotPasswordOTP = async (phone) => {
  const phoneVariants = getPhoneVariants(phone);
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || phoneVariants.length === 0) {
    return null; // Don't reveal user existence
  }

  const user = await User.findOne({ where: { phone: { [Op.in]: phoneVariants }, role: 'customer' } });
  if (!user) {
    return null; // Return null safely (don't leak user existence)
  }

  await OtpToken.update(
    { used: true },
    { where: { userId: user.id, used: false } }
  );

  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (verifyServiceSid) {
    const verifyRes = await sendTwilioVerifyOTP(normalizedPhone);
    if (verifyRes.success) {
      await OtpToken.create({
        userId: user.id,
        otp: 'TWILIO_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      return user;
    }
  }

  const otp = generateSecureOTP();
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpToken.create({
    userId: user.id,
    otp: hashedOtp,
    expiresAt
  });

  console.log(`[AUTH] Password reset OTP generated for ${maskPhoneNumber(normalizedPhone)}`);

  // Send SMS using Twilio
  const message = `Dear Customer, your Password Reset OTP is ${otp} for AyushBasket. Valid for 10 minutes.`;
  await sendSMS(normalizedPhone, message);

  return user;
};

const verifyOTPAndGenerateResetToken = async (phone, otp) => {
  const phoneVariants = getPhoneVariants(phone);
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || phoneVariants.length === 0) {
    const error = new Error('Invalid request.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ where: { phone: { [Op.in]: phoneVariants }, role: 'customer' } });
  if (!user) {
    const error = new Error('Invalid request.');
    error.statusCode = 400;
    throw error;
  }

  const activeRecord = await OtpToken.findOne({
    where: { userId: user.id, used: false },
    order: [['created_at', 'DESC']]
  });

  if (!activeRecord) {
    const error = new Error('Invalid or expired OTP.');
    error.statusCode = 400;
    throw error;
  }

  if (activeRecord.otp === 'TWILIO_VERIFY') {
    const checkRes = await checkTwilioVerifyOTP(normalizedPhone, otp);
    if (!checkRes.approved) {
      const error = new Error('Invalid or expired OTP.');
      error.statusCode = 400;
      throw error;
    }
    activeRecord.used = true;
    await activeRecord.save();
  } else {
    const isValid = verifyOTP(otp, activeRecord.otp);
    if (!isValid) {
      const error = new Error('Invalid or already used OTP.');
      error.statusCode = 400;
      throw error;
    }

    const expiresTime = typeof activeRecord.expiresAt === 'string' 
      ? new Date(activeRecord.expiresAt.endsWith('Z') ? activeRecord.expiresAt : activeRecord.expiresAt + 'Z').getTime()
      : new Date(activeRecord.expiresAt).getTime();

    if (Date.now() > expiresTime) {
      const error = new Error('OTP has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    activeRecord.used = true;
    await activeRecord.save();
  }

  const resetToken = jwt.sign(
    { id: user.id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return resetToken;
};

const resetPasswordWithToken = async (resetToken, newPassword) => {
  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch(e) {
    const error = new Error('Reset token is invalid or expired.');
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

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();
};


module.exports = {
  sendRegistrationOTP,
  resendRegistrationOTP,
  registerUser,
  loginUser,
  generateForgotPasswordOTP,
  verifyOTPAndGenerateResetToken,
  resetPasswordWithToken
};
