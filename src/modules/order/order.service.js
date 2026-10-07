const revenueService = require('../revenue/revenue.service');
const { Order, OrderItem, Product, Category, User, Address, Prescription, sequelize, OrderStatusHistory, PaymentAttempt } = require('../../models');
const couponService = require('../coupon/coupon.service');
const smsService = require('../../services/smsService');

const createOrder = async (userId, data) => {
  const { orderItems, address_id, paymentMethod, couponCode, paymentProof, transactionId } = data;

  const address = await Address.findOne({ where: { id: address_id, userId } });
  if (!address) {
    const error = new Error('Address not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const t = await sequelize.transaction();

  try {
    let totalAmount = 0;
    const verifiedItems = [];

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });

      if (!product) {
        throw new Error(`Product ID ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Product ${product.name} is out of stock (Requested: ${item.quantity}, Available: ${product.stock})`);
      }

      const itemPrice = product.offerPrice ? parseFloat(product.offerPrice) : parseFloat(product.price);
      totalAmount += itemPrice * item.quantity;

      verifiedItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
        purchasePrice: product.costPrice || 0,
        productName: product.name,
        productImage: product.imageUrl || product.image_url || product.image || null
      });

      product.stock -= item.quantity;
      await product.save({ transaction: t });
    }

    let finalAmount = totalAmount;
    let appliedCouponId = null;

    if (couponCode) {
      try {
        const couponValidation = await couponService.validateCouponForCart(couponCode, totalAmount);
        finalAmount -= couponValidation.discountAmount;
        appliedCouponId = couponValidation.coupon.id;
      } catch (err) {
        throw new Error('Invalid coupon: ' + err.message);
      }
    }

    const order = await Order.create({
      userId,
      addressId: address_id,
      couponId: appliedCouponId,
      totalAmount: finalAmount,
      paymentMethod: paymentMethod || 'cod',
      paymentProof: paymentProof || null,
      transactionId: transactionId || null,
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    for (const item of verifiedItems) {
      await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          purchasePrice: item.purchasePrice,
          productName: item.productName,
          productImage: item.productImage
        }, { transaction: t });
    }

    let rzpOrderResult = null;
    const isOnline = paymentMethod && ['card', 'upi', 'online', 'razorpay'].includes(paymentMethod.toLowerCase());
    
    if (isOnline) {
      const { getRazorpayInstance } = require('../payment/payment.service');
      const amountInPaise = Math.round(finalAmount * 100);
      const razorpay = getRazorpayInstance();
      
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${order.id}`,
        notes: {
          userId: userId,
          internalOrderId: order.id
        }
      });

      await PaymentAttempt.create({
        internalOrderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        status: 'pending',
        provider: 'razorpay'
      }, { transaction: t });

      rzpOrderResult = {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'mock_key_id',
        mockMode: false
      };
    }

    await t.commit();

    console.log(`\n=========================================\nOrdered placed by Customer: User ID ${userId}, Order ID: ${order.id}\n=========================================\n`);

    // Send SMS for Order Placed
    if (address && address.phone) {
      smsService.sendOrderPlacedSMS(order, address.phone);
    }

    if (rzpOrderResult) {
      return {
        orderId: order.id,
        ...rzpOrderResult
      };
    }

    return {
      orderId: order.id,
      totalAmount
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const formatOrderImages = (order) => {
  const orderObj = order.toJSON();
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  if (orderObj.items) {
    orderObj.items = orderObj.items.map(item => {
      // Use item.productImage as fallback
      let rawImg = null;
      let mimeType = 'image/jpeg';
      
      const p = item.product;
      if (p) {
        rawImg = p.imageUrl || p.image_url || p.image || null;
        mimeType = p.imageMimeType || 'image/jpeg';
      } else {
        rawImg = item.productImage || null;
      }

      if (rawImg) {
        let finalImg = rawImg;
        if (finalImg.startsWith('http')) {
          // Already absolute URL, do nothing
        } else if (finalImg.startsWith('/uploads/')) {
          // Local path
          finalImg = baseUrl + finalImg;
        } else if (!finalImg.startsWith('data:')) {
          // Raw base64 string
          finalImg = `data:${mimeType};base64,${finalImg}`;
        }

        if (p) {
          p.imageUrl = finalImg;
          p.image_url = finalImg;
          p.image = finalImg;
        }

        item.productImage = finalImg;
        item.imageUrl = finalImg;
        item.image_url = finalImg;
        item.image = finalImg;
      }
      return item;
    });
  }
  return orderObj;
};

const getCustomerOrders = async (userId) => {
  const orders = await Order.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      },
      { model: Address, as: 'address' }
    ]
  });
  return orders.map(formatOrderImages);
};

const getOrderDetails = async (orderId, userId, role) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
      { model: Address, as: 'address' },
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

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'admin' && order.userId !== userId) {
    const error = new Error('Not authorized to view this order');
    error.statusCode = 403;
    throw error;
  }

  return formatOrderImages(order);
};

const updateOrderStatus = async (orderId, status, notes, adminId) => {
  const order = await Order.findByPk(orderId, {
    include: [{ model: Address, as: 'address' }]
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const prevStatus = (order.status || '').toLowerCase();
  order.status = status;

  if (status.toLowerCase() === 'completed') {
    order.paymentStatus = 'paid';
    await revenueService.logOrderRevenue(orderId).catch(err => console.error('Error logging revenue:', err));
  }

  await order.save();

  await OrderStatusHistory.create({
    orderId: order.id,
    status: status,
    notes: notes || null,
    changedBy: adminId
  });

  // Send SMS on specific status updates
  if (order.address && order.address.phone) {
    const s = status.toLowerCase();

    if (s === 'accepted' || s === 'confirmed') {
      smsService.sendOrderAcceptedSMS(order, order.address.phone);
    } else if (s === 'completed') {
      smsService.sendOrderCompletedSMS(order, order.address.phone);
    }
  }

  return order;
};

const cancelCustomerOrder = async (orderId, userId) => {
  const order = await Order.findOne({ where: { id: orderId, userId } });

  if (!order) {
    const error = new Error('Order not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const s = order.status.toLowerCase();
  if (s === "out_for_delivery" || s === "completed" || s === "cancelled") {
    const error = new Error('Order cannot be cancelled at this stage');
    error.statusCode = 400;
    throw error;
  }

  order.status = 'cancelled';
  await order.save();
};

const getAllAdminOrders = async (statusFilter, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  // Build status filter for raw orders
  let orderWhere = {};
  let prescriptionWhere = {};
  let statusMappedForFilter = null;

  if (statusFilter && statusFilter !== 'All' && statusFilter !== 'null' && statusFilter !== 'undefined') {
    const qStatus = statusFilter.toLowerCase();
    // Map frontend status names to DB values
    const statusMap = {
      received: 'pending',
      accepted: 'accepted',
      'out for delivery': 'out_for_delivery',
      completed: 'completed',
      cancelled: 'cancelled'
    };
    const dbStatus = statusMap[qStatus] || qStatus;
    statusMappedForFilter = dbStatus;
    if (dbStatus === 'completed' || dbStatus === 'cancelled' || dbStatus === 'pending' || dbStatus === 'accepted' || dbStatus === 'out_for_delivery') {
      orderWhere.status = dbStatus;
    }
    // Prescription status mapping
    const prescriptionStatusMap = { received: 'pending', completed: 'approved', cancelled: 'rejected' };
    if (prescriptionStatusMap[qStatus]) {
      prescriptionWhere.status = prescriptionStatusMap[qStatus];
    } else if (!orderWhere.status) {
      // If filter doesn't map to a prescription status either, skip prescriptions
      prescriptionWhere.status = null;
    }
  }

  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  const orders = await Order.findAll({
    where: orderWhere,
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['name', 'phone'] },
      { model: Address, as: 'address', attributes: ['street', 'city', 'state', 'pincode', 'phone', 'fullName', 'addressType', 'flatHouse'] },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'description', 'image_url', 'imageUrl', 'packageSize', 'potency'],
            include: [{ model: Category, as: 'category', attributes: ['name'] }]
          }
        ]
      }
    ]
  });

  const formattedOrders = orders.map(order => {
    const orderObj = order.toJSON();

    const formattedItems = (orderObj.items || []).map(item => {
      const product = item.product || {};
      let img = product.image_url || product.imageUrl || item.productImage || null;
      
      if (img) {
        if (img.startsWith('http')) {
          // Absolute URL
        } else if (img.startsWith('/uploads/')) {
          // Local path
          img = baseUrl + img;
        } else if (!img.startsWith('data:')) {
          // Raw base64 string
          const mime = product.imageMimeType || 'image/jpeg';
          img = `data:${mime};base64,${img}`;
        }
      }

      return {
        product_id: item.productId,
        name: product.name || item.productName || 'Unknown Product',
        shortDesc: product.description ? product.description.substring(0, 50) + '...' : '',
        category: product.category ? product.category.name : '',
        price: item.price,
        qty: item.quantity,
        packageSize: product.packageSize || '-',
        potency: product.potency || '-',
        imageUrl: img,
        image: img
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
      mappedStatus,
      rawStatus,
      type: 'Medicine',
      date: orderObj.created_at ? new Date(orderObj.created_at).toLocaleDateString('en-IN') : 'N/A',
      created_at_iso: orderObj.created_at || null,
      customer: {
        name: orderObj.user ? orderObj.user.name : '',
        phone: (orderObj.address && orderObj.address.phone) ? orderObj.address.phone : (orderObj.user && orderObj.user.phone ? orderObj.user.phone : ''),
        address: orderObj.address && orderObj.address.street ?
          `${orderObj.address.flatHouse ? orderObj.address.flatHouse + ', ' : ''}${orderObj.address.street}, ${orderObj.address.city}, ${orderObj.address.state} - ${orderObj.address.pincode}` : ''
      },
      payment: {
        method: orderObj.paymentMethod || '',
        status: orderObj.paymentStatus || '',
        transactionId: orderObj.transactionId || ''
      },
      items: formattedItems,
      product: formattedItems.length > 0 ? {
        ...formattedItems[0],
        name: formattedItems.length > 1 ? `${formattedItems[0].name} (+${formattedItems.length - 1} more items)` : formattedItems[0].name,
        qty: formattedItems.reduce((acc, curr) => acc + curr.qty, 0)
      } : { name: '', shortDesc: '', category: '', price: 0, qty: 0 }
    };
  });

  // Prescriptions
  const prescriptions = prescriptionWhere.status !== null ? await Prescription.findAll({
    where: prescriptionWhere.status ? { status: prescriptionWhere.status } : {},
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['name', 'phone'] }]
  }) : [];

  const formattedPrescriptions = prescriptions.map(presc => {
    const prescObj = presc.toJSON();
    let rawPrescStatus = (prescObj.status || 'pending').toLowerCase();
    let mappedStatus;
    if (rawPrescStatus === 'pending') mappedStatus = 'Received';
    else if (rawPrescStatus === 'approved') mappedStatus = 'Completed';
    else if (rawPrescStatus === 'rejected') mappedStatus = 'Cancelled';
    else mappedStatus = rawPrescStatus.charAt(0).toUpperCase() + rawPrescStatus.slice(1);

    return {
      ...prescObj,
      status: mappedStatus,
      type: 'Prescription',
      mappedStatus,
      date: prescObj.created_at ? new Date(prescObj.created_at).toLocaleDateString('en-IN') : 'N/A',
      created_at_iso: prescObj.created_at || null,
      customer: { name: prescObj.user ? prescObj.user.name : '', phone: prescObj.user ? prescObj.user.phone : '', address: '' },
      payment: { method: '', status: '', transactionId: '' },
      items: [],
      product: { name: 'Prescription', shortDesc: prescObj.notes || '', category: 'Prescription', price: 0, qty: 0 }
    };
  });

  let allRecords = [...formattedOrders, ...formattedPrescriptions];
  allRecords.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const total = allRecords.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = allRecords.slice(offset, offset + limit);

  return { data: paginatedData, total, page, totalPages };
};


const deleteOrderById = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Delete all related records to prevent foreign key constraint errors
  await OrderItem.destroy({ where: { orderId } });
  await OrderStatusHistory.destroy({ where: { orderId } });
  
  // Need to require OrderNotification and Prescription locally if not at top
  const { OrderNotification } = require('../../models');
  await OrderNotification.destroy({ where: { orderId } });
  
  await Prescription.update({ orderId: null, status: 'pending' }, { where: { orderId } });

  await order.destroy();
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelCustomerOrder,
  getAllAdminOrders,
  deleteOrderById
};
