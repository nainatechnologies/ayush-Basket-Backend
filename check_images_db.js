const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false
});
seq.query("SELECT id, name, CHAR_LENGTH(image_url) AS img1_chars, CHAR_LENGTH(image_url2) AS img2_chars, image_mime_type FROM products ORDER BY id DESC LIMIT 5")
  .then(([r]) => { r.forEach(row => console.log(JSON.stringify(row))); seq.close(); })
  .catch(e => { console.error(e.message); seq.close(); });
