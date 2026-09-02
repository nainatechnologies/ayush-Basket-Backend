const { User, OtpToken, RegistrationOtp } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSMS } = require('../../utils/smsHelper');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendRegistrationOTP = async (phone) => {
  const normalizedPhone = phone.trim();
  
  // Check if user already exists
  const existingPhone = await User.findOne({ where: { phone: normalizedPhone } });
  if (existingPhone) {
    const error = new Error('An account with this phone number already exists.');
    error.statusCode = 409;
    throw error;
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Save OTP to database
  await RegistrationOtp.create({
    phone: normalizedPhone,
    otp,
    expiresAt,
    used: false
  });

  // Print in console for easy testing
  console.log('\n=============================================');
  console.log(`[REGISTRATION OTP GENERATED] OTP for ${normalizedPhone} is: ${otp}`);
  console.log('=============================================\n');

  // Send SMS using SpearUC
  const message = `Dear Customer , your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`;
  await sendSMS(normalizedPhone, message, process.env.SPEAR_UC_TID_REGISTRATION);

  return true;
};

const registerUser = async (data) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  const normalizedPhone = data.phone.trim();

  // 1. Verify OTP First
  if (!data.otp) {
    const error = new Error('OTP is required for registration.');
    error.statusCode = 400;
    throw error;
  }

  const tokenRecord = await RegistrationOtp.findOne({
    where: { phone: normalizedPhone, otp: data.otp, used: false },
    order: [['created_at', 'DESC']]
  });

  if (!tokenRecord) {
    const error = new Error('Invalid OTP or no pending request found.');
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

  // Mark as used
  tokenRecord.used = true;
  await tokenRecord.save();

  // 2. Ensure email/phone aren't already taken
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const existingPhone = await User.findOne({ where: { phone: normalizedPhone } });
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
    phone: normalizedPhone,
    role: 'customer'
  });

  // Record successfully used, no need to clear cache since we used DB

  const token = jwt.sign(
    { id: newUser.id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { user: newUser, token };
};

const loginUser = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail, role: 'customer' } });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
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
  const user = await User.findOne({ where: { phone: phone.trim(), role: 'customer' } });
  if (!user) {
    return null; // Return null safely (don't leak user existence)
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpToken.update(
    { used: true },
    { where: { userId: user.id, used: false } }
  );

  await OtpToken.create({
    userId: user.id,
    otp,
    expiresAt
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n=============================================');
    console.log(`[CUSTOMER FORGOT PASSWORD] OTP for phone: ${user.phone} is: ${otp}`);
    console.log('=============================================\n');
  }

  // Send SMS using SpearUC
  const message = `Dear Customer , your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`;
  await sendSMS(user.phone, message, process.env.SPEAR_UC_TID_REGISTRATION);

  return user;
};

const verifyOTPAndGenerateResetToken = async (phone, otp) => {
  const user = await User.findOne({ where: { phone: phone.trim(), role: 'customer' } });
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

  // const isSame = await bcrypt.compare(newPassword, user.password);
  // if (isSame) {
  //   const error = new Error('New password must be different from current password.');
  //   error.statusCode = 400;
  //   throw error;
  // }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();
};


module.exports = {
  sendRegistrationOTP,
  registerUser,
  loginUser,
  generateForgotPasswordOTP,
  verifyOTPAndGenerateResetToken,
  resetPasswordWithToken
};
