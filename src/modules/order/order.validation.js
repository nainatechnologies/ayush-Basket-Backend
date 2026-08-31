const { z } = require('zod');

const addOrderSchema = z.object({
  body: z.object({
    orderItems: z.array(z.object({
      product_id: z.union([z.number(), z.string()]).refine(val => !!val, { message: 'Product ID is required' }),
      quantity: z.number().int().positive('Quantity must be a positive integer')
    })).min(1, 'No order items provided'),
    address_id: z.union([z.number(), z.string()]).refine(val => !!val, { message: 'Delivery address is required' }),
    paymentMethod: z.string().optional()
  })
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.string().min(1, 'Status is required'),
    notes: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  })
});

const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  })
});

module.exports = {
  addOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema
};
