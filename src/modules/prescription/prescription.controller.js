const prescriptionService = require('./prescription.service');
const smsService = require('../../services/smsService');

// @desc    Customer uploads a prescription
// @route   POST /api/prescriptions
// @access  Private (Customer)
const uploadPrescription = async (req, res) => {
  try {
    let imageObj = null;
    if (req.file && req.file.buffer) {
      imageObj = {
        mimeType: req.file.mimetype,
        base64: req.file.buffer.toString('base64')
      };
    } else if (req.body.image_url) {
      const { extractBase64AndMimeType } = require('../../utils/imageUtils');
      imageObj = extractBase64AndMimeType(req.body.image_url);
    }

    const prescription = await prescriptionService.uploadNewPrescription(req.user.id, req.body || {}, imageObj);

    // Trigger SMS notification
    const userPhone = req.body.phone || req.user.phone;
    if (userPhone) {
      smsService.sendPrescriptionUploadedSMS(prescription, userPhone).catch(err => {
        console.error('Failed to send prescription SMS:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully. Our team will review it shortly.',
      data: prescription
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error uploading prescription:', error);
    res.status(500).json({ success: false, message: 'Server error uploading prescription.' });
  }
};

// @desc    Get customer's own prescriptions
// @route   GET /api/prescriptions/my
// @access  Private (Customer)
const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getPrescriptionsForUser(req.user.id);
    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching prescriptions.' });
  }
};

// @desc    Admin – Get all prescriptions
// @route   GET /api/admin/prescriptions
// @access  Private/Admin
const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getAllPrescriptionsList(req.query);
    res.status(200).json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    res.status(500).json({ success: false, message: 'Server error fetching prescriptions.' });
  }
};

// @desc    Admin – Approve prescription → convert to order
// @route   PUT /api/admin/prescriptions/:id/approve
// @access  Private/Admin
const approvePrescription = async (req, res) => {
  try {
    const { items, address_id } = req.body;
    const orderId = await prescriptionService.approveAndCreateOrder(req.params.id, req.user.id, items, address_id);

    res.status(200).json({
      success: true,
      message: 'Prescription approved and order created.',
      orderId: orderId
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error approving prescription:', error);
    res.status(500).json({ success: false, message: 'Server error approving prescription.' });
  }
};

// @desc    Admin – Reject prescription
// @route   PUT /api/admin/prescriptions/:id/reject
// @access  Private/Admin
const rejectPrescription = async (req, res) => {
  try {
    await prescriptionService.rejectExistingPrescription(req.params.id);
    res.status(200).json({ success: true, message: 'Prescription rejected.' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error rejecting prescription:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting prescription.' });
  }
};

// @desc    Admin – Get prescription by ID
// @route   GET /api/prescriptions/admin/:id
// @access  Private/Admin
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await prescriptionService.getPrescriptionDetails(req.params.id);
    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error fetching prescription:', error);
    res.status(500).json({ success: false, message: 'Server error fetching prescription.' });
  }
};

// @desc    Serve prescription image as binary
// @route   GET /api/prescriptions/:id/image
// @access  Public
const servePrescriptionImage = async (req, res) => {
  try {
    const { Prescription } = require('../../models');
    const prescription = await Prescription.findByPk(req.params.id, {
      attributes: ['id', 'userId', 'imageUrl', 'imageMimeType']
    });

    if (!prescription || !prescription.imageUrl) {
      return res.status(404).json({ success: false, message: 'Prescription image not found.' });
    }

    const mimeType = prescription.imageMimeType || 'image/jpeg';
    let base64Data = prescription.imageUrl;

    if (base64Data.startsWith('http://') || base64Data.startsWith('https://') || base64Data.startsWith('/uploads/')) {
      return res.redirect(base64Data);
    }

    // Strip the data URI prefix if it was stored with one
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      if (parts.length > 1) {
        base64Data = parts[1];
      }
    }

    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.set('Content-Type', mimeType);
    res.set('Content-Length', imgBuffer.length);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(imgBuffer);
  } catch (error) {
    console.error('Error serving prescription image:', error);
    return res.status(500).json({ success: false, message: 'Error loading image.' });
  }
};

module.exports = {
  uploadPrescription,
  getMyPrescriptions,
  getAllPrescriptions,
  getPrescriptionById,
  approvePrescription,
  rejectPrescription,
  servePrescriptionImage
};
