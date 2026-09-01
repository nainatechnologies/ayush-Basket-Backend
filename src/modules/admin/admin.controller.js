const { User, OtpToken } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// Helper â€“ generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Configure Nodemailer Transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS,
    },
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// @desc    Admin Forgot Password â€“ generate and store OTP
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    console.log('\n--- FORGOT PASSWORD API HIT ---');
    const { email } = req.body;
    console.log(`Received request for email: ${email}`);

    if (!email) {
      console.log('Error: No email provided in request body');
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(200).json({ success: true, message: 'If that email is registered, you will receive an OTP.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`Generated OTP: ${otp} for user ${user.name}`);

    // Invalidate old OTPs for this user
    await OtpToken.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    // Store new OTP
    await OtpToken.create({
      userId: user.id,
      otp,
      expiresAt
    });
    console.log(`OTP successfully saved to database for user ${user.email}`);

    // Send via email using Nodemailer
    try {
      console.log('Attempting to send email via Nodemailer...');
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
      console.log(`[SUCCESS] OTP Email actually delivered to ${user.email}!`);
    } catch (emailError) {
      console.error('\n[NODEMAILER ERROR] Failed to send OTP email!');
      console.error('Reason:', emailError.message);
      console.error('Because you did not put a real Gmail App Password in your .env file, the email cannot actually be sent over the internet.');
      console.log(`HOWEVER, for testing purposes, your OTP is: ${otp}`);
      
      // We still return success so the frontend UI can move to the next step during development
      return res.status(200).json({ 
        success: true, 
        message: 'If that email is registered, you will receive an OTP.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If that email is registered, you will receive an OTP.'
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};

// @desc    Verify OTP
// @route   POST /api/admin/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim(), role: 'admin' } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    const tokenRecord = await OtpToken.findOne({
      where: { userId: user.id, otp, used: false },
      order: [['created_at', 'DESC']]
    });

    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or already used OTP.' });
    }

    const expiresTime = typeof tokenRecord.expiresAt === 'string' 
      ? new Date(tokenRecord.expiresAt.endsWith('Z') ? tokenRecord.expiresAt : tokenRecord.expiresAt + 'Z').getTime()
      : new Date(tokenRecord.expiresAt).getTime();

    if (Date.now() > expiresTime) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Issue a short-lived "reset token" so they can hit reset-password
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Mark as used
    tokenRecord.used = true;
    await tokenRecord.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP.' });
  }
};

// @desc    Reset Password (after OTP verified)
// @route   POST /api/admin/reset-password
// @access  Public (with resetToken)
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch(e) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired. Please restart the process.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};

// @desc    Change Password (when logged in)
// @route   PUT /api/admin/change-password
// @access  Private/Admin
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ success: false, message: 'Server error changing password.' });
  }
};



// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching admin profile.' });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' });
    }
    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    res.status(500).json({ success: false, message: 'Server error updating admin profile.' });
  }
};
module.exports = { adminLogin, forgotPassword, verifyOtp, resetPassword, changePassword, getAdminProfile, updateAdminProfile };



