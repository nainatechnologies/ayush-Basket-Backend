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
