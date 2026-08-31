const { Category, Product } = require('../../models');
const { Op } = require('sequelize');

const getAllCategories = async () => {
  return await Category.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']]
  });
};

const createNewCategory = async (data) => {
  const existing = await Category.findOne({ where: { name: data.name.trim() } });
  if (existing) {
    const error = new Error('A category with this name already exists.');
    error.statusCode = 409;
    throw error;
  }

  return await Category.create({
    name: data.name.trim(),
    description: data.description || '',
    image: data.image || null,
    status: 'active'
  });
};

const updateExistingCategory = async (id, data) => {
  const category = await Category.findByPk(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.name !== undefined) category.name = data.name.trim();
  if (data.description !== undefined) category.description = data.description;
  if (data.status !== undefined) category.status = data.status;

  await category.save();
  return category;
};

const deleteCategoryById = async (id) => {
  const result = await Category.destroy({ where: { id } });
  if (result === 0) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }
};

const getProductsByCategory = async (categoryId) => {
  return await Product.findAll({
    where: {
      categoryId,
      status: { [Op.ne]: 'hidden' }
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = {
  getAllCategories,
  createNewCategory,
  updateExistingCategory,
  deleteCategoryById,
  getProductsByCategory
};
