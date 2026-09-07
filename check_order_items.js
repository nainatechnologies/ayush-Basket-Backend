const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false
});
// Check if order_items has product_name column
seq.query("DESCRIBE order_items")
  .then(([r]) => { r.forEach(row => console.log(`${row.Field} | ${row.Type} | Null:${row.Null}`)); seq.close(); })
  .catch(e => { console.error(e.message); seq.close(); });
