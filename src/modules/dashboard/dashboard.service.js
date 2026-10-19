/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [dashboard]: dashboard.service
 */

const { Order, OrderItem, User, Address, Product, Category, Prescription, Coupon } = require('../../models');
const { Op } = require('sequelize');

const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = yesterday;
  const yesterdayEnd = new Date(today.getTime() - 1);

  const completedOrders = await Order.count({ where: { status: 'completed' } });
  const pendingOrders = await Order.count({ 
    where: { 
      status: { [Op.in]: ['pending', 'processing', 'confirmed', 'accepted'] } 
    } 
  });
  const totalOrders = await Order.count();
  const totalSales = await Order.sum('totalAmount', { where: { status: 'completed' } });
  const customerCount = await User.count({ where: { role: 'customer' } });
  const productCount = await Product.count({ where: { status: { [Op.ne]: 'hidden' } } });
  const prescriptionCount = await Prescription.count({ where: { status: 'pending' } });
  const couponCount = await Coupon.count({ where: { isActive: true } });

  // Yesterday's Data
  const yesterdayCompletedOrders = await Order.count({ 
    where: { status: 'completed', created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });
  const yesterdayPendingOrders = await Order.count({ 
    where: { 
      status: { [Op.in]: ['pending', 'processing', 'confirmed', 'accepted'] },
      created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] }
    } 
  });
  const yesterdayTotalOrders = await Order.count({
    where: { created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } }
  });
  const yesterdaySales = await Order.sum('totalAmount', { 
    where: { status: 'completed', created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });
  const yesterdayCustomerCount = await User.count({ 
    where: { role: 'customer', created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });
  const yesterdayProductCount = await Product.count({ 
    where: { status: { [Op.ne]: 'hidden' }, created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });
  const yesterdayPrescriptionCount = await Prescription.count({ 
    where: { status: 'pending', created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });
  const yesterdayCouponCount = await Coupon.count({ 
    where: { isActive: true, created_at: { [Op.between]: [yesterdayStart, yesterdayEnd] } } 
  });

  return {
    totalSales: totalSales || 0,
    revenue: totalSales || 0, // Added alias for frontend compatibility
    totalRevenue: totalSales || 0, // Added alias for frontend compatibility
    totalOrders: totalOrders || 0,
    completedOrders: completedOrders || 0,
    pendingOrders: pendingOrders || 0,
    customerCount: customerCount || 0,
    productCount: productCount || 0,
    prescriptionCount: prescriptionCount || 0,
    couponCount: couponCount || 0,
    
    // Yesterday's data
    yesterdaySales: yesterdaySales || 0,
    yesterdayTotalOrders: yesterdayTotalOrders || 0,
    yesterdayCompletedOrders: yesterdayCompletedOrders || 0,
    yesterdayPendingOrders: yesterdayPendingOrders || 0,
    yesterdayCustomerCount: yesterdayCustomerCount || 0,
    yesterdayProductCount: yesterdayProductCount || 0,
    yesterdayPrescriptionCount: yesterdayPrescriptionCount || 0,
    yesterdayCouponCount: yesterdayCouponCount || 0
  };
};

const getRecentAdminOrders = async (queryFilters) => {
  const { page = 1, limit = 10, status, startDate, endDate } = queryFilters;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let whereClause = {};

  if (status && status !== 'All' && status !== 'null' && status !== 'undefined') {
    const qStatus = status.toLowerCase();
    const statusReverseMap = { 
      'received': 'pending', 
      'accepted': 'accepted', 
      'out for delivery': 'out_for_delivery', 
      'completed': 'completed', 
      'cancelled': 'cancelled' 
    };
    whereClause.status = statusReverseMap[qStatus] || qStatus;
  }
  
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) {
      whereClause.created_at[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereClause.created_at[Op.lte] = new Date(endDate + ' 23:59:59');
    }
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    limit: limitNum,
    offset: offset,
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['name', 'phone'] },
      { model: Address, as: 'address', attributes: ['phone', 'street', 'city', 'state', 'pincode'] },
      { 
        model: OrderItem, 
        as: 'items',
        include: [
          { 
            model: Product, 
            as: 'product',
            include: [{ model: Category, as: 'category' }]
          }
        ]
      }
    ]
  });

  const totalPages = Math.ceil(count / limitNum);

  const formattedOrders = orders.map(order => {
    const orderObj = order.toJSON();
    
    const formattedItems = orderObj.items.map(item => {
      const product = item.product || {};
      return {
        product_id: item.productId,
        name: product.name,
        shortDesc: product.description ? product.description.substring(0, 50) + '...' : '',
        fullDesc: product.fullDescription || product.description || 'No description available.',
        category: product.category ? product.category.name : 'General',
        price: item.price,
        qty: item.quantity,
        package_size: product.packageSize || '-',
        potency: product.potency || '-',
        composition: product.composition || '-',
        dosage: product.dosage || '-',
        metaTitle: product.metaTitle || (product.name + ' - AyushBasket Medicines'),
        metaDescription: product.metaDescription || '',
        image_url: product.imageUrl || null
      };
    });

    let rawStatus = (orderObj.status || 'pending').toLowerCase();
    let mappedStatus;
    if (rawStatus === 'pending') mappedStatus = 'Received';
    else if (rawStatus === 'accepted') mappedStatus = 'Accepted';
    else if (rawStatus === 'out_for_delivery') mappedStatus = 'Out for Delivery';
    else if (rawStatus === 'completed') mappedStatus = 'Completed';
    else if (rawStatus === 'cancelled') mappedStatus = 'Cancelled';
    else mappedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    return {
      ...orderObj,
      status: mappedStatus,
      mappedStatus: mappedStatus,
      customer: {
        name: orderObj.user ? orderObj.user.name : "Customer",
        phone: (orderObj.address && orderObj.address.phone) ? orderObj.address.phone : (orderObj.user && orderObj.user.phone ? orderObj.user.phone : "-"),
        address: orderObj.address && orderObj.address.street ? 
          `${orderObj.address.street}, ${orderObj.address.city}, ${orderObj.address.state} - ${orderObj.address.pincode}` : 
          "Address not provided"
      },
      payment: {
        method: orderObj.paymentMethod || "Online/COD",
        status: orderObj.paymentStatus || "Pending",
        transactionId: orderObj.transactionId || "N/A"
      },
      items: formattedItems,
      product: formattedItems.length > 0 ? formattedItems[0] : { name: "No items", shortDesc: "", fullDesc: "", category: "-", price: 0, qty: 0, package_size: "-" }
    };
  });

  return {
    orders: formattedOrders,
    pagination: { page: pageNum, limit: limitNum, total: count, totalPages }
  };
};

module.exports = {
  getStats,
  getRecentAdminOrders
};
