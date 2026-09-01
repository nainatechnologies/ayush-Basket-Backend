const { Product, Category } = require('../../models');
const { Op } = require('sequelize');

const getCustomerProducts = async (filters) => {
  const { search, category, stockStatus } = filters;
  let whereClause = { status: { [Op.ne]: 'Inactive' } };

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (stockStatus === 'in_stock') {
    whereClause.stock = { [Op.gt]: 0 };
  } else if (stockStatus === 'out_of_stock') {
    whereClause.stock = 0;
  }

  let includeClause = [{ model: Category, as: 'category' }];

  if (category && category !== 'All' && category !== 'null' && category !== 'undefined') {
    if (isNaN(Number(category))) {
      includeClause[0].where = { name: { [Op.like]: `%${category}%` } };
    } else {
      whereClause.categoryId = category;
    }
  }

  const products = await Product.findAll({
    where: whereClause,
    include: includeClause,
    order: [['created_at', 'DESC']]
  });

  return products.map(p => {
    const prod = p.toJSON();
    prod.category_name = prod.category ? prod.category.name : null;
    prod.category = prod.category_name;
    prod.image = prod.imageUrl || null;
    prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);
    return prod;
  });
};

const getAdminProductsList = async (filters) => {
  const { search, category, status } = filters;
  let whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  if (status && status !== 'All' && status !== 'null' && status !== 'undefined') {
    whereClause.status = status;
  }

  let includeClause = [{ model: Category, as: 'category' }];

  if (category && category !== 'All' && category !== 'null' && category !== 'undefined') {
    if (isNaN(Number(category))) {
      includeClause[0].where = { name: { [Op.like]: `%${category}%` } };
    } else {
      whereClause.categoryId = category;
    }
  }

  const products = await Product.findAll({
    where: whereClause,
    include: includeClause,
    order: [['created_at', 'DESC']]
  });

  return products.map(p => {
    const prod = p.toJSON();
    prod.category_name = prod.category ? prod.category.name : null;
    prod.category = prod.category_name;
    prod.image = prod.imageUrl || null;
    prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);
    return prod;
  });
};

const getProductDetails = async (id) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category' }]
  });

  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const prod = product.toJSON();
  prod.category_name = prod.category ? prod.category.name : null;
  prod.image = prod.imageUrl || null;
  prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);

  return prod;
};

const resolveCategoryId = async (category_id) => {
  if (!category_id) return null;
  if (isNaN(Number(category_id))) {
    const cat = await Category.findOne({ where: { name: category_id } });
    if (!cat) throw new Error('Selected category does not exist.');
    return cat.id;
  }
  const cat = await Category.findByPk(category_id);
  if (!cat) throw new Error('Selected category does not exist.');
  return cat.id;
};

const createNewProduct = async (data, images) => {
  try {
    const actual_category_id = await resolveCategoryId(data.category_id);
    const discountPct = parseFloat(data.discount_percentage) || 0;
    
    let calculatedOfferPrice = parseFloat(data.price);
    if (discountPct > 0) {
      calculatedOfferPrice = parseFloat(data.price) - (parseFloat(data.price) * discountPct / 100);
    }

    const product = await Product.create({
      name: data.name.trim(),
      description: data.description || '',
      fullDescription: data.full_description || '',
      price: parseFloat(data.price),
      offerPrice: calculatedOfferPrice,
      discountPercentage: discountPct,
      costPrice: parseFloat(data.cost_price) || 0,
      expense: parseFloat(data.expense) || 0,
      stock: parseInt(data.stock, 10),
      categoryId: actual_category_id,
      status: data.status || 'active',
      imageUrl: images.img1 || null,
      imageUrl2: images.img2 || null,
      imageUrl3: images.img3 || null,
      packageSize: data.package_size || null,
      potency: data.potency || null,
      composition: data.composition || null,
      dosage: data.dosage || null,
      metaTag: data.meta_tag || null,
      productTag: data.product_tag || null,
      metaTitle: data.meta_title || null,
      metaDescription: data.meta_description || null,
      returnPolicy: data.returnPolicy || 'Easy Return',
    });
    return product;
  } catch (err) {
    if (!err.statusCode) err.statusCode = 400;
    throw err;
  }
};

