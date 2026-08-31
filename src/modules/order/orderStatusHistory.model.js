const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'changed_by'
  }
}, {
  tableName: 'order_status_history'
});

module.exports = OrderStatusHistory;
