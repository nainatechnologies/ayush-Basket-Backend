require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/db');

async function alterColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await sequelize.query('ALTER TABLE prescriptions MODIFY COLUMN image_url LONGTEXT;');
    console.log('Column modified to LONGTEXT successfully');
  } catch (error) {
    console.error('Error modifying column:', error);
  } finally {
    await sequelize.close();
  }
}

alterColumn();
