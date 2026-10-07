const { Product, Category, WishlistItem, sequelize } = require('../../models');
const { Op } = require('sequelize');

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return `data:${mimeType || 'image/jpeg'};base64,${url}`;
};

const getCustomerProducts = async (filters, userId = null) => {
  const { search, category, stockStatus } = filters;
  let whereClause = { status: { [Op.notIn]: ['hidden', 'Inactive', 'inactive'] } };

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

  let userWishlistIds = new Set();
  if (userId) {
    const wishlistItems = await WishlistItem.findAll({ where: { userId } });
    userWishlistIds = new Set(wishlistItems.map(item => item.productId));
  }

  return products.map(p => {
    const prod = p.toJSON();
    prod.isWishlisted = userWishlistIds.has(prod.id);
    prod.is_wishlisted = prod.isWishlisted;
    prod.in_wishlist = prod.isWishlisted;
    
    prod.category_name = prod.category ? prod.category.name : null;
    prod.category = prod.category_name;
    
    prod.imageUrl = buildImageSource(prod.imageUrl, prod.imageMimeType);
    prod.imageUrl2 = buildImageSource(prod.imageUrl2, prod.image2MimeType);
    prod.imageUrl3 = buildImageSource(prod.imageUrl3, prod.image3MimeType);
    
    prod.imageBase64 = prod.imageUrl;
    prod.imageMimeType = prod.imageMimeType;
    prod.image = prod.imageUrl;
    prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);
    
    // Add aliases for frontend compatibility
    prod.package_size = prod.packageSize;
    prod.packSize = prod.packageSize;
    prod.pack_size = prod.packageSize;
    
    prod.full_description = prod.fullDescription;
    prod.usage = prod.fullDescription;
    prod.safety_advice = prod.fullDescription;
    prod.storage_advice = prod.fullDescription;

    prod.price = Number(prod.price);
    if (prod.offerPrice) prod.offerPrice = Number(prod.offerPrice);
    if (prod.discountPercentage) prod.discountPercentage = Number(prod.discountPercentage);

    if (Number(prod.stock) <= 0) {
        prod.status = 'Out of Stock';
    } else if (prod.status === 'active' || prod.status === 'Active') {
        prod.status = 'In Stock';
    }

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
    
    prod.imageUrl = buildImageSource(prod.imageUrl, prod.imageMimeType);
    prod.imageUrl2 = buildImageSource(prod.imageUrl2, prod.image2MimeType);
    prod.imageUrl3 = buildImageSource(prod.imageUrl3, prod.image3MimeType);
    
    prod.imageBase64 = prod.imageUrl;
    prod.imageMimeType = prod.imageMimeType;
    prod.image = prod.imageUrl;
    prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);
    
    // Add aliases for frontend compatibility
    prod.package_size = prod.packageSize;
    prod.packSize = prod.packageSize;
    prod.pack_size = prod.packageSize;
    
    prod.full_description = prod.fullDescription;
    prod.usage = prod.fullDescription;
    prod.safety_advice = prod.fullDescription;
    prod.storage_advice = prod.fullDescription;

    if (Number(prod.stock) <= 0) {
        prod.status = 'Out of Stock';
    } else if (prod.status === 'active' || prod.status === 'Active') {
        prod.status = 'In Stock';
    }

    return prod;
  });
};

