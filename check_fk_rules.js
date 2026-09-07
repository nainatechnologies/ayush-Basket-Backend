const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false
});
seq.query("SELECT UPDATE_RULE, DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_NAME='products_ibfk_1' AND CONSTRAINT_SCHEMA=DATABASE()")
  .then(([r]) => { console.log("FK rules:", JSON.stringify(r)); seq.close(); })
  .catch(e => { console.error(e.message); seq.close(); });
