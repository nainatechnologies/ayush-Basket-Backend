const dashboardService = require('./dashboard.service');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};

// @desc    Get recent paginated/filtered orders
// @route   GET /api/dashboard/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res) => {
  try {
    const data = await dashboardService.getRecentAdminOrders(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ success: false, message: 'Server error fetching recent orders.' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders
};