const getProductDetails = async (id, userId = null) => {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category' }]
  });

  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  let isWishlisted = false;
  if (userId) {
    const wishlistItem = await WishlistItem.findOne({ where: { userId, productId: id } });
    if (wishlistItem) isWishlisted = true;
  }

  const prod = product.toJSON();
  prod.isWishlisted = isWishlisted;
  prod.is_wishlisted = isWishlisted;
  prod.in_wishlist = isWishlisted;
  
  prod.category_name = prod.category ? prod.category.name : null;
  
  prod.imageUrl = buildImageSource(prod.imageUrl, prod.imageMimeType);
  prod.imageUrl2 = buildImageSource(prod.imageUrl2, prod.image2MimeType);
  prod.imageUrl3 = buildImageSource(prod.imageUrl3, prod.image3MimeType);
  
  prod.imageBase64 = prod.imageUrl;
  prod.imageMimeType = prod.imageMimeType;
  prod.image = prod.imageUrl;
  prod.images = [prod.imageUrl, prod.imageUrl2, prod.imageUrl3].filter(Boolean);

  // Add aliases for frontend compatibility
  prod.package_size = prod.packageSize;
  prod.packSize = prod.packageSize;
  prod.pack_size = prod.packageSize;
  
  prod.full_description = prod.fullDescription;
  prod.usage = prod.fullDescription;
  prod.safety_advice = prod.fullDescription;
  prod.storage_advice = prod.fullDescription;

  // If stock is 0 or less, force the status to Out of Stock
  if (Number(prod.stock) <= 0) {
      prod.status = 'Out of Stock';
  } else if (prod.status === 'active' || prod.status === 'Active') {
      prod.status = 'In Stock';
  }

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
  const transaction = await sequelize.transaction();
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
      imageUrl: images.img1 ? (images.img1.isUrl ? images.img1.url : images.img1.base64) : null,
      imageMimeType: images.img1 ? images.img1.mimeType : null,
      imageUrl2: images.img2 ? (images.img2.isUrl ? images.img2.url : images.img2.base64) : null,
      image2MimeType: images.img2 ? images.img2.mimeType : null,
      imageUrl3: images.img3 ? (images.img3.isUrl ? images.img3.url : images.img3.base64) : null,
      image3MimeType: images.img3 ? images.img3.mimeType : null,
      packageSize: data.package_size || null,
      potency: data.potency || null,
      composition: data.composition || null,
      dosage: data.dosage || null,
      metaTag: data.meta_tag || null,
      productTag: data.product_tag || null,
      metaTitle: data.meta_title || null,
      metaDescription: data.meta_description || null,
      returnPolicy: data.returnPolicy || 'Easy Return',
    }, { transaction });
    
    await transaction.commit();
    return product;
  } catch (err) {
    await transaction.rollback();
    if (!err.statusCode) err.statusCode = 400;
    throw err;
  }
};

const updateExistingProduct = async (id, data, images) => {
  const transaction = await sequelize.transaction();
  try {
    const prod = await Product.findByPk(id, { transaction });
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

    if (images.img1) {
      prod.imageUrl = images.img1.isUrl ? images.img1.url : images.img1.base64;
      prod.imageMimeType = images.img1.mimeType || null;
    }
    if (images.img2 !== null) {
      prod.imageUrl2 = images.img2 ? (images.img2.isUrl ? images.img2.url : images.img2.base64) : null;
      prod.image2MimeType = images.img2 ? images.img2.mimeType : null;
    }
    if (images.img3 !== null) {
      prod.imageUrl3 = images.img3 ? (images.img3.isUrl ? images.img3.url : images.img3.base64) : null;
      prod.image3MimeType = images.img3 ? images.img3.mimeType : null;
    }

    const actualPackSize = data.packageSize !== undefined ? data.packageSize : (data.packSize !== undefined ? data.packSize : data.package_size);
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

    await prod.save({ transaction });
    await transaction.commit();

    const updated = await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] });
    const formatted = updated.toJSON();
    formatted.category_name = formatted.category ? formatted.category.name : null;
    return formatted;
  } catch (err) {
    await transaction.rollback();
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

const searchProducts = async (searchTerm) => {
  const whereClause = {
    status: { [Op.notIn]: ['hidden', 'Inactive', 'inactive'] },
    [Op.or]: [
      { name: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
      { fullDescription: { [Op.like]: `%${searchTerm}%` } }
    ]
  };

  const products = await Product.findAll({
    where: whereClause,
    include: [{ model: Category, as: 'category' }],
    limit: 20
  });

  return products.map(p => {
    const prod = p.toJSON();
    prod.imageUrl = buildImageSource(prod.imageUrl, prod.imageMimeType);
    prod.image = prod.imageUrl;
    prod.category_name = prod.category ? prod.category.name : null;
    return prod;
  });
};

module.exports = {
  searchProducts,
  getCustomerProducts,
  getAdminProductsList,
  getProductDetails,
  createNewProduct,
  updateExistingProduct,
  toggleProductVisibility,
  updateProductStock,
  deleteProductById
};
