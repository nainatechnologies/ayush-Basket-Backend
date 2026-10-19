/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [cart]: cart.service
 */

const { CartItem, Product } = require('../../models');

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return `data:${mimeType || 'image/jpeg'};base64,${url}`;
};

const getCartForUser = async (userId) => {
  const cartItems = await CartItem.findAll({
    where: { userId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'offerPrice', 'imageUrl', 'imageMimeType', 'stock', 'status']
      }
    ]
  });

  let subtotal = 0;
  const formattedData = cartItems
    .filter(item => item.product && item.product.status !== 'hidden')
    .map(item => {
      const product = item.product;
      const priceToUse = product.offerPrice ? parseFloat(product.offerPrice) : parseFloat(product.price);
      
      const isOutOfStock = Number(product.stock) <= 0 || 
        (product.status && (
          product.status.toLowerCase() === 'out of stock' ||
          product.status.toLowerCase() === 'out_of_stock' ||
          product.status.toLowerCase() === 'inactive' ||
          product.status.toLowerCase() === 'not active'
        ));

      // If out of stock or stock has dropped below what they had in cart, adjust it
      let safeQuantity = item.quantity;
      if (isOutOfStock) {
        safeQuantity = 0;
      } else if (product.stock < safeQuantity) {
        safeQuantity = product.stock;
      }

      if (!isOutOfStock) {
        subtotal += priceToUse * safeQuantity;
      }
      
      const finalImageUrl = buildImageSource(product.imageUrl, product.imageMimeType);
      
      return {
        id: item.id,
        quantity: safeQuantity,
        product_id: product.id,
        name: product.name,
        price: product.price,
        offerPrice: product.offerPrice,
        image_url: finalImageUrl,
        image: finalImageUrl,
        imageUrl: finalImageUrl,
        stock: isOutOfStock ? 0 : product.stock,
        status: isOutOfStock ? 'Out of Stock' : (product.status || 'In Stock'),
        inStock: !isOutOfStock,
        isOutOfStock: isOutOfStock
      };
    });

  return { formattedData, subtotal };
};

const addItemToCart = async (userId, product_id, quantity) => {
  const qty = parseInt(quantity, 10);
  const product = await Product.findByPk(product_id);

  if (!product || product.status === 'hidden') {
    const error = new Error('Product not found or unavailable');
    error.statusCode = 404;
    throw error;
  }

  const isOutOfStock = Number(product.stock) <= 0 || 
    (product.status && (
      product.status.toLowerCase() === 'out of stock' ||
      product.status.toLowerCase() === 'out_of_stock' ||
      product.status.toLowerCase() === 'inactive' ||
      product.status.toLowerCase() === 'not active'
    ));

  if (isOutOfStock || product.stock < qty) {
    const error = new Error(`Product ${product.name} is currently out of stock`);
    error.statusCode = 400;
    throw error;
  }

  const existingItem = await CartItem.findOne({
    where: { userId, productId: product_id }
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + qty;
    if (product.stock < newQuantity) {
      const error = new Error(`Only ${product.stock} item(s) in stock. You already have ${existingItem.quantity} in your cart.`);
      error.statusCode = 400;
      throw error;
    }
    existingItem.quantity = newQuantity;
    await existingItem.save();
  } else {
    await CartItem.create({
      userId,
      productId: product_id,
      quantity: qty
    });
  }
};

const updateCartItemQuantity = async (userId, cartItemId, quantity) => {
  const qty = parseInt(quantity, 10);

  const cartItem = await CartItem.findOne({
    where: { id: cartItemId, userId },
    include: [{ model: Product, as: 'product' }]
  });

  if (!cartItem) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }

  const isOutOfStock = Number(cartItem.product.stock) <= 0 || 
    (cartItem.product.status && (
      cartItem.product.status.toLowerCase() === 'out of stock' ||
      cartItem.product.status.toLowerCase() === 'out_of_stock' ||
      cartItem.product.status.toLowerCase() === 'inactive' ||
      cartItem.product.status.toLowerCase() === 'not active'
    ));

  if (isOutOfStock || cartItem.product.stock < qty) {
    const error = new Error('Product is currently out of stock');
    error.statusCode = 400;
    throw error;
  }

  cartItem.quantity = qty;
  await cartItem.save();
};

const removeCartItemById = async (userId, cartItemId) => {
  const result = await CartItem.destroy({
    where: { id: cartItemId, userId }
  });
  
  if (result === 0) {
    const error = new Error('Cart item not found');
    error.statusCode = 404;
    throw error;
  }
};

const clearCartForUser = async (userId) => {
  await CartItem.destroy({
    where: { userId }
  });
};

module.exports = {
  getCartForUser,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItemById,
  clearCartForUser
};
