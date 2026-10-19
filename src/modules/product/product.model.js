/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [product]: product.model
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  fullDescription: {
    type: DataTypes.TEXT,
    field: 'full_description'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  offerPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'offerPrice'
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'discount_percentage'
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'cost_price'
  },
  expense: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'expense'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active'
  },
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00,
    field: 'average_rating'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id'
  },
  imageUrl: {
    type: DataTypes.TEXT('long'),
    field: 'image_url',
    allowNull: true,
  },
  imageMimeType: {
    type: DataTypes.STRING,
    field: 'image_mime_type',
    allowNull: true,
  },
  imageUrl2: {
    type: DataTypes.TEXT('long'),
    field: 'image_url2',
    allowNull: true,
  },
  image2MimeType: {
    type: DataTypes.STRING,
    field: 'image2_mime_type',
    allowNull: true,
  },
  imageUrl3: {
    type: DataTypes.TEXT('long'),
    field: 'image_url3',
    allowNull: true,
  },
  image3MimeType: {
    type: DataTypes.STRING,
    field: 'image3_mime_type',
    allowNull: true,
  },
  packageSize: {
    type: DataTypes.STRING,
    field: 'package_size'
  },
  potency: {
    type: DataTypes.STRING,
    field: 'potency'
  },
  composition: {
    type: DataTypes.TEXT,
    field: 'composition'
  },
  dosage: {
    type: DataTypes.TEXT,
    field: 'dosage'
  },
  metaTag: {
    type: DataTypes.STRING,
    field: 'meta_tag'
  },
  productTag: {
    type: DataTypes.STRING,
    field: 'product_tag'
  },
  metaTitle: {
    type: DataTypes.STRING,
    field: 'meta_title'
  },
  metaDescription: {
    type: DataTypes.TEXT,
    field: 'meta_description'
  },
  returnPolicy: {
    type: DataTypes.STRING,
    defaultValue: 'Easy Return',
    field: 'return_policy'
  }
}, {
  tableName: 'products'
});

module.exports = Product;
