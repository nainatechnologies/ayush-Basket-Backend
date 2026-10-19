/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [auth]: registrationOtp.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const RegistrationOtp = sequelize.define('RegistrationOtp', {
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'registration_otps'
});

module.exports = RegistrationOtp;
