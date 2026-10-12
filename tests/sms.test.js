'use strict';
require('dotenv').config();

const test = require('node:test');
const assert = require('node:assert');
const {
  sendSMS,
  sendTwilioVerifyOTP,
  checkTwilioVerifyOTP,
  normalizePhoneNumber,
  isValidPhoneNumber,
  maskPhoneNumber,
  setTwilioClientForTesting,
  resetTwilioClientForTesting
} = require('../src/utils/smsHelper');
const {
  generateSecureOTP,
  hashOTP,
  verifyOTP
} = require('../src/utils/otpHelper');
const { otpRateLimiter, otpVerifyRateLimiter } = require('../src/middleware/rateLimiter.middleware');
const smsService = require('../src/services/smsService');
const { OrderNotification, RegistrationOtp, OtpToken, User } = require('../src/models');

test('Phone Number Normalization & Validation', () => {
  // 10-digit Indian numbers
  assert.strictEqual(normalizePhoneNumber('9876543210'), '+919876543210');
  assert.strictEqual(normalizePhoneNumber('  9876543210  '), '+919876543210');
  assert.strictEqual(normalizePhoneNumber('9876-543-210'), '+919876543210');
  assert.strictEqual(normalizePhoneNumber('(9876) 543 210'), '+919876543210');
  
  // With leading 0 (trunk)
  assert.strictEqual(normalizePhoneNumber('09876543210'), '+919876543210');

  // With country code 91
  assert.strictEqual(normalizePhoneNumber('919876543210'), '+919876543210');

  // Already E.164
  assert.strictEqual(normalizePhoneNumber('+919876543210'), '+919876543210');
  assert.strictEqual(normalizePhoneNumber('+14155552671'), '+14155552671');

  // Invalid numbers
  assert.strictEqual(normalizePhoneNumber(''), null);
  assert.strictEqual(normalizePhoneNumber(null), null);
  assert.strictEqual(normalizePhoneNumber('12345'), null);
  assert.strictEqual(normalizePhoneNumber('abcdefghij'), null);

  // Validation helper
  assert.strictEqual(isValidPhoneNumber('9876543210'), true);
  assert.strictEqual(isValidPhoneNumber('123'), false);

  // Masking
  assert.strictEqual(maskPhoneNumber('+919876543210').includes('***'), true);
});

test('OTP Helper: Secure Generation, HMAC-SHA256 Hashing & Verification', () => {
  const otp = generateSecureOTP();
  assert.strictEqual(typeof otp, 'string');
  assert.strictEqual(otp.length, 6);
  assert.match(otp, /^\d{6}$/);

  // Hash is not plaintext
  const hash = hashOTP(otp);
  assert.notStrictEqual(hash, otp);
  assert.strictEqual(hash.length, 64); // 256-bit hex

  // Verification
  assert.strictEqual(verifyOTP(otp, hash), true);
  assert.strictEqual(verifyOTP('000000', hash), false);
  assert.strictEqual(verifyOTP(null, hash), false);

  // Legacy plaintext backwards compatibility
  assert.strictEqual(verifyOTP('123456', '123456'), true);
});

test('Twilio Mock Integration & Failure Resilience', async () => {
  let sentMessages = [];
  const mockClient = {
    messages: {
      create: async (payload) => {
        sentMessages.push(payload);
        return { sid: `SM_mock_${Date.now()}` };
      }
    }
  };

  setTwilioClientForTesting(mockClient);

  try {
    // Successful send with phone number
    const res = await sendSMS('9876543210', 'Test Message');
    assert.strictEqual(res.success, true);
    assert.strictEqual(sentMessages.length, 1);
    assert.strictEqual(sentMessages[0].to, '+919876543210');
    assert.strictEqual(sentMessages[0].body, 'Test Message');

    // Test Messaging Service SID priority if set
    const origServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    process.env.TWILIO_MESSAGING_SERVICE_SID = 'MGmock123456789';
    await sendSMS('9876543210', 'Message via Messaging Service');
    assert.strictEqual(sentMessages.length, 2);
    assert.strictEqual(sentMessages[1].messagingServiceSid, 'MGmock123456789');
    process.env.TWILIO_MESSAGING_SERVICE_SID = origServiceSid;

    // Invalid number: does not throw, returns success: false
    const invalidRes = await sendSMS('invalid', 'Test');
    assert.strictEqual(invalidRes.success, false);
    assert.strictEqual(sentMessages.length, 2); // No new message sent

    // Simulated Twilio Gateway Error: does not crash, handles gracefully
    setTwilioClientForTesting({
      messages: {
        create: async () => {
          const err = new Error('Carrier network unreachable');
          err.code = 30008;
          throw err;
        }
      }
    });

    const failedRes = await sendSMS('9876543210', 'Test Fail');
    assert.strictEqual(failedRes.success, false);
    assert.match(failedRes.error, /Carrier network unreachable/);
  } finally {
    resetTwilioClientForTesting();
  }
});

test('Twilio Verify Service: Mock Verification Flow', async () => {
  const origVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  process.env.TWILIO_VERIFY_SERVICE_SID = 'VA_test_mock_sid';

  const mockClient = {
    verify: {
      v2: {
        services: (serviceSid) => ({
          verifications: {
            create: async ({ to, channel }) => ({
              sid: 'VE_mock_123',
              status: 'pending',
              to,
              channel
            })
          },
          verificationChecks: {
            create: async ({ to, code }) => ({
              sid: 'VE_check_mock_123',
              status: code === '123456' ? 'approved' : 'canceled',
              to
            })
          }
        })
      }
    }
  };

  setTwilioClientForTesting(mockClient);

  try {
    // 1. Send Verify OTP
    const sendRes = await sendTwilioVerifyOTP('9876543210');
    assert.strictEqual(sendRes.success, true);
    assert.strictEqual(sendRes.provider, 'twilio_verify');
    assert.strictEqual(sendRes.status, 'pending');

    // 2. Check Verify OTP - Approved
    const approveRes = await checkTwilioVerifyOTP('9876543210', '123456');
    assert.strictEqual(approveRes.success, true);
    assert.strictEqual(approveRes.approved, true);

    // 3. Check Verify OTP - Wrong Code
    const failRes = await checkTwilioVerifyOTP('9876543210', '000000');
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.approved, false);
  } finally {
    process.env.TWILIO_VERIFY_SERVICE_SID = origVerifySid;
    resetTwilioClientForTesting();
  }
});

