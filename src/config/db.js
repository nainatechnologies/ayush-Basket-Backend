const { Sequelize } = require('sequelize');

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'];
const missing = requiredEnvVars.filter(v => process.env[v] === undefined);

if (missing.length > 0) {
  console.error('\n❌  STARTUP ERROR: Missing required environment variables!');
  console.error('   Missing:', missing.join(', '));
  console.error('\n🔧  Fix: Create a .env file in the project root.');
  console.error('   You can copy .env.example and fill in the real values:');
  console.error('   cp .env.example .env\n');
  process.exit(1);
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
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      min: process.env.NODE_ENV === 'production' ? 2 : 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      match: [/Deadlock/i, /SequelizeConnectionError/i],
      max: 3,
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
