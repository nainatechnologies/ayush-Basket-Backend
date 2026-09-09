const { z } = require('zod');

const numericString = z.union([
  z.number(),
  z.string().transform(val => Number(val)).refine(val => !isNaN(val))
]);

const uploadPrescriptionSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    medicines: z.string().optional(),
    patient_name: z.string().optional(),
    patientName: z.string().optional(),
    doctor_name: z.string().optional(),
    doctorName: z.string().optional(),
    address: z.string().optional(),
    image_url: z.string().optional(),
    image_url_2: z.string().optional(),
    image_url_3: z.string().optional(),
    image_url_4: z.string().optional(),
    images: z.array(z.string()).optional()
  }).passthrough() // Allow file data
});

const approvePrescriptionSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        product_id: z.union([z.string(), z.number()]).refine(val => !!val, 'product_id is required'),
        quantity: numericString.refine(val => val >= 1, 'Quantity must be at least 1')
      })
    ).min(1, 'Please provide products for the prescription order.'),
    address_id: z.union([z.string(), z.number()]).optional()
  })
});

module.exports = {
  uploadPrescriptionSchema,
  approvePrescriptionSchema
};
