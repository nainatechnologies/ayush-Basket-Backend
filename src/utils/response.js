const sendSuccess = (res, statusCode, message, data = null, extra = {}) => {
  const response = { success: true };
  if (message) response.message = message;
  if (data) response.data = data;
  
  return res.status(statusCode).json({ ...response, ...extra });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
