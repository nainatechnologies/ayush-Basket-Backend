/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [revenue]: dailyRevenue.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const DailyRevenue = sequelize.define('DailyRevenue', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  ordersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'orders_count'
  },
  purchaseMoney: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'purchase_money'
  },
  sellingMoney: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'selling_money'
  },
  profitMoney: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'profit_money'
  }
}, {
  tableName: 'daily_revenue',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DailyRevenue;
