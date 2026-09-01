const authService = require('./auth.service');

// @desc    Register new customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { user, token } = await authService.registerUser(req.body);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error in register:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Customer Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Customer Forgot Password – generate and store OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    await authService.generateForgotPasswordOTP(phone);

    res.status(200).json({
      success: true,
      message: 'If that phone is registered, you will receive an OTP.',
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const resetToken = await authService.verifyOTPAndGenerateResetToken(phone, otp);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP.' });
  }
};

// @desc    Reset Password (after OTP verified)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    await authService.resetPasswordWithToken(resetToken, newPassword);

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error in resetPassword:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};


module.exports = { register, login, forgotPassword, verifyOtp, resetPassword };
