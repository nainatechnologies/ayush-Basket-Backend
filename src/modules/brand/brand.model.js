const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Brand = sequelize.define('Brand', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'brands'
});

module.exports = Brand;
