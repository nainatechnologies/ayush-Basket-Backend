const express = require('express');
const router = express.Router();
const {
  uploadPrescription, getMyPrescriptions,
  getAllPrescriptions, getPrescriptionById, approvePrescription, rejectPrescription, servePrescriptionImage
} = require('./prescription.controller');
const { protect, admin } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

const validate = require('../../middleware/validate.middleware');
const { uploadPrescriptionSchema, approvePrescriptionSchema } = require('./prescription.validation');

// Customer routes
router.post('/', protect, upload.single('prescription'), validate(uploadPrescriptionSchema), uploadPrescription);
router.get('/my', protect, getMyPrescriptions);

// Public image routes (so frontend <img> tags work without tokens)
router.get('/:id/image', servePrescriptionImage);
router.get('/admin/:id/image', servePrescriptionImage);

// Admin routes
router.get('/admin', protect, admin, getAllPrescriptions);
router.get('/admin/:id', protect, admin, getPrescriptionById);
router.put('/admin/:id/approve', protect, admin, validate(approvePrescriptionSchema), approvePrescription);
router.put('/admin/:id/reject', protect, admin, rejectPrescription);

module.exports = router;
