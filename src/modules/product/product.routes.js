const express = require('express');
const router = express.Router();
const {
  getProducts, getAdminProducts, getProductById, searchProducts,
  createProduct, updateProduct, deleteProduct,
  toggleVisibility, updateStock
} = require('./product.controller');
const { protect, admin } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

const validate = require('../../middleware/validate.middleware');
const { createProductSchema, updateProductSchema, updateStockSchema } = require('./product.validation');

// Public customer routes
router.route('/')
  .get(getProducts)
  .post(protect, admin, upload.any(), validate(createProductSchema), createProduct);

// Admin-only full product list (includes hidden)
router.get('/admin/all', protect, admin, getAdminProducts);

// Public search
router.get('/search', searchProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.any(), validate(updateProductSchema), updateProduct)
  .delete(protect, admin, deleteProduct);

// Admin special routes
router.put('/:id/visibility', protect, admin, toggleVisibility);
router.put('/:id/stock', protect, admin, validate(updateStockSchema), updateStock);

module.exports = router;
