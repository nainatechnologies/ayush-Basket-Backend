const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Coupon = sequelize.define('Coupon', {
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
    field: 'discount_type'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'discount_value'
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'min_order_amount'
  },
  expiryDate: {
    type: DataTypes.DATE,
    field: 'expiry_date'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'coupons'
});

module.exports = Coupon;
