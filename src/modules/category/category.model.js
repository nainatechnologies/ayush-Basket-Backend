const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  image: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active'
  }
}, {
  tableName: 'categories'
});

module.exports = Category;
