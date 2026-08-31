const { Order, OrderItem, Product, Category, User, Address, Prescription, sequelize, OrderStatusHistory } = require('../../models');

const createOrder = async (userId, data) => {
  const { orderItems, address_id, paymentMethod } = data;

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
        purchasePrice: product.costPrice || 0
      });

      product.stock -= item.quantity;
      await product.save({ transaction: t });
    }

    const order = await Order.create({
      userId,
      addressId: address_id,
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    for (const item of verifiedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: item.purchasePrice
      }, { transaction: t });
    }

    await t.commit();

    console.log(`\n=========================================\nOrdered placed by Customer: User ID ${userId}, Order ID: ${order.id}\n=========================================\n`);
    
    return {
      orderId: order.id,
      totalAmount
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const getCustomerOrders = async (userId) => {
  return await Order.findAll({
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

  return order;
};

const updateOrderStatus = async (orderId, status, notes, adminId) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.status = status;
  
  if (status.toLowerCase() === 'completed') {
    order.paymentStatus = 'paid';
  }

  await order.save();

  await OrderStatusHistory.create({
    orderId: order.id,
    status: status,
    notes: notes || null,
    changedBy: adminId
  });

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

const getAllAdminOrders = async (statusFilter) => {
  console.log(`\n=========================================\nOrder received by Admin\n=========================================\n`);
  
  const orders = await Order.findAll({
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['name', 'phone'] },
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

  const formattedOrders = orders.map(order => {
    const orderObj = order.toJSON();
    
    const formattedItems = (orderObj.items || []).map(item => {
      const product = item.product || {};
      return {
        product_id: item.productId,
        name: product.name,
        shortDesc: product.description ? product.description.substring(0, 50) + '...' : '',
        fullDesc: product.fullDescription || product.description || '',
        category: product.category ? product.category.name : '',
        price: item.price,
        qty: item.quantity,
        packageSize: product.packageSize || '-',
        potency: product.potency || '-',
        imageUrl: product.image_url,
        image: product.image_url ? 'http://localhost:5000' + product.image_url : null
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
      type: 'Medicine',
      date: orderObj.created_at ? new Date(orderObj.created_at).toLocaleDateString('en-IN') : 'N/A',
      created_at_iso: orderObj.created_at || null,
      customer: {
        name: orderObj.user ? orderObj.user.name : "",
        phone: (orderObj.address && orderObj.address.phone) ? orderObj.address.phone : (orderObj.user && orderObj.user.phone ? orderObj.user.phone : ""),
        address: orderObj.address && orderObj.address.street ? 
          `${orderObj.address.street}, ${orderObj.address.city}, ${orderObj.address.state} - ${orderObj.address.pincode}` : 
          ""
      },
      payment: {
        method: orderObj.paymentMethod || "",
        status: orderObj.paymentStatus || "",
        transactionId: orderObj.transactionId || ""
      },
      items: formattedItems,
      product: formattedItems.length > 0 ? formattedItems[0] : { name: "", shortDesc: "", category: "", price: 0, qty: 0 }
    };
  });

  const prescriptions = await Prescription.findAll({
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['name', 'phone'] }
    ]
  });

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
      customer: {
        name: prescObj.user ? prescObj.user.name : "",
        phone: prescObj.user ? prescObj.user.phone : "",
        address: ""
      },
      payment: {
        method: "",
        status: "",
        transactionId: ""
      },
      items: [],
      product: { 
        name: "Prescription", 
        shortDesc: prescObj.notes || "", 
        category: "Prescription", 
        price: 0, 
        qty: 0 
      }
    };
  });

  let allRecords = [...formattedOrders, ...formattedPrescriptions];

  allRecords.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB - dateA;
  });

  let finalOrders = allRecords;
  if (statusFilter && statusFilter !== 'All' && statusFilter !== 'null' && statusFilter !== 'undefined') {
    const qStatus = statusFilter.toLowerCase();
    const statusMap = { pending: 'received', accepted: 'accepted', out_for_delivery: 'out for delivery', completed: 'completed', cancelled: 'cancelled' };
    const mappedQuery = statusMap[qStatus] || qStatus;
    finalOrders = allRecords.filter(o => (o.status || '').toLowerCase() === mappedQuery);
  }

  return finalOrders;
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelCustomerOrder,
  getAllAdminOrders
};
