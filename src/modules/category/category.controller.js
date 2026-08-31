const categoryService = require('./category.service');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories.' });
  }
};

// @desc    Create a category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const newCategory = await categoryService.createNewCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
};

// @desc    Update a category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateExistingCategory(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Category updated.', data: category });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error updating category.' });
  }
};

// @desc    Delete a category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategoryById(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
};

// @desc    Get products by category
// @route   GET /api/categories/:categoryId/products
// @access  Public
const getCategoryProducts = async (req, res) => {
  try {
    const products = await categoryService.getProductsByCategory(req.params.categoryId);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, getCategoryProducts };
