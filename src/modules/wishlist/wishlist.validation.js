const { z } = require('zod');

const addToWishlistSchema = z.object({
  body: z.object({
    product_id: z.union([z.string(), z.number()]).refine(val => !!val, 'Product ID required')
  })
});

module.exports = {
  addToWishlistSchema
};
