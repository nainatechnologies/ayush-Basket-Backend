require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const orderService = require('../../src/modules/order/order.service');
const revenueService = require('../../src/modules/revenue/revenue.service');

(async () => {
  try {
    // Complete an order (assume ID 3 exists and is pending)
    await orderService.updateOrderStatus(3, 'completed', 'Test trigger', 1);
    console.log('Order 3 marked as completed. Trigger should have fired.');

    // Fetch Analytics data
    const data = await revenueService.getRevenueData({});
    console.log('--- GET /revenue/analytics ---');
    console.log(JSON.stringify({ success: true, data }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
