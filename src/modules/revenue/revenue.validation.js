/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [revenue]: revenue.validation
 */

const { z } = require('zod');

const getRevenueSchema = z.object({
  query: z.object({
    filter: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
});

module.exports = {
  getRevenueSchema
};
