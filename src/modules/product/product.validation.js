const { z } = require('zod');

// Some values might come in as strings due to form-data (FormData)
const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required.'),
    price: numericString.refine(val => val > 0, 'A valid price greater than 0 is required.'),
    category_id: z.union([z.string(), z.number()]).refine(val => !!val, 'Category is required.'),
    stock: numericString.refine(val => val >= 0, 'Stock must be a non-negative number.'),
    discount_percentage: numericString.optional().refine(val => val === undefined || (val >= 0 && val <= 100), 'Discount percentage must be between 0 and 100.'),
    cost_price: numericString.optional(),
    expense: numericString.optional(),
    description: z.string().optional(),
    full_description: z.string().optional(),
    status: z.string().optional(),
    package_size: z.string().optional(),
    potency: z.string().optional(),
    composition: z.string().optional(),
    dosage: z.string().optional(),
    meta_tag: z.string().optional(),
    product_tag: z.string().optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
  }).passthrough() // Allow other fields like image data, file data
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    price: numericString.refine(val => val > 0, 'Price must be a positive number.').optional(),
    category_id: z.union([z.string(), z.number()]).optional(),
    stock: numericString.refine(val => val >= 0, 'Stock must be a non-negative number.').optional(),
    discount_percentage: numericString.optional().nullable(),
    discountPercentage: numericString.optional().nullable(),
    cost_price: numericString.optional().nullable(),
    costPrice: numericString.optional().nullable(),
    expense: numericString.optional().nullable(),
    packageSize: z.string().optional().nullable(),
    package_size: z.string().optional().nullable(),
    packSize: z.string().optional().nullable(),
    pack_size: z.string().optional().nullable()
  }).passthrough()
});

const updateStockSchema = z.object({
  body: z.object({
    stock: numericString.refine(val => val >= 0, 'Valid non-negative stock value is required.')
  })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema
};
