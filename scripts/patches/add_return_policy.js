require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize } = require('../../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    await sequelize.query("ALTER TABLE products ADD COLUMN return_policy VARCHAR(255) DEFAULT 'Easy Return';");
    console.log('Added return_policy column to products table.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
