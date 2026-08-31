const { z } = require('zod');

const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(1, 'Subject is required.'),
    message: z.string().min(1, 'Message is required.')
  })
});

const resolveTicketSchema = z.object({
  body: z.object({
    admin_reply: z.string().optional()
  })
});

module.exports = {
  createTicketSchema,
  resolveTicketSchema
};
