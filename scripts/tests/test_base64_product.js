require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const productService = require('../../src/modules/product/product.service');
const fs = require('fs');

(async () => {
  try {
    const data = {
      name: 'Base64 Product Test',
      price: 250,
      stock: 5,
      category_id: 'Ayurveda'
    };
    
    // Create a dummy base64 string directly
    const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const images = {
      img1: dummyBase64
    };

    const product = await productService.createNewProduct(data, images);
    console.log('✅ Product created successfully:', product.id);
    console.log('Image URL length:', product.imageUrl.length);
  } catch (error) {
    console.error('❌ Error creating product:', error);
  } finally {
    process.exit();
  }
})();
