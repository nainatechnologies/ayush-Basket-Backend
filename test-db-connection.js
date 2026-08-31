require('dotenv').config();
const sequelize = require('./src/config/db');

console.log('Testing AyushBasket MySQL connection...\n');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Password: configured\n`);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('SUCCESS:');
    console.log('MySQL connection established successfully.\n');
    
    const [dbResult] = await sequelize.query('SELECT DATABASE() as db;');
    console.log(`Current Database: ${dbResult[0].db}`);
    
    const [versionResult] = await sequelize.query('SELECT VERSION() as version;');
    console.log(`MySQL Version: ${versionResult[0].version}`);
    
    const [tablesResult] = await sequelize.query('SHOW TABLES;');
    console.log(`\nTables:`);
    tablesResult.forEach(t => console.log(`- ${Object.values(t)[0]}`));

    process.exit(0);
  } catch (error) {
    console.log('FAILED:\n');
    console.log(`error.name: ${error.name}`);
    console.log(`error.message: ${error.message}`);
    if (error.original) {
      console.log(`error.code: ${error.original.code}`);
      console.log(`error.errno: ${error.original.errno}`);
      console.log(`error.sqlState: ${error.original.sqlState}`);
    }
    process.exit(1);
  }
}

testConnection();
