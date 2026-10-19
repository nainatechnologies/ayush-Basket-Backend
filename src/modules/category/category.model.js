/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [category]: category.model
 */

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
