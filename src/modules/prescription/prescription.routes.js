const express = require('express');
const router = express.Router();
const {
  uploadPrescription, getMyPrescriptions,
  getAllPrescriptions, getPrescriptionById, approvePrescription, rejectPrescription
} = require('./prescription.controller');
const { protect, admin } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

const validate = require('../../middleware/validate.middleware');
const { uploadPrescriptionSchema, approvePrescriptionSchema } = require('./prescription.validation');

// Customer routes
router.post('/', protect, upload.single('prescription'), validate(uploadPrescriptionSchema), uploadPrescription);
router.get('/my', protect, getMyPrescriptions);

// Admin routes
router.get('/admin', protect, admin, getAllPrescriptions);
router.get('/admin/:id', protect, admin, getPrescriptionById);
router.put('/admin/:id/approve', protect, admin, validate(approvePrescriptionSchema), approvePrescription);
router.put('/admin/:id/reject', protect, admin, rejectPrescription);

module.exports = router;
