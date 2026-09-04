const fs = require('fs');
const path = require('path');

/**
 * Validates and extracts MIME type and raw Base64 string from an input.
 * @param {string} input - A raw Base64 string or a full Data URI string (e.g. data:image/png;base64,...)
 * @returns {object|null} { mimeType: string, base64: string } or null if invalid
 */
const extractBase64AndMimeType = (input) => {
  if (!input || typeof input !== 'string') return null;
  
  // If it's a full Data URI (data:image/jpeg;base64,/9j/4AAQSkZJ...)
  if (input.startsWith('data:')) {
    const parts = input.split(',');
    if (parts.length !== 2) return null; // Malformed
    const meta = parts[0];
    const base64Data = parts[1];
    
    // Extract mime type (e.g., 'data:image/jpeg;base64' -> 'image/jpeg')
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    if (!mimeMatch || !mimeMatch[1]) return null;
    
    // Quick validation of base64
    if (!/^[a-zA-Z0-9+/=]+$/.test(base64Data)) return null;
    
    return { mimeType: mimeMatch[1], base64: base64Data };
  }
  
  // If it's just raw base64 (we can't know mime type, default to jpeg or reject?)
  // The requirements say "Add validation for empty, malformed, truncated, and unsupported Base64 values."
  // If no MIME is provided, we can default to 'image/jpeg' or return null.
  // For safety, let's assume if they pass raw base64, we default to image/jpeg.
  if (/^[a-zA-Z0-9+/=]+$/.test(input)) {
      return { mimeType: 'image/jpeg', base64: input };
  }

  return null;
};

/**
 * Legacy support for just returning the string if it's already a data URI.
 */
const processBase64Image = (base64String) => {
  if (base64String && base64String.startsWith('data:image')) {
    return base64String;
  }
  return base64String;
};

module.exports = { processBase64Image, extractBase64AndMimeType };
