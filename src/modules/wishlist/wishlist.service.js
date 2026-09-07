const { WishlistItem, Product } = require('../../models');

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

const getWishlistForUser = async (userId) => {
  const items = await WishlistItem.findAll({
    where: { userId },
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'name', 'price', 'offerPrice', 'imageUrl', 'imageMimeType', 'stock', 'status']
    }]
  });
  
  return items.filter(i => i.product && i.product.status !== 'hidden').map(i => {
    const finalImageUrl = buildImageSource(i.product.imageUrl, i.product.imageMimeType);
    return {
      id: i.id,
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      offerPrice: i.product.offerPrice,
      image_url: finalImageUrl,
      image: finalImageUrl,
      imageUrl: finalImageUrl,
      stock: i.product.stock
    };
  });
};

const addItemToWishlist = async (userId, productId) => {
  const existing = await WishlistItem.findOne({ where: { userId, productId } });
  if (existing) {
    const error = new Error('Product already in wishlist');
    error.statusCode = 400;
    throw error;
  }
  const newItem = await WishlistItem.create({ userId, productId });
  return newItem;
};

const removeItemFromWishlist = async (userId, id) => {
  const result = await WishlistItem.destroy({ where: { id, userId } });
  if (result === 0) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  getWishlistForUser,
  addItemToWishlist,
  removeItemFromWishlist
};
