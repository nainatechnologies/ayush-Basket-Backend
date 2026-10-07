const Category = require('./category.model');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

const productService = require('../product/product.service');
const jwt = require('jsonwebtoken');

exports.getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    let userId = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {}
    }
    
    const formatted = await productService.getCustomerProducts({ category: categoryId }, userId);
    res.status(200).json({ success: true, count: formatted.length, data: formatted, products: formatted });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
};