const updateExistingProduct = async (id, data, images) => {
  try {
    const prod = await Product.findByPk(id);
    if (!prod) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    if (data.category_id !== undefined) {
      prod.categoryId = await resolveCategoryId(data.category_id);
    }

    const newStock = data.stock !== undefined ? parseInt(data.stock, 10) : prod.stock;
    const newPrice = data.price !== undefined ? parseFloat(data.price) : prod.price;
    const actualDiscount = data.discountPercentage !== undefined ? data.discountPercentage : data.discount_percentage;
    const actualCostPrice = data.costPrice !== undefined ? data.costPrice : data.cost_price;

    prod.name = data.name !== undefined ? data.name.trim() : prod.name;
    prod.description = data.description !== undefined ? data.description : prod.description;
    prod.fullDescription = data.full_description !== undefined ? data.full_description : (data.fullDescription !== undefined ? data.fullDescription : prod.fullDescription);
    prod.price = newPrice;
    prod.discountPercentage = actualDiscount !== undefined ? parseFloat(actualDiscount) : prod.discountPercentage;
    if (prod.discountPercentage > 0) {
      prod.offerPrice = prod.price - (prod.price * prod.discountPercentage / 100);
    } else {
      prod.offerPrice = prod.price;
    }
    prod.costPrice = actualCostPrice !== undefined ? parseFloat(actualCostPrice) : prod.costPrice;
    prod.expense = data.expense !== undefined ? parseFloat(data.expense) : prod.expense;
    prod.stock = newStock;
    
    if (data.stock !== undefined) {
      if (newStock > 0 && prod.status === 'Out of Stock') prod.status = 'In Stock';
      else if (newStock === 0) prod.status = 'Out of Stock';
      else prod.status = data.status !== undefined ? data.status : prod.status;
    } else {
      prod.status = data.status !== undefined ? data.status : prod.status;
    }

    if (images.img1) prod.imageUrl = images.img1;
    if (images.img2 !== undefined) prod.imageUrl2 = images.img2;
    if (images.img3 !== undefined) prod.imageUrl3 = images.img3;

    const actualPackSize = data.packSize !== undefined ? data.packSize : data.package_size;
    prod.packageSize = actualPackSize !== undefined ? actualPackSize : prod.packageSize;
    prod.potency = data.potency !== undefined ? data.potency : prod.potency;
    prod.composition = data.composition !== undefined ? data.composition : prod.composition;
    prod.dosage = data.dosage !== undefined ? data.dosage : prod.dosage;
    
    const actualMetaTag = data.metaTag !== undefined ? data.metaTag : data.meta_tag;
    const actualProductTag = data.productTag !== undefined ? data.productTag : data.product_tag;
    prod.metaTag = actualMetaTag !== undefined ? actualMetaTag : prod.metaTag;
    prod.productTag = actualProductTag !== undefined ? actualProductTag : prod.productTag;
    prod.metaTitle = data.metaTitle !== undefined ? data.metaTitle : (data.meta_title !== undefined ? data.meta_title : prod.metaTitle);
    prod.metaDescription = data.metaDescription !== undefined ? data.metaDescription : (data.meta_description !== undefined ? data.meta_description : prod.metaDescription);
    prod.returnPolicy = data.returnPolicy !== undefined ? data.returnPolicy : prod.returnPolicy;

    await prod.save();

    const updated = await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] });
    const formatted = updated.toJSON();
    formatted.category_name = formatted.category ? formatted.category.name : null;
    return formatted;
  } catch (err) {
    if (!err.statusCode) err.statusCode = 400;
    throw err;
  }
};

const toggleProductVisibility = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  
  if (product.status === 'Inactive') {
    product.status = product.stock > 0 ? 'In Stock' : 'Out of Stock';
  } else {
    product.status = 'Inactive';
  }
  
  await product.save();
  return product;
};

const updateProductStock = async (id, stock) => {
  const stockVal = parseInt(stock, 10);
  const product = await Product.findByPk(id);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  product.stock = stockVal;
  if (stockVal > 0 && product.status === 'Out of Stock') {
    product.status = 'In Stock';
  } else if (stockVal === 0) {
    product.status = 'Out of Stock';
  }
  
  await product.save();
  return product;
};

const deleteProductById = async (id) => {
  const result = await Product.destroy({ where: { id } });
  if (result === 0) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  getCustomerProducts,
  getAdminProductsList,
  getProductDetails,
  createNewProduct,
  updateExistingProduct,
  toggleProductVisibility,
  updateProductStock,
  deleteProductById
};