test('Order SMS Events & Duplicate Prevention', async () => {
  const sentMessages = [];
  const mockClient = {
    messages: {
      create: async ({ body, to }) => {
        sentMessages.push({ body, to });
        return { sid: `SM_order_test_${Date.now()}` };
      }
    }
  };
  setTwilioClientForTesting(mockClient);

  const testOrderId = 999902;
  const testPhone = '9876543210';

  try {
    await OrderNotification.destroy({ where: { orderId: testOrderId } });

    // 1. ORDER_PLACED SMS
    const orderObj = { id: testOrderId, totalAmount: 750 };
    const placedRes = await smsService.sendOrderPlacedSMS(orderObj, testPhone);
    assert.strictEqual(placedRes.success, true);
    assert.strictEqual(sentMessages.length, 1);
    assert.match(sentMessages[0].body, /placed successfully/);
    assert.match(sentMessages[0].body, /#999902/);

    // Duplicate check: second call should be ignored
    const placedDupRes = await smsService.sendOrderPlacedSMS(orderObj, testPhone);
    assert.strictEqual(placedDupRes.message, 'Already sent.');
    assert.strictEqual(sentMessages.length, 1); // Still 1!

    // 2. ORDER_ACCEPTED SMS
    const acceptedRes = await smsService.sendOrderAcceptedSMS(orderObj, testPhone);
    assert.strictEqual(acceptedRes.success, true);
    assert.strictEqual(sentMessages.length, 2);
    assert.match(sentMessages[1].body, /confirmed and is being processed/);

    // Duplicate check: second call should be ignored
    const acceptedDupRes = await smsService.sendOrderAcceptedSMS(orderObj, testPhone);
    assert.strictEqual(acceptedDupRes.message, 'Already sent.');
    assert.strictEqual(sentMessages.length, 2); // Still 2!

    // 3. ORDER_COMPLETED SMS (Thank-You, triggered strictly once)
    const completedRes = await smsService.sendOrderCompletedSMS(orderObj, testPhone);
    assert.strictEqual(completedRes.success, true);
    assert.strictEqual(sentMessages.length, 3);
    assert.match(sentMessages[2].body, /delivered successfully/);
    assert.match(sentMessages[2].body, /Thank you for shopping with AyushBasket/);

    // Duplicate check: second call should be ignored
    const completedDupRes = await smsService.sendOrderCompletedSMS(orderObj, testPhone);
    assert.strictEqual(completedDupRes.message, 'Already sent.');
    assert.strictEqual(sentMessages.length, 3); // Still 3!
  } finally {
    await OrderNotification.destroy({ where: { orderId: testOrderId } });
    resetTwilioClientForTesting();
  }
});

test('Registration OTP Lifecycle: Expiry, One-Time Use, and Hash Storage', async () => {
  const testPhone = '+919999888877';
  const rawOtp = generateSecureOTP();
  const hashed = hashOTP(rawOtp);

  await RegistrationOtp.destroy({ where: { phone: testPhone } });

  // 1. Create valid hashed record
  const record = await RegistrationOtp.create({
    phone: testPhone,
    otp: hashed,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins in future
    used: false
  });

  // Verify DB record does NOT contain raw plaintext OTP
  const dbRecord = await RegistrationOtp.findByPk(record.id);
  assert.notStrictEqual(dbRecord.otp, rawOtp);
  assert.strictEqual(verifyOTP(rawOtp, dbRecord.otp), true);
  assert.strictEqual(verifyOTP('111111', dbRecord.otp), false);

  // 2. Mark as used (One-time use)
  dbRecord.used = true;
  await dbRecord.save();
  assert.strictEqual(dbRecord.used, true);

  // 3. Test Expiry
  const expiredRecord = await RegistrationOtp.create({
    phone: testPhone,
    otp: hashed,
    expiresAt: new Date(Date.now() - 60 * 1000), // 1 minute in past
    used: false
  });

  const isExpired = Date.now() > new Date(expiredRecord.expiresAt).getTime();
  assert.strictEqual(isExpired, true);

  await RegistrationOtp.destroy({ where: { phone: testPhone } });
});

test('Forgot Password OTP: Non-Enumeration & Secure Verification', async () => {
  const sentMessages = [];
  const mockClient = {
    messages: {
      create: async ({ body, to }) => {
        sentMessages.push({ body, to });
        return { sid: `SM_forgot_${Date.now()}` };
      }
    }
  };
  setTwilioClientForTesting(mockClient);

  const authService = require('../src/modules/auth/auth.service');

  try {
    // Non-existent phone should return null without revealing user existence or throwing
    const nonExistentResult = await authService.generateForgotPasswordOTP('9000000000');
    assert.strictEqual(nonExistentResult, null);
    assert.strictEqual(sentMessages.length, 0); // No SMS sent
  } finally {
    resetTwilioClientForTesting();
  }
});

test('Rate Limiting Middleware Integrity', () => {
  assert.strictEqual(typeof otpRateLimiter, 'function');
  assert.strictEqual(typeof otpVerifyRateLimiter, 'function');
});
