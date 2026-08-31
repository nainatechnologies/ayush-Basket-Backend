const fs = require('fs');
const path = require('path');

/**
 * Process a base64 image string and save it to the uploads folder.
 * @param {string} base64String The base64 image string
 * @returns {string} The path to the saved image or the original string if not base64
 */
const processBase64Image = (base64String) => {
  if (base64String && base64String.startsWith('data:image')) {
    const matches = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const filename = `image-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
      // Note: assuming this file runs from src/utils, so uploads is at ../../uploads
      const filepath = path.join(__dirname, '../../uploads', filename);
      try {
        if (!fs.existsSync(path.dirname(filepath))) {
          fs.mkdirSync(path.dirname(filepath), { recursive: true });
        }
        fs.writeFileSync(filepath, base64Data, 'base64');
        return `/uploads/${filename}`;
      } catch (err) {
        console.error('Error saving base64 image:', err);
      }
    }
  }
  return base64String;
};

module.exports = { processBase64Image };
