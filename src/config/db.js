const { Sequelize } = require('sequelize');

if (!process.env.DB_HOST) throw new Error('DB_HOST is missing');
if (!process.env.DB_PORT) throw new Error('DB_PORT is missing');
if (!process.env.DB_USER) throw new Error('DB_USER is missing');
if (!process.env.DB_NAME) throw new Error('DB_NAME is missing');
if (!process.env.DB_PASSWORD && process.env.DB_PASSWORD !== '') {
  // It's possible to have an empty password in local dev, but the variable should be defined.
  // Actually let's just make sure it's not undefined.
  if (typeof process.env.DB_PASSWORD === 'undefined') {
    throw new Error('DB_PASSWORD is missing');
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false, // set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅  MySQL connected → ${process.env.DB_HOST}:${process.env.DB_PORT} / ${process.env.DB_NAME} via Sequelize`);
  } catch (error) {
    console.error('❌  MySQL Connection Error via Sequelize:', error.message);
    process.exit(1);
  }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
