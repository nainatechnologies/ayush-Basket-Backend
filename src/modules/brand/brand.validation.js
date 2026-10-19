'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Validation: Brand Validation Schemas
 * Purpose: Zod schema definitions for brand requests
 */

const { z } = require('zod');

const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Brand name is required.'),
    description: z.string().optional(),
    logoUrl: z.string().optional()
  })
});

module.exports = {
  createBrandSchema
};
