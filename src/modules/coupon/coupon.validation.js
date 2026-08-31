const { z } = require('zod');

const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase(),
    discountType: z.enum(['percentage', 'fixed'], { errorMap: () => ({ message: 'Discount type must be percentage or fixed' }) }),
    discountValue: numericString.refine(val => val > 0, 'Discount value must be greater than 0'),
    minPurchase: numericString.optional().refine(val => val === undefined || val >= 0, 'Minimum purchase cannot be negative'),
    maxDiscount: numericString.optional().nullable(),
    validFrom: z.string().optional().nullable(),
    validUntil: z.string().optional().nullable(),
    usageLimit: numericString.optional().nullable(),
    isActive: z.boolean().optional()
  })
});

const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').toUpperCase(),
    cartTotal: numericString.refine(val => val >= 0, 'Cart total must be non-negative')
  })
});

module.exports = {
  createCouponSchema,
  validateCouponSchema
};
