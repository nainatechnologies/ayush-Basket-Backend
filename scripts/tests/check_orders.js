require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Order } = require('../../src/models');

(async () => {
  try {
    const orders = await Order.findAll({ attributes: ['id', 'status', 'totalAmount'] });
    console.log(JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
})();
