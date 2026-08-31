const { Review, Order, OrderItem } = require('../../models');

const addOrUpdateReview = async (userId, data) => {
  const { productId, rating, comment } = data;

  const hasPurchased = await Order.findOne({
    where: { userId, status: 'completed' },
    include: [{
      model: OrderItem,
      as: 'items',
      where: { productId }
    }]
  });

  if (!hasPurchased) {
    const error = new Error('You can only review products you have purchased');
    error.statusCode = 403;
    throw error;
  }

  let review = await Review.findOne({ where: { userId, productId } });

  if (review) {
    review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();
  } else {
    review = await Review.create({
      userId,
      productId,
      rating,
      comment
    });
  }

  return review;
};

const getReviewsForProduct = async (productId) => {
  return await Review.findAll({
    where: { productId },
    include: ['user'],
    order: [['created_at', 'DESC']]
  });
};

module.exports = {
  addOrUpdateReview,
  getReviewsForProduct
};
