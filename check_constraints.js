const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false
});

// Check for any FOREIGN KEY constraints on products table
seq.query("SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = DATABASE()")
  .then(([r]) => { console.log("Products constraints:", JSON.stringify(r, null, 2)); return seq.query("SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME='products' AND TABLE_SCHEMA=DATABASE()"); })
  .then(([r]) => { console.log("Products FK/Key usage:", JSON.stringify(r, null, 2)); seq.close(); })
  .catch(e => { console.error(e.message); seq.close(); });
