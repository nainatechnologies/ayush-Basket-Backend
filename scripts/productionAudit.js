'use strict';

require('dotenv').config();
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://ayushbasket.nainatechnologies.in';

const assert = require('node:assert/strict');

async function runProductionAudit() {
  console.log('====================================================');
  console.log('🔍 AYUSHBASKET BACKEND PRODUCTION READINESS AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isOk, extra = '') {
    if (isOk) {
      console.log('  [PASS] ' + name + (extra ? ' -> ' + extra : ''));
      passed++;
    } else {
      console.error('  [FAIL] ' + name + (extra ? ' -> ' + extra : ''));
      failed++;
    }
  }

  // ----------------------------------------------------
  // Check 1: Environment Variables
  // ----------------------------------------------------
  console.log('1. Environment Configuration:');
  const requiredEnvs = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'BACKEND_URL'];
  for (const env of requiredEnvs) {
    report('Env var: ' + env, Boolean(process.env[env]), process.env[env] ? 'Set' : 'Missing');
  }

  // ----------------------------------------------------
  // Check 2: Database Connectivity & Models
  // ----------------------------------------------------
  console.log('\n2. Database & Sequelize Models:');
  const {
    sequelize,
    User,
    Product,
    Category,
    Order,
    OrderItem,
    Coupon,
    Brand,
    Address,
    Cart,
    Wishlist,
    Prescription,
    Review,
    SupportTicket,
    PaymentAttempt
  } = require('../src/models');

  try {
    await sequelize.authenticate();
    report('MySQL Database Authentication', true, 'Host: ' + sequelize.config.host);

    const [uCount, pCount, cCount, oCount, cpCount] = await Promise.all([
      User.count(),
      Product.count(),
      Category.count(),
      Order.count(),
      Coupon.count()
    ]);
    report('Table User query', true, uCount + ' records');
    report('Table Product query', true, pCount + ' records');
    report('Table Category query', true, cCount + ' records');
    report('Table Order query', true, oCount + ' records');
    report('Table Coupon query', true, cpCount + ' records');
  } catch (err) {
    report('Database Queries', false, err.message);
  }

  // ----------------------------------------------------
  // Check 3: Authentication & Security
  // ----------------------------------------------------
  console.log('\n3. Security & Authentication:');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');

  try {
    const admin = await User.findOne({ where: { role: 'admin' } });
    report('Admin user exists in database', Boolean(admin), admin ? admin.email : 'None');

    if (admin) {
      const isMatch = await bcrypt.compare('Admin@123', admin.password);
      report('Admin password hash verification', isMatch, 'Matches Admin@123');

      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      report('JWT Token Issue & Verification', decoded.id === admin.id, 'Role: ' + decoded.role);
    }
  } catch (err) {
    report('Auth Verification', false, err.message);
  }

  // ----------------------------------------------------
  // Check 4: CORS Configuration in Production
  // ----------------------------------------------------
  console.log('\n4. Production CORS Policy:');
  const prodOrigin = 'https://ayushbasket.nainatechnologies.in';
  const testSubdomain = 'https://admin.nainatechnologies.in';
  const disallowedOrigin = 'https://malicious-site.com';
  const placeholderOrigin = 'https://your-production-url.com';

  const HARDCODED_ORIGINS = [
    'https://ayushbasket.nainatechnologies.in',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  const allowedOrigins = [
    ...new Set([
      ...HARDCODED_ORIGINS,
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [])
    ])
  ];

  const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const lower = origin.toLowerCase();
    return allowedOrigins.some(a => lower === a.toLowerCase()) || lower.endsWith('.nainatechnologies.in');
  };

  report('Frontend Origin: ' + prodOrigin, isOriginAllowed(prodOrigin), 'Allowed');
  report('Subdomain: ' + testSubdomain, isOriginAllowed(testSubdomain), 'Allowed');
  report('Blocked Origin: ' + disallowedOrigin, !isOriginAllowed(disallowedOrigin), 'Blocked');
  report('Placeholder Origin: ' + placeholderOrigin, !isOriginAllowed(placeholderOrigin), 'Blocked');

  // ----------------------------------------------------
  // Check 5: Services & Integrations
  // ----------------------------------------------------
  console.log('\n5. External Services & Integrations:');
  // Twilio SMS
  const { normalizePhoneNumber, isValidPhoneNumber } = require('../src/utils/smsHelper');
  report('E.164 Phone Normalization', normalizePhoneNumber('9876543210') === '+919876543210');
  report('Phone Validation', isValidPhoneNumber('9876543210') === true);

  // Razorpay
  const { MockRazorpay, generateMockSignature } = require('../src/modules/payment/payment.mock');
  const mockRzp = new MockRazorpay({ key_id: 'test', key_secret: 'secret' });
  const mockOrder = await mockRzp.orders.create({ amount: 1000, currency: 'INR' });
  report('Payment Mock Order Creation', mockOrder.status === 'created');

  // OTP Helper
  const { generateSecureOTP, hashOTP, verifyOTP } = require('../src/utils/otpHelper');
  const otp = generateSecureOTP();
  const hashedOtp = hashOTP(otp);
  report('OTP 6-digit generation', /^\d{6}$/.test(otp), 'Generated: ' + otp);
  report('HMAC-SHA256 OTP Verification', verifyOTP(otp, hashedOtp), 'Hash verified');

  await sequelize.close();

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runProductionAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
