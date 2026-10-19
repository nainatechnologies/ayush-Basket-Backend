/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [dashboard]: dashboard.validation
 */

const { z } = require('zod');

const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const getRecentOrdersSchema = z.object({
  query: z.object({
    page: numericString.optional().default(1),
    limit: numericString.optional().default(10),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
});

module.exports = {
  getRecentOrdersSchema
};
