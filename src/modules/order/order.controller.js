const orderService = require('./order.service');

// @desc    Add new order (customer places order)
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      ...result
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error placing order' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getCustomerOrders(req.user.id);
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderDetails(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, notes, req.user.id);
    res.status(200).json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
};

// @desc    Cancel order by user
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    await orderService.cancelCustomerOrder(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling order' });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const finalOrders = await orderService.getAllAdminOrders(req.query.status);
    res.status(200).json({ success: true, count: finalOrders.length, data: finalOrders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

const { generateInvoice } = require('../../utils/invoiceGenerator');

// @desc    Download Tax Invoice for order
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const order = await orderService.getOrderDetails(req.params.id, req.user.id, req.user.role);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=AyushBasket-Invoice-${order.id}.pdf`);
    
    // Generate and pipe the PDF
    generateInvoice(order, res);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating invoice' });
    }
  }
};

// @desc    Upload Payment Proof
// @route   POST /api/orders/upload-payment
// @access  Private
const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      url: fileUrl
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ success: false, message: 'Server error uploading payment proof' });
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  downloadInvoice,
  uploadPaymentProof
};
