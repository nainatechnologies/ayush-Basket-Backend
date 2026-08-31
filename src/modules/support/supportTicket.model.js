const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const SupportTicket = sequelize.define('SupportTicket', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'open'
  },
  adminReply: {
    type: DataTypes.TEXT,
    field: 'admin_reply'
  }
}, {
  tableName: 'support_tickets'
});

module.exports = SupportTicket;
