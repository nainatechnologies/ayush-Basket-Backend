const { CartItem, Product } = require('../../models');

const getCartForUser = async (userId) => {
  const cartItems = await CartItem.findAll({
    where: { userId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'offerPrice', 'imageUrl', 'stock', 'status']
      }
    ]
  });

  let subtotal = 0;
  const formattedData = cartItems
    .filter(item => item.product && item.product.status !== 'hidden')
    .map(item => {
      const product = item.product;
      const priceToUse = product.offerPrice ? parseFloat(product.offerPrice) : parseFloat(product.price);
      subtotal += priceToUse * item.quantity;
      
      return {
        id: item.id,
        quantity: item.quantity,
        product_id: product.id,
        name: product.name,
        price: product.price,
        offerPrice: product.offerPrice,
        image_url: product.imageUrl,
        stock: product.stock
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

  if (product.stock < qty) {
    const error = new Error(`Only ${product.stock} item(s) available in stock`);
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

  if (cartItem.product.stock < qty) {
    const error = new Error('Not enough stock available');
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
