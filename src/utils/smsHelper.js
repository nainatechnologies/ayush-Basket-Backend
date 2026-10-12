'use strict';

const twilio = require('twilio');

/**
 * Normalizes a phone number to standard E.164 format.
 * Defaults to Indian country code (+91) for 10-digit national numbers.
 * Returns null if the number is invalid or cannot be normalized.
 *
 * @param {string|number} rawPhone
 * @returns {string|null}
 */
const normalizePhoneNumber = (rawPhone) => {
  if (!rawPhone) return null;

  let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return null;

  // Handle leading 0 (national trunk prefix, e.g., 09876543210)
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = cleaned.substring(1);
  }

  // 10-digit Indian number: 9876543210 -> +919876543210
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 12-digit Indian number without '+': 919876543210 -> +919876543210
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Already prefixed with '+'
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1);
    if (/^[1-9]\d{9,14}$/.test(digitsOnly)) {
      return cleaned;
    }
    return null;
  }

  // Generic international digits without '+' (11 to 15 digits)
  if (/^[1-9]\d{10,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
};

/**
 * Validates whether a phone number can be normalized to valid E.164.
 *
 * @param {string|number} rawPhone
 * @returns {boolean}
 */
const isValidPhoneNumber = (rawPhone) => {
  return normalizePhoneNumber(rawPhone) !== null;
};

/**
 * Masks a phone number for secure logging (e.g. +91*****43210).
 *
 * @param {string} phone
 * @returns {string}
 */
const maskPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  const str = String(phone);
  if (str.length <= 5) return '***';
  return str.slice(0, 3) + '*'.repeat(Math.max(3, str.length - 7)) + str.slice(-4);
};

// For test mocking
let testTwilioClient = null;
const setTwilioClientForTesting = (mockClient) => {
  testTwilioClient = mockClient;
};
const resetTwilioClientForTesting = () => {
  testTwilioClient = null;
};

/**
 * Initializes and returns the official Twilio client.
 * Supports either:
 *  1. TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *  2. TWILIO_ACCOUNT_SID + TWILIO_API_KEY + TWILIO_API_SECRET
 *
 * @returns {object|null}
 */
const getTwilioClient = () => {
  if (testTwilioClient) return testTwilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid) return null;

  if (apiKey && apiSecret) {
    return twilio(apiKey, apiSecret, { accountSid });
  }

  if (authToken) {
    return twilio(accountSid, authToken);
  }

  return null;
};

/**
 * Send an SMS using Twilio Programmable Messaging.
 * Uses TWILIO_MESSAGING_SERVICE_SID if available; otherwise falls back to TWILIO_PHONE_NUMBER.
 * Never throws an unhandled exception to prevent crashing the caller.
 *
 * @param {string} mobile - Recipient phone number
 * @param {string} message - Message body
 * @returns {Promise<{success: boolean, message?: string, data?: object, error?: string}>}
 */
