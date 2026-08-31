const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const OtpToken = sequelize.define('OtpToken', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'otp_tokens'
});

module.exports = OtpToken;
