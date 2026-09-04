require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/db');

async function addColumn() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await sequelize.query('ALTER TABLE prescriptions ADD COLUMN address TEXT;');
    console.log('Column added successfully');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('Column already exists');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await sequelize.close();
  }
}

addColumn();
