const cartService = require('./cart.service');

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const { formattedData, subtotal } = await cartService.getCartForUser(req.user.id);
    res.status(200).json({ success: true, count: formattedData.length, subtotal, data: formattedData });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cart' });
  }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart/items
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    await cartService.addItemToCart(req.user.id, product_id, quantity);
    res.status(200).json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Server error adding to cart' });
  }
};

// @desc    Update cart item quantity directly
// @route   PUT /api/cart/items/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    await cartService.updateCartItemQuantity(req.user.id, req.params.id, req.body.quantity);
    res.status(200).json({ success: true, message: 'Cart updated' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Server error updating cart' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private
const removeCartItem = async (req, res) => {
  try {
    await cartService.removeCartItemById(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Server error removing cart item' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    await cartService.clearCartForUser(req.user.id);
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Server error clearing cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
