const fs = require('fs');
let code = fs.readFileSync('controllers/productController.js', 'utf8');

// Replace addProduct destructuring
code = code.replace(
  /const { name, description, price, offerPrice, stock, category_id, status } = req\.body;/,
  'const { name, description, price, offerPrice, stock, category_id, status, package_size, potency, composition, dosage, meta_title, meta_description } = req.body;'
);

// Replace addProduct INSERT query
code = code.replace(
  /'INSERT INTO products \(name, description, price, offerPrice, stock, category_id, status, image_url\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)',\n\s*\[name, description \|\| '', price, offerPrice \|\| null, stock \|\| 0, actual_category_id, status \|\| 'active', image_url\]/,
  \'INSERT INTO products (name, description, price, offerPrice, stock, category_id, status, image_url, package_size, potency, composition, dosage, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', price, offerPrice || null, stock || 0, actual_category_id, status || 'active', image_url, package_size || null, potency || null, composition || null, dosage || null, meta_title || null, meta_description || null]\
);

// Replace updateProduct destructuring
// Note: It's the same string, but we can do a global replace for the destructuring.
code = code.replace(
  /const { name, description, price, offerPrice, stock, category_id, status } = req\.body;/g,
  'const { name, description, price, offerPrice, stock, category_id, status, package_size, potency, composition, dosage, meta_title, meta_description } = req.body;'
);

// We need to find the updateProduct UPDATE query. Let's see what it is.
