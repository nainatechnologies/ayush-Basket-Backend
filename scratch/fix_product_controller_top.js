const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/controllers/productController.js');
let content = fs.readFileSync(targetFile, 'utf8');

// The messed up lines are:
// const { Op } = require('sequelize');let image_url = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
//       let image_url2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) ||let image_url = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
//       let image_url2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) || null;
//       let image_url3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || null;
//       let image_url3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || null;n

const brokenTopPattern = /const \{ Op \} = require\('sequelize'\);let image_url =.*?\n.*?\n.*?\n.*?\n.*?n\n/g;
content = content.replace(brokenTopPattern, "const { Op } = require('sequelize');\n");

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Fixed broken top lines');
