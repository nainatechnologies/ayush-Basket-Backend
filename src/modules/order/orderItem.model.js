/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [order]: orderItem.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const OrderItem = sequelize.define('OrderItem', {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'product_name'
  },
  productImage: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'product_image'
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'purchase_price'
  }
}, {
  tableName: 'order_items',
  timestamps: false
});

module.exports = OrderItem;
