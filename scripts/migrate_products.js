const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ayushbasket'
  });

  try {
    const columns = [
      { name: 'package_size', type: 'VARCHAR(100)' },
      { name: 'potency', type: 'VARCHAR(100)' },
      { name: 'composition', type: 'TEXT' },
      { name: 'dosage', type: 'TEXT' },
      { name: 'meta_title', type: 'VARCHAR(255)' },
      { name: 'meta_description', type: 'TEXT' }
    ];

    for (const col of columns) {
      try {
        await conn.query("ALTER TABLE products ADD COLUMN " + col.name + " " + col.type + " NULL");
        console.log("Added column " + col.name);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log("Column " + col.name + " already exists");
        } else {
          console.error("Error adding " + col.name + ":", e.message);
        }
      }
    }
  } finally {
    conn.end();
  }
}

run().catch(console.error);
