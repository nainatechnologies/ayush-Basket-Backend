/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [category]: category.validation
 */

const { z } = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required.'),
    description: z.string().optional(),
    image: z.string().optional()
  })
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.string().optional()
  })
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};
