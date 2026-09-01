const { Coupon } = require('../../models');

const createNewCoupon = async (data) => {
  const existing = await Coupon.findOne({ where: { code: data.code.toUpperCase() } });
  if (existing) {
    const error = new Error('Coupon code already exists');
    error.statusCode = 400;
    throw error;
  }

  return await Coupon.create({
    code: data.code.toUpperCase(),
    discountType: data.discountType,
    discountValue: data.discountValue,
    minPurchase: data.minPurchase || 0,
    maxDiscount: data.maxDiscount || null,
    validFrom: data.validFrom || new Date(),
    validUntil: data.validUntil || null,
    usageLimit: data.usageLimit || null,
    usedCount: 0,
    isActive: data.isActive !== undefined ? data.isActive : true
  });
};

const getAllCoupons = async () => {
  return await Coupon.findAll({ order: [['created_at', 'DESC']] });
};

const validateCouponForCart = async (code, cartTotal) => {
  const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });

  if (!coupon) {
    const error = new Error('Invalid coupon code');
    error.statusCode = 404;
    throw error;
  }

  if (!coupon.isActive) {
    const error = new Error('Coupon is currently inactive');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    const error = new Error('Coupon is not yet valid');
    error.statusCode = 400;
    throw error;
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    const error = new Error('Coupon has expired');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error('Coupon usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  if (cartTotal < coupon.minPurchase) {
    const error = new Error(`Minimum purchase of ₹${coupon.minPurchase} required`);
    error.statusCode = 400;
    throw error;
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > cartTotal) {
    discountAmount = cartTotal;
  }

  return {
    code: coupon.code,
    discountAmount,
    discountType: coupon.discountType
  };
};


const updateCouponById = async (id, data) => {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    const err = new Error('Coupon not found'); err.statusCode = 404; throw err;
  }
  return await coupon.update(data);
};

const deleteCouponById = async (id) => {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    const err = new Error('Coupon not found'); err.statusCode = 404; throw err;
  }
  await coupon.destroy();
};

const getActiveCoupons = async () => {
  return await Coupon.findAll({ where: { is_active: true } });
};

module.exports = {
  updateCouponById,
  deleteCouponById,
  getActiveCoupons,
  createNewCoupon,
  getAllCoupons,
  validateCouponForCart
};
