const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, getCategoryProducts } = require('./category.controller');
const { protect, admin } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate.middleware');
const { createCategorySchema, updateCategorySchema } = require('./category.validation');

router.route('/')
  .get(getCategories)
  .post(protect, admin, validate(createCategorySchema), createCategory);

router.route('/:id')
  .put(protect, admin, validate(updateCategorySchema), updateCategory)
  .delete(protect, admin, deleteCategory);

router.route('/:categoryId/products')
  .get(getCategoryProducts);

module.exports = router;
