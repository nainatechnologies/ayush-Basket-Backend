require('dotenv').config();
const { sequelize, syncDB } = require('./src/models');

async function testSync() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    await syncDB();
    console.log('Sync complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  }
}

testSync();
