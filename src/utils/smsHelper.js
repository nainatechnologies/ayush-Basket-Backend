const axios = require('axios');

/**
 * Send an SMS using the SpearUC Gateway
 * @param {string} mobile - The recipient's phone number
 * @param {string} message - The message content to send
 * @param {string} templateId - The approved DLT template ID (optional depending on API strictness)
 * @returns {Promise<object>} - The response from the SMS gateway
 */
const sendSMS = async (mobile, message, templateId = '') => {
  try {
    const baseURL = process.env.SPEAR_UC_BASE_URL;
    const authKey = process.env.SPEAR_UC_AUTH_KEY;
    const senderId = process.env.SPEAR_UC_SENDER_ID;

    if (!baseURL || !authKey || !senderId) {
      console.warn('SMS Gateway is not fully configured in .env. SMS not sent.');
      return { success: false, message: 'SMS Gateway not configured.' };
    }

    // Build the query parameters for SpearUC using the correct keys
    const params = new URLSearchParams({
      type: 'smsquicksend',
      authKey: authKey,
      sender: senderId,
      to_mobileno: mobile,
      sms_text: message,
    });

    if (templateId) {
      params.append('t_id', templateId);
    }

    // Append parameters to URL
    const url = `${baseURL}?${params.toString()}`;

    // For now we will allow it to send real SMS in development since we are testing it!
    console.log('\n=============================================');
    console.log(`[SMS TRIGGERED] Sending to: ${mobile}`);
    console.log(`Message: ${message}`);
    console.log(`URL: ${url.replace(authKey, '***HIDDEN***')}`);
    console.log('=============================================\n');

    const response = await axios.get(url);
    
    console.log(`[SPEAR_UC RESPONSE]:`, response.data);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending SMS via SpearUC:', error.message);
    throw new Error('Failed to send SMS.');
  }
};

module.exports = {
  sendSMS
};
