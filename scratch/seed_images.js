const fs = require('fs');
const path = require('path');
const https = require('https');
const sequelize = require('../src/config/db');

async function seedImages() {
  try {
    const products = await sequelize.query("SELECT id, name, image_url FROM products WHERE image_url IS NULL OR image_url = ''");
    const productsWithoutImages = products[0];

    if (productsWithoutImages.length === 0) {
      console.log('All products already have images!');
      process.exit(0);
    }

    console.log(`Found ${productsWithoutImages.length} products without images. Seeding...`);

    // Download a generic medicine bottle placeholder image
    const placeholderPath = path.join(__dirname, '../uploads/dummy-medicine.png');
    const file = fs.createWriteStream(placeholderPath);
    
    await new Promise((resolve, reject) => {
      https.get('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(resolve);
        });
      }).on('error', function(err) {
        fs.unlink(placeholderPath, () => {}); 
        reject(err);
      });
    });

    console.log('Placeholder image downloaded.');

    for (let product of productsWithoutImages) {
      await sequelize.query(
        "UPDATE products SET image_url = '/uploads/dummy-medicine.png' WHERE id = ?",
        { replacements: [product.id] }
      );
    }

    console.log('Successfully seeded dummy images to products without images!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding images:', error);
    process.exit(1);
  }
}

seedImages();
