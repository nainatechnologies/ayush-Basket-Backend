const prescriptionService = require('./prescription.service');
const smsService = require('../../services/smsService');

// @desc    Customer uploads a prescription
// @route   POST /api/prescriptions
// @access  Private (Customer)
const uploadPrescription = async (req, res) => {
  try {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const prescription = await prescriptionService.uploadNewPrescription(req.user.id, req.body || {}, fileUrl);
    
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

module.exports = { 
  uploadPrescription, 
  getMyPrescriptions, 
  getAllPrescriptions,
  getPrescriptionById, 
  approvePrescription, 
  rejectPrescription 
};
