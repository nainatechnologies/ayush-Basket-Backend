const { z } = require('zod');

const indianPhoneRegex = /^[6-9]\d{9}$/;

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number').optional().nullable()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};
