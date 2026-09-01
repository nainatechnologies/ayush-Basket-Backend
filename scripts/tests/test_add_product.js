require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const productService = require('../../src/modules/product/product.service');

(async () => {
  try {
    const data = {
      name: 'Test Product ' + Date.now(),
      price: 100,
      stock: 10,
      category_id: 'Homeopathy' // Using name as supported by resolveCategoryId
    };
    const images = {
      img1: '/uploads/test.jpg'
    };

    const product = await productService.createNewProduct(data, images);
    console.log('✅ Product created successfully:', product.id);
  } catch (error) {
    console.error('❌ Error creating product:', error);
  } finally {
    process.exit();
  }
})();
