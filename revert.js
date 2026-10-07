const fs = require('fs');
const path = require('path');

const revertPatch = () => {
  try {
    // 1. Revert product.controller.js
    const controllerPath = path.join(__dirname, 'src/modules/product/product.controller.js');
    let controllerData = fs.readFileSync(controllerPath, 'utf8');
    
    // Remove getProductImage function and export
    controllerData = controllerData.replace(/\/\/ @desc    Get product image[\s\S]*?const getProductImage = async \(req, res\) => {[\s\S]*?};\n\n/, '');
    controllerData = controllerData.replace(/deleteProduct,\s*getProductImage/, 'deleteProduct');
    fs.writeFileSync(controllerPath, controllerData);
    console.log('Reverted product.controller.js');

    // 2. Revert product.routes.js
    const routesPath = path.join(__dirname, 'src/modules/product/product.routes.js');
    let routesData = fs.readFileSync(routesPath, 'utf8');
    routesData = routesData.replace(/toggleVisibility, updateStock, getProductImage/, 'toggleVisibility, updateStock');
    routesData = routesData.replace(/\/\/ Image endpoints\nrouter\.get\('\/:id\/image', getProductImage\);\nrouter\.get\('\/:id\/image\/:index', getProductImage\);\n\n/, '');
    fs.writeFileSync(routesPath, routesData);
    console.log('Reverted product.routes.js');

    // 3. Revert product.service.js
    const productServicePath = path.join(__dirname, 'src/modules/product/product.service.js');
    let prodServiceData = fs.readFileSync(productServicePath, 'utf8');
    
    prodServiceData = prodServiceData.replace(
      /const buildImageSource = \(url, mimeType, id, index = 1\) => {[\s\S]*?};/,
      `const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return \`data:\${mimeType || 'image/jpeg'};base64,\${url}\`;
};`
    );
    prodServiceData = prodServiceData.replace(/buildImageSource\(prod\.imageUrl, prod\.imageMimeType, prod\.id, 1\)/g, 'buildImageSource(prod.imageUrl, prod.imageMimeType)');
    prodServiceData = prodServiceData.replace(/buildImageSource\(prod\.imageUrl2, prod\.image2MimeType, prod\.id, 2\)/g, 'buildImageSource(prod.imageUrl2, prod.image2MimeType)');
    prodServiceData = prodServiceData.replace(/buildImageSource\(prod\.imageUrl3, prod\.image3MimeType, prod\.id, 3\)/g, 'buildImageSource(prod.imageUrl3, prod.image3MimeType)');
    fs.writeFileSync(productServicePath, prodServiceData);
    console.log('Reverted product.service.js');

    // 4. Revert cart.service.js
    const cartServicePath = path.join(__dirname, 'src/modules/cart/cart.service.js');
    let cartServiceData = fs.readFileSync(cartServicePath, 'utf8');
    cartServiceData = cartServiceData.replace(
      /const buildImageSource = \(url, mimeType, productId, index = 1\) => {[\s\S]*?};/,
      `const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return \`data:\${mimeType || 'image/jpeg'};base64,\${url}\`;
};`
    );
    cartServiceData = cartServiceData.replace(/buildImageSource\(product\.imageUrl, product\.imageMimeType, product\.id, 1\)/g, 'buildImageSource(product.imageUrl, product.imageMimeType)');
    fs.writeFileSync(cartServicePath, cartServiceData);
    console.log('Reverted cart.service.js');

    // 5. Revert wishlist.service.js
    const wishlistServicePath = path.join(__dirname, 'src/modules/wishlist/wishlist.service.js');
    let wishlistServiceData = fs.readFileSync(wishlistServicePath, 'utf8');
    wishlistServiceData = wishlistServiceData.replace(
      /const buildImageSource = \(url, mimeType, productId, index = 1\) => {[\s\S]*?};/,
      `const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return \`data:\${mimeType || 'image/jpeg'};base64,\${url}\`;
};`
    );
    wishlistServiceData = wishlistServiceData.replace(/buildImageSource\(i\.product\.imageUrl, i\.product\.imageMimeType, i\.product\.id, 1\)/g, 'buildImageSource(i.product.imageUrl, i.product.imageMimeType)');
    fs.writeFileSync(wishlistServicePath, wishlistServiceData);
    console.log('Reverted wishlist.service.js');

    console.log('All files reverted successfully.');
  } catch (error) {
    console.error('Error reverting files:', error);
  }
};

revertPatch();
