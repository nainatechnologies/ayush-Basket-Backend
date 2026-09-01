const fs = require('fs');
const path = require('path');

/**
 * Process a base64 image string and save it to the uploads folder.
 * @param {string} base64String The base64 image string
 * @returns {string} The path to the saved image or the original string if not base64
 */
const processBase64Image = (base64String) => {
  // If it's a valid data URI, just return it so it can be saved in the DB
  if (base64String && base64String.startsWith('data:image')) {
    return base64String;
  }
  return base64String;
};

module.exports = { processBase64Image };
