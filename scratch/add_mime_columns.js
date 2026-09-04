require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/db');

async function addMimeColumns() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Add to products
    await sequelize.query('ALTER TABLE products ADD COLUMN image_mime_type VARCHAR(255);').catch(e => console.log('Products image_mime_type exists or error:', e.message));
    await sequelize.query('ALTER TABLE products ADD COLUMN image2_mime_type VARCHAR(255);').catch(e => console.log('Products image2_mime_type exists or error:', e.message));
    await sequelize.query('ALTER TABLE products ADD COLUMN image3_mime_type VARCHAR(255);').catch(e => console.log('Products image3_mime_type exists or error:', e.message));

    // Add to prescriptions
    await sequelize.query('ALTER TABLE prescriptions ADD COLUMN image_mime_type VARCHAR(255);').catch(e => console.log('Prescriptions image_mime_type exists or error:', e.message));

    console.log('MIME columns added successfully');
  } catch (error) {
    console.error('Error modifying tables:', error);
  } finally {
    await sequelize.close();
  }
}

addMimeColumns();
