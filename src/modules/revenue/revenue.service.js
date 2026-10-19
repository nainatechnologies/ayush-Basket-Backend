/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [revenue]: revenue.service
 */

const sequelize = require('../../config/db');
const DailyRevenue = require('./dailyRevenue.model');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const { Op } = require('sequelize');

const logOrderRevenue = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) return;
  if (order.revenueLogged) return; // Prevent double logging

  let purchaseMoney = 0;
  let sellingMoney = 0;

  for (const item of order.items) {
    const itemSellingPrice = parseFloat(item.price) || 0;
    const itemCostPrice = parseFloat(item.purchasePrice || 0) > 0 ? parseFloat(item.purchasePrice) : itemSellingPrice * 0.7;
    
    sellingMoney += itemSellingPrice * item.quantity;
    purchaseMoney += itemCostPrice * item.quantity;
  }
  
  // Wait, if order has discounts or delivery fee, they affect selling money and profit
  // sellingMoney should probably just be the sum of items, or order.total
  // Let's use order.total for actual selling money (as they pay it), minus delivery fee if we don't count it.
  // Actually, profit = sellingMoney - purchaseMoney. If discount is applied, sellingMoney is lower.
  // So sellingMoney = parseFloat(order.total) - parseFloat(order.deliveryFee || 0);
  // This is safer.
  sellingMoney = parseFloat(order.totalAmount || 0) - parseFloat(order.deliveryFee || 0);
  
  const profitMoney = sellingMoney - purchaseMoney;

  const orderDate = new Date(order.created_at || new Date()).toISOString().split('T')[0];

  // Upsert DailyRevenue
  const [daily, created] = await DailyRevenue.findOrCreate({
    where: { date: orderDate },
    defaults: {
      ordersCount: 1,
      purchaseMoney,
      sellingMoney,
      profitMoney
    }
  });

  if (!created) {
    daily.ordersCount += 1;
    daily.purchaseMoney = parseFloat(daily.purchaseMoney) + purchaseMoney;
    daily.sellingMoney = parseFloat(daily.sellingMoney) + sellingMoney;
    daily.profitMoney = parseFloat(daily.profitMoney) + profitMoney;
    await daily.save();
  }

  order.revenueLogged = true;
  await order.save();
};

const getRevenueData = async (filters) => {
  const { filter, start, end } = filters;

  let whereClauses = {};
  
  if (filter === 'This Month') {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    whereClauses.date = { [Op.between]: [firstDay, lastDay] };
  } else if (start && end) {
    whereClauses.date = { [Op.between]: [start, end] };
  }

  const dailyRecords = await DailyRevenue.findAll({
    where: whereClauses,
    order: [['date', 'DESC']]
  });

  let stats = {
    purchaseMoney: 0,
    sellingMoney: 0,
    profitMoney: 0
  };

  const dailyData = dailyRecords.map(r => {
    stats.purchaseMoney += parseFloat(r.purchaseMoney);
    stats.sellingMoney += parseFloat(r.sellingMoney);
    stats.profitMoney += parseFloat(r.profitMoney);
    
    // format date e.g. Oct 25, 2023
    const dateObj = new Date(r.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return {
      date: dateStr,
      ordersCount: r.ordersCount,
      purchaseMoney: parseFloat(r.purchaseMoney),
      sellingMoney: parseFloat(r.sellingMoney),
      profitMoney: parseFloat(r.profitMoney)
    };
  });

  return {
    stats,
    dailyData
  };
};

module.exports = {
  logOrderRevenue,
  getRevenueData
};
