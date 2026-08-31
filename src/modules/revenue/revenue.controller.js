const revenueService = require('./revenue.service');

// @desc    Get revenue stats with date filters
// @route   GET /api/admin/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
  try {
    const data = await revenueService.getRevenueData(req.query);
    
    res.status(200).json({
      success: true,
      purchaseMoney: data.totalCost,
      sellingMoney: data.totalRevenue,
      profitMoney: data.totalProfit,
      daily: data.daily
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ success: false, message: 'Server error fetching revenue.' });
  }
};

module.exports = { getRevenue };
