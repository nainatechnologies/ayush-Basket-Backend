/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [wishlist]: wishlistItem.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const WishlistItem = sequelize.define('WishlistItem', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id'
  }
}, {
  tableName: 'wishlist_items',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id']
    }
  ]
});

module.exports = WishlistItem;
