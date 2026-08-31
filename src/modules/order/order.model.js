const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Order = sequelize.define('Order', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  addressId: {
    type: DataTypes.INTEGER,
    field: 'address_id'
  },
  couponId: {
    type: DataTypes.INTEGER,
    field: 'coupon_id'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    field: 'payment_method'
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  transactionId: {
    type: DataTypes.STRING,
    field: 'transaction_id'
  }
}, {
  tableName: 'orders'
});

module.exports = Order;
