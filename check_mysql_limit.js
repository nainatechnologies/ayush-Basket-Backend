const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false
});
seq.query("SELECT @@max_allowed_packet AS max_allowed_packet")
  .then(([r]) => { console.log("max_allowed_packet:", r[0].max_allowed_packet, "bytes =", Math.round(r[0].max_allowed_packet/1024/1024), "MB"); seq.close(); })
  .catch(e => { console.error(e.message); seq.close(); });
