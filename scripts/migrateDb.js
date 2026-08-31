const db = require('./config/db');

const migrate = async () => {
  try {
    console.log('Starting DB migration...');

    // Add columns to products
    try {
      await db.query('ALTER TABLE products ADD COLUMN offerPrice DECIMAL(10,2) AFTER price');
      console.log('Added offerPrice to products.');
    } catch (e) {
      console.log('offerPrice already exists or error:', e.message);
    }

    try {
      await db.query('ALTER TABLE products ADD COLUMN status VARCHAR(50) DEFAULT "active" AFTER stock');
      console.log('Added status to products.');
    } catch (e) {
      console.log('status in products already exists or error:', e.message);
    }

    // Add columns to categories
    try {
      await db.query('ALTER TABLE categories ADD COLUMN image VARCHAR(255) AFTER description');
      console.log('Added image to categories.');
    } catch (e) {
      console.log('image in categories already exists or error:', e.message);
    }

    try {
      await db.query('ALTER TABLE categories ADD COLUMN status VARCHAR(50) DEFAULT "active" AFTER image');
      console.log('Added status to categories.');
    } catch (e) {
      console.log('status in categories already exists or error:', e.message);
    }

    console.log('Migration complete!');
    process.exit();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
