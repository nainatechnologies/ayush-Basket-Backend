
const fs = require("fs");
let code = fs.readFileSync("controllers/orderController.js", "utf8");

const cancelCode = `
// @desc    Cancel order by user
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;
    const db = require("../config/db");
    
    const [existing] = await db.query("SELECT * FROM orders WHERE id = ? AND user_id = ?", [orderId, req.user.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
    }
    
    if (existing[0].status === "out_for_delivery" || existing[0].status === "completed" || existing[0].status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
    }
    
    await db.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ?",
      [orderId]
    );
    
    res.status(200).json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Server error cancelling order" });
  }
};
`;

code = code.replace("module.exports = {", cancelCode + "\n\nmodule.exports = {\n  cancelOrder,");
fs.writeFileSync("controllers/orderController.js", code);

let code2 = fs.readFileSync("routes/orderRoutes.js", "utf8");
code2 = code2.replace("updateOrderStatus } = require", "updateOrderStatus, cancelOrder } = require");
code2 = code2.replace("module.exports = router;", "router.route('/:id/cancel').put(protect, cancelOrder);\n\nmodule.exports = router;");
fs.writeFileSync("routes/orderRoutes.js", code2);

