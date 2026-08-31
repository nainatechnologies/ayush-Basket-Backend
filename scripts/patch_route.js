const fs = require('fs');
let code = fs.readFileSync('routes/orderRoutes.js', 'utf8');

code = code.replace(
  'const { addOrderItems, getMyOrders, getOrders, getOrderById, updateOrderStatus } = require(\'../controllers/orderController\');',
  'const { addOrderItems, getMyOrders, getOrders, getOrderById, updateOrderStatus, cancelOrder } = require(\'../controllers/orderController\');'
);

code = code.replace(
  'module.exports = router;',
  'router.route(\'/:id/cancel\').put(protect, cancelOrder);\n\nmodule.exports = router;'
);

fs.writeFileSync('routes/orderRoutes.js', code);
