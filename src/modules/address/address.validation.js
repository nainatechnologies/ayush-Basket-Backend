const { z } = require('zod');

const indianPhoneRegex = /^[6-9]\d{9}$/;
const indianPincodeRegex = /^[1-9][0-9]{5}$/;

const addAddressSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name is required'),
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(indianPincodeRegex, 'Please enter a valid 6-digit Indian PIN code'),
    is_default: z.boolean().optional().default(false)
  })
});

const updateAddressSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name cannot be empty').optional(),
    phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number').optional(),
    street: z.string().min(1, 'Street address cannot be empty').optional(),
    city: z.string().min(1, 'City cannot be empty').optional(),
    state: z.string().min(1, 'State cannot be empty').optional(),
    pincode: z.string().regex(indianPincodeRegex, 'Please enter a valid 6-digit Indian PIN code').optional(),
    is_default: z.boolean().optional()
  })
});

module.exports = {
  addAddressSchema,
  updateAddressSchema
};
