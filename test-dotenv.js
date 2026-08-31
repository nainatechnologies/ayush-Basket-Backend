require('dotenv').config();
console.log('Password length:', process.env.DB_PASSWORD.length);
console.log('Ends with #?', process.env.DB_PASSWORD.endsWith('#'));
