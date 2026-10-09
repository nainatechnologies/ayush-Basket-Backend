const twilio = require('twilio');

/**
 * Send an SMS using Twilio
 * @param {string} mobile - The recipient's phone number
 * @param {string} message - The message content to send
 * @returns {Promise<object>} - The response from the SMS gateway
 */
const sendSMS = async (mobile, message) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const isSmsEnabled = process.env.SMS_ENABLED !== 'false';

    if (!isSmsEnabled) {
      console.log('\n=============================================');
      console.log(`[SMS MOCKED] SMS_ENABLED is false. SMS not sent to Twilio.`);
      console.log(`Mocking send to: ${mobile}`);
      console.log(`Message: ${message}`);
      console.log('=============================================\n');
      return { success: true, message: 'SMS mocked successfully.' };
    }

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.warn('Twilio is not fully configured in .env. SMS not sent.');
      return { success: false, message: 'Twilio not configured.' };
    }

    const client = twilio(accountSid, authToken);

    let formattedMobile = mobile.trim();
    // If it's a 10 digit Indian number, add +91
    if (/^\d{10}$/.test(formattedMobile)) {
      formattedMobile = '+91' + formattedMobile;
    } else if (!formattedMobile.startsWith('+')) {
      // Otherwise just prefix with + to make it E.164
      formattedMobile = '+' + formattedMobile;
    }

    console.log('\n=============================================');
    console.log(`[SMS TRIGGERED] Sending to: ${formattedMobile}`);
    console.log(`Message: ${message}`);
    console.log('=============================================\n');

    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedMobile
    });
    
    console.log(`[TWILIO RESPONSE]: Message SID ${response.sid}`);

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error sending SMS via Twilio:');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.moreInfo) console.error('More Info:', error.moreInfo);
    
    throw new Error('Failed to send SMS.');
  }
};

module.exports = {
  sendSMS
};
