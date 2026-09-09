const productService = require('./product.service');
const { extractBase64AndMimeType } = require('../../utils/imageUtils');
const jwt = require('jsonwebtoken');

const getImageUrlFromFile = (file) => {
  if (!file || !file.buffer) return null;
  return {
    mimeType: file.mimetype,
    base64: file.buffer.toString('base64')
  };
};

// @desc    Search products by name/description/category (customer-facing)
// @route   GET /api/products/search?q=term
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const formatted = await productService.searchProducts(q.trim());
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ success: false, message: 'Server error searching products.' });
  }
};

// @desc    Get all products (CUSTOMER — never returns hidden products)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid token for public route
      }
    }
    const formatted = await productService.getCustomerProducts(req.query, userId);
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
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid token
      }
    }
    const product = await productService.getProductDetails(req.params.id, userId);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });

    try {
      // Fallback
      const fallbackProduct = await productService.getProductById(req.params.id);
      if (!fallbackProduct) return res.status(404).json({ success: false, message: 'Product not found.' });
      return res.status(200).json({ success: true, data: fallbackProduct });
    } catch (fallbackError) {
      console.error('Error fetching product:', fallbackError);
      return res.status(500).json({ success: false, message: 'Server error fetching product.' });
    }
  }
};

// @desc    Create a new product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    let img1 = extractBase64AndMimeType(req.body.image_url || req.body.image || req.body.imageUrl) || null;
    let img2 = extractBase64AndMimeType(req.body.image_url2 || req.body.imageUrl2) || null;
    let img3 = extractBase64AndMimeType(req.body.image_url3 || req.body.imageUrl3) || null;

    if (req.body.imageUrls) {
      const urls = req.body.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
      if (urls[0]) img1 = extractBase64AndMimeType(urls[0]);
      if (urls[1]) img2 = extractBase64AndMimeType(urls[1]);
      if (urls[2]) img3 = extractBase64AndMimeType(urls[2]);
    }

    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter(f => f.fieldname === 'image');
      if (imageFiles[0]) img1 = getImageUrlFromFile(imageFiles[0]) || img1;
      if (imageFiles[1]) img2 = getImageUrlFromFile(imageFiles[1]) || img2;
      if (imageFiles[2]) img3 = getImageUrlFromFile(imageFiles[2]) || img3;
    } else if (req.file) {
      img1 = getImageUrlFromFile(req.file) || img1;
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
    let img1 = extractBase64AndMimeType(req.body.image_url || req.body.image || req.body.imageUrl) || null;
    let img2 = extractBase64AndMimeType(req.body.image_url2 || req.body.imageUrl2) || null;
    let img3 = extractBase64AndMimeType(req.body.image_url3 || req.body.imageUrl3) || null;

    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter(f => f.fieldname === 'image');
      if (imageFiles[0]) img1 = getImageUrlFromFile(imageFiles[0]) || img1;
      if (imageFiles[1]) img2 = getImageUrlFromFile(imageFiles[1]) || img2;
      if (imageFiles[2]) img3 = getImageUrlFromFile(imageFiles[2]) || img3;
    } else if (req.file) {
      img1 = getImageUrlFromFile(req.file) || img1;
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
  searchProducts,
  getProducts,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleVisibility,
  updateStock,
  deleteProduct
};
