/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [order]: orderNotification.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const OrderNotification = sequelize.define('OrderNotification', {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id'
  },
  notificationType: {
    type: DataTypes.ENUM('ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_OUT_FOR_DELIVERY', 'ORDER_COMPLETED'),
    allowNull: false,
    field: 'notification_type'
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'phone_number'
  },
  templateId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'template_id'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'sent'
  },
  providerMessageId: {
    type: DataTypes.STRING(255),
    field: 'provider_message_id'
  }
}, {
  tableName: 'order_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['order_id', 'notification_type'],
      name: 'unique_order_notification_idx'
    }
  ]
});

module.exports = OrderNotification;
