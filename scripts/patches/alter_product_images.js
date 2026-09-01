require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const sequelize = require('../../src/config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    await sequelize.query('ALTER TABLE products MODIFY COLUMN image_url LONGTEXT;');
    console.log('✅ Altered image_url to LONGTEXT');
    
    await sequelize.query('ALTER TABLE products MODIFY COLUMN image_url2 LONGTEXT;');
    console.log('✅ Altered image_url2 to LONGTEXT');
    
    await sequelize.query('ALTER TABLE products MODIFY COLUMN image_url3 LONGTEXT;');
    console.log('✅ Altered image_url3 to LONGTEXT');
    
  } catch (error) {
    console.error('❌ Error altering table:', error);
  } finally {
    process.exit();
  }
})();
