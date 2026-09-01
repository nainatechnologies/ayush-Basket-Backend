const fs = require('fs');

// 1. Update controller
let ctrl = fs.readFileSync('src/modules/coupon/coupon.controller.js', 'utf8');
if (!ctrl.includes('deleteCoupon')) {
  ctrl = ctrl.replace('module.exports = { createCoupon, getAdminCoupons, validateCoupon };', 
    \// @desc    Admin - Delete Coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  try {
    await couponService.deleteCouponById(req.params.id);
    return sendSuccess(res, 200, 'Coupon deleted');
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error deleting coupon');
  }
});

module.exports = { createCoupon, getAdminCoupons, validateCoupon, deleteCoupon };\);
  fs.writeFileSync('src/modules/coupon/coupon.controller.js', ctrl);
}

// 2. Update service
let srv = fs.readFileSync('src/modules/coupon/coupon.service.js', 'utf8');
if (!srv.includes('deleteCouponById')) {
  srv = srv.replace('module.exports = {', 
    \const deleteCouponById = async (id) => {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    const err = new Error('Coupon not found'); err.statusCode = 404; throw err;
  }
  await coupon.destroy();
};

module.exports = {
  deleteCouponById,\);
  fs.writeFileSync('src/modules/coupon/coupon.service.js', srv);
}

// 3. Update routes
let rts = fs.readFileSync('src/modules/coupon/coupon.routes.js', 'utf8');
if (!rts.includes('deleteCoupon')) {
  rts = rts.replace('const { createCoupon, getAdminCoupons, validateCoupon } = require', 'const { createCoupon, getAdminCoupons, validateCoupon, deleteCoupon } = require');
  rts = rts.replace('module.exports = router;', 'router.delete(\'/:id\', protect, admin, deleteCoupon);\n\nmodule.exports = router;');
  fs.writeFileSync('src/modules/coupon/coupon.routes.js', rts);
}
console.log('Backend updated for coupon deletion');
