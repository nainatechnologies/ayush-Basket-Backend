/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [review]: review.validation
 */

const { z } = require('zod');

const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const addReviewSchema = z.object({
  body: z.object({
    productId: z.union([z.string(), z.number()]).refine(val => !!val, 'Product ID is required'),
    rating: numericString.refine(val => val >= 1 && val <= 5, 'Rating must be between 1 and 5'),
    comment: z.string().optional()
  })
});

module.exports = {
  addReviewSchema
};
