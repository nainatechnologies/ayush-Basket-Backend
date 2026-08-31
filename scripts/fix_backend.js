require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/models');

async function resetAdmin() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await sequelize.query(`UPDATE users SET password='${hash}' WHERE email='admin@ayushbasket.com'`);
    console.log('Admin password reset to password123');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

resetAdmin();
