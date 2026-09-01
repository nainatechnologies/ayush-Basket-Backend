const productService = require('./product.service');
const { processBase64Image } = require('../../utils/imageUtils');

// @desc    Get all products (CUSTOMER — never returns hidden products)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const formatted = await productService.getCustomerProducts(req.query);
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
};

// @desc    Get ALL products including hidden (ADMIN only)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    const formatted = await productService.getAdminProductsList(req.query);
    res.status(200).json({ success: true, count: formatted.length, data: formatted, products: formatted });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ success: false, message: 'Server error fetching products.' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const prod = await productService.getProductDetails(req.params.id);
    res.status(200).json({ success: true, data: prod });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server error fetching product.' });
  }
};

// @desc    Create a product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    let img1 = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
    let img2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) || null;
    let img3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || null;

    if (req.body.imageUrls) {
      const urls = req.body.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
      if (urls[0]) img1 = urls[0];
      if (urls[1]) img2 = urls[1];
      if (urls[2]) img3 = urls[2];
    }

    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter(f => f.fieldname === 'image');
      if (imageFiles[0]) img1 = `/uploads/${imageFiles[0].filename}`;
      if (imageFiles[1]) img2 = `/uploads/${imageFiles[1].filename}`;
      if (imageFiles[2]) img3 = `/uploads/${imageFiles[2].filename}`;
    } else if (req.file) {
      img1 = `/uploads/${req.file.filename}`;
    }

    const product = await productService.createNewProduct(req.body, { img1, img2, img3 });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server error creating product: ' + error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
};

// @desc    Update a product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    let img1 = processBase64Image(req.body.image_url || req.body.image || req.body.imageUrl) || '';
    let img2 = processBase64Image(req.body.image_url2 || req.body.imageUrl2) || undefined;
    let img3 = processBase64Image(req.body.image_url3 || req.body.imageUrl3) || undefined;

    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter(f => f.fieldname === 'image');
      if (imageFiles[0]) img1 = `/uploads/${imageFiles[0].filename}`;
      if (imageFiles[1]) img2 = `/uploads/${imageFiles[1].filename}`;
      if (imageFiles[2]) img3 = `/uploads/${imageFiles[2].filename}`;
    } else if (req.file) {
      img1 = `/uploads/${req.file.filename}`;
    }

    const formatted = await productService.updateExistingProduct(req.params.id, req.body, { img1, img2, img3 });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: formatted
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
};

// @desc    Toggle product visibility (active <-> hidden)
// @route   PUT /api/products/:id/visibility
// @access  Private/Admin
const toggleVisibility = async (req, res) => {
  try {
    const product = await productService.toggleProductVisibility(req.params.id);
    res.status(200).json({ success: true, message: `Product is now ${product.status}.`, status: product.status });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error toggling product visibility:', error);
    res.status(500).json({ success: false, message: 'Server error updating product visibility.' });
  }
};

// @desc    Update product stock only
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
const updateStock = async (req, res) => {
  try {
    const product = await productService.updateProductStock(req.params.id, req.body.stock);
    res.status(200).json({ success: true, message: 'Stock updated.', stock: product.stock, status: product.status });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Server error updating stock.' });
  }
};

// @desc    Delete a product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProductById(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleVisibility,
  updateStock,
  deleteProduct
};
