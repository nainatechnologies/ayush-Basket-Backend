const { z } = require('zod');

const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const addToCartSchema = z.object({
  body: z.object({
    product_id: z.union([z.string(), z.number()]).refine(val => !!val, 'Please provide product_id'),
    quantity: numericString.refine(val => val >= 1, 'Quantity must be a positive number')
  })
});

const updateCartItemSchema = z.object({
  body: z.object({
    quantity: numericString.refine(val => val >= 1, 'Valid quantity is required')
  })
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema
};
