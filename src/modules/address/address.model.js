const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Address = sequelize.define('Address', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  street: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  pincode: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  addressType: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    defaultValue: 'home',
    field: 'address_type'
  },
  flatHouse: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'flat_house'
  }
}, {
  tableName: 'addresses'
});

module.exports = Address;
