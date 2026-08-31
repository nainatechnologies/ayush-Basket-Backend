require('dotenv').config();
const mysql = require('mysql2/promise');

async function testMysql2() {
  console.log('Testing mysql2 connection directly...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('SUCCESS: connected via mysql2');
    await connection.end();
  } catch (error) {
    console.log('FAILED via mysql2:');
    console.log(`error.code: ${error.code}`);
    console.log(`error.message: ${error.message}`);
  }
}

testMysql2();
