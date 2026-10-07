const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  iconName: {
    type: DataTypes.STRING,
    defaultValue: 'Leaf'
  },
  subcategories: {
    type: DataTypes.JSON, // Use JSON column for array of objects in Sequelize
    defaultValue: []
  }
}, {
  tableName: 'categories'
});

module.exports = Category;
