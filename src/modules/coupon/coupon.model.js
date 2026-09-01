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
  
  tag: { type: DataTypes.STRING },
  tagBg: { type: DataTypes.STRING, field: 'tagBg' },
  title: { type: DataTypes.STRING },
  titleAccent: { type: DataTypes.STRING, field: 'titleAccent' },
  subtitle: { type: DataTypes.STRING },
  ctaLink: { type: DataTypes.STRING, field: 'ctaLink' },
  image: { type: DataTypes.STRING },
  gradientBg: { type: DataTypes.STRING, field: 'gradientBg' },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'coupons'
});

module.exports = Coupon;