const sendSMS = async (mobile, message) => {
  try {
    const formattedMobile = normalizePhoneNumber(mobile);
    if (!formattedMobile) {
      console.warn(`[SMS] Skipping send: invalid or missing phone number: ${maskPhoneNumber(mobile)}`);
      return { success: false, message: 'Invalid recipient phone number.' };
    }

    const isSmsEnabled = process.env.SMS_ENABLED === 'true';

    // Mock / dev mode
    if (!isSmsEnabled && !testTwilioClient) {
      console.log(`[SMS MOCK] Real SMS disabled (SMS_ENABLED !== true). Target: ${maskPhoneNumber(formattedMobile)}`);
      return {
        success: true,
        message: 'SMS mocked successfully (dev mode).',
        data: { sid: `mock_sid_${Date.now()}` }
      };
    }

    const client = getTwilioClient();
    if (!client) {
      console.warn('[SMS] Twilio credentials (TWILIO_ACCOUNT_SID with TWILIO_AUTH_TOKEN or TWILIO_API_KEY/SECRET) not configured.');
      return { success: false, message: 'Twilio credentials not configured in environment.' };
    }

    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !twilioPhoneNumber && !testTwilioClient) {
      console.warn('[SMS] Sender configuration missing: set either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER.');
      return { success: false, message: 'Twilio sender (TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER) not configured.' };
    }

    const payload = {
      body: message,
      to: formattedMobile
    };

    if (messagingServiceSid) {
      payload.messagingServiceSid = messagingServiceSid;
    } else if (twilioPhoneNumber) {
      payload.from = twilioPhoneNumber;
    }

    console.log(`[SMS] Sending SMS to ${maskPhoneNumber(formattedMobile)}`);

    const response = await client.messages.create(payload);

    console.log(`[SMS SUCCESS] Message SID: ${response?.sid || 'N/A'}`);

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send SMS to ${maskPhoneNumber(mobile)}: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send an OTP using Twilio Verify service.
 *
 * @param {string} mobile - Recipient phone number
 * @returns {Promise<{success: boolean, status?: string, sid?: string, error?: string, provider: string}>}
 */
const sendTwilioVerifyOTP = async (mobile) => {
  try {
    const formattedMobile = normalizePhoneNumber(mobile);
    if (!formattedMobile) {
      return { success: false, provider: 'twilio_verify', message: 'Invalid phone number format.' };
    }

    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const isSmsEnabled = process.env.SMS_ENABLED === 'true';

    // If Verify is not configured or in mock mode without test mock client
    if (!verifyServiceSid || (!isSmsEnabled && !testTwilioClient)) {
      return {
        success: false,
        provider: 'fallback',
        message: 'Twilio Verify not active or not configured in environment.'
      };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, provider: 'fallback', message: 'Twilio client not initialized.' };
    }

    console.log(`[Twilio Verify] Requesting OTP verification for ${maskPhoneNumber(formattedMobile)}`);

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formattedMobile, channel: 'sms' });

    console.log(`[Twilio Verify SUCCESS] Status: ${verification.status}, SID: ${verification.sid}`);

    return {
      success: true,
      provider: 'twilio_verify',
      status: verification.status,
      sid: verification.sid
    };
  } catch (error) {
    console.error(`[Twilio Verify ERROR] Failed to send verification: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`);
    return {
      success: false,
      provider: 'twilio_verify',
      error: error.message
    };
  }
};

/**
 * Check an OTP using Twilio Verify service.
 *
 * @param {string} mobile - Recipient phone number
 * @param {string} code - User-submitted OTP code
 * @returns {Promise<{success: boolean, approved: boolean, provider: string, error?: string}>}
 */
const checkTwilioVerifyOTP = async (mobile, code) => {
  try {
    const formattedMobile = normalizePhoneNumber(mobile);
    if (!formattedMobile || !code) {
      return { success: false, approved: false, provider: 'twilio_verify', message: 'Invalid input.' };
    }

    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const isSmsEnabled = process.env.SMS_ENABLED === 'true';

    if (!verifyServiceSid || (!isSmsEnabled && !testTwilioClient)) {
      return {
        success: false,
        approved: false,
        provider: 'fallback',
        message: 'Twilio Verify not active or not configured in environment.'
      };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, approved: false, provider: 'fallback', message: 'Twilio client not initialized.' };
    }

    console.log(`[Twilio Verify] Checking OTP code for ${maskPhoneNumber(formattedMobile)}`);

    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formattedMobile, code: String(code).trim() });

    const isApproved = check.status === 'approved';

    return {
      success: isApproved,
      approved: isApproved,
      provider: 'twilio_verify',
      status: check.status
    };
  } catch (error) {
    console.error(`[Twilio Verify ERROR] Verification check failed: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`);
    return {
      success: false,
      approved: false,
      provider: 'twilio_verify',
      error: error.message
    };
  }
};

module.exports = {
  sendSMS,
  sendTwilioVerifyOTP,
  checkTwilioVerifyOTP,
  normalizePhoneNumber,
  isValidPhoneNumber,
  maskPhoneNumber,
  getTwilioClient,
  setTwilioClientForTesting,
  resetTwilioClientForTesting
};
