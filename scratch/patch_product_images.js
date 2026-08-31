const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/controllers/productController.js');
let content = fs.readFileSync(targetFile, 'utf8');

const helperFunction = `
const fs = require('fs');
const path = require('path');

const processBase64Image = (base64String) => {
  if (base64String && base64String.startsWith('data:image')) {
    const matches = base64String.match(/^data:image\\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const filename = \`image-\${Date.now()}-\${Math.floor(Math.random() * 1000)}.\${ext}\`;
      const filepath = path.join(__dirname, '../../uploads', filename);
      try {
        fs.writeFileSync(filepath, base64Data, 'base64');
        return \`/uploads/\${filename}\`;
      } catch (err) {
        console.error('Error saving base64 image:', err);
      }
    }
  }
  return base64String;
};
`;

// Insert helper at the top if not there
if (!content.includes('processBase64Image')) {
  content = content.replace("const { Op } = require('sequelize');", "const { Op } = require('sequelize');\\n" + helperFunction);
}

// Update createProduct
const createProductPattern = /let image_url = req\\.body\\.image_url \\|\\| '';\\s+let image_url2 = req\\.body\\.image_url2 \\|\\| null;\\s+let image_url3 = req\\.body\\.image_url3 \\|\\| null;/;
const createProductReplacement = `let image_url = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
      let image_url2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) || null;
      let image_url3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || null;`;
content = content.replace(createProductPattern, createProductReplacement);

// Update updateProduct
const updateProductPattern = /let image_url = req\\.body\\.image_url \\|\\| req\\.body\\.image \\|\\| req\\.body\\.imageUrl;\\s+let image_url2 = req\\.body\\.image_url2 \\|\\| req\\.body\\.imageUrl2 \\|\\| null;\\s+let image_url3 = req\\.body\\.image_url3 \\|\\| req\\.body\\.imageUrl3 \\|\\| null;/;
const updateProductReplacement = `let image_url = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
      let image_url2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) || null;
      let image_url3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || null;`;
content = content.replace(updateProductPattern, updateProductReplacement);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched productController.js');
