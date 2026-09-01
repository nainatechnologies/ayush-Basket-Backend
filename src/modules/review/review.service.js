const { Review, Order, OrderItem } = require('../../models');

const addOrUpdateReview = async (userId, data) => {
  const { productId, rating, comment } = data;

  // The purchase check has been removed by user request, 
  // anyone logged in can review the product.

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
