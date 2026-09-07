const { Prescription, User, Product, Order, OrderItem, sequelize } = require('../../models');
const { Op } = require('sequelize');

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const buildImageSource = (url, mimeType) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads/')) return formatImageUrl(url);
  return `data:${mimeType || 'image/jpeg'};base64,${url}`;
};

const uploadNewPrescription = async (userId, data, imageObj) => {
  if (!imageObj || !imageObj.base64) {
    const error = new Error('Prescription image is required or invalid format.');
    error.statusCode = 400;
    throw error;
  }

  return await Prescription.create({
    userId: userId,
    imageUrl: imageObj.base64,
    imageMimeType: imageObj.mimeType || 'image/jpeg',
    notes: data.notes || '',
    medicines: data.medicines || '',
    patient_name: data.patient_name || data.patientName || '',
    doctor_name: data.doctor_name || data.doctorName || '',
    address: data.address || '',
    status: 'pending'
  });
};

const getPrescriptionsForUser = async (userId) => {
  const prescriptions = await Prescription.findAll({
    where: { userId },
    order: [['created_at', 'DESC']]
  });

  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';

  return prescriptions.map(p => {
    const pres = p.toJSON();
    pres.image_url = pres.imageUrl ? `${baseUrl}/api/prescriptions/${pres.id}/image` : null;
    pres.imageUrl = pres.image_url;
    delete pres.imageBase64;
    return pres;
  });
};

const getAllPrescriptionsList = async (filters) => {
  let whereClause = {};
  if (filters.status && filters.status !== 'All') {
    whereClause.status = filters.status.toLowerCase();
  }

  const prescriptions = await Prescription.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
    ],
    order: [['created_at', 'DESC']]
  });

  return prescriptions.map(p => {
    const pres = p.toJSON();
    if (pres.user) {
      if (pres.user.phone) {
        pres.patient_phone = pres.user.phone;
        pres.user_phone = pres.user.phone;
      }
      if (pres.user.name && !pres.patient_name) {
        pres.patient_name = pres.user.name;
        pres.user_name = pres.user.name;
      }
    }

    pres.imageBase64 = pres.imageUrl;
    pres.imageMimeType = pres.imageMimeType || 'image/jpeg';
    pres.image_url = buildImageSource(pres.imageUrl, pres.imageMimeType);
    pres.imageUrl = pres.image_url;

    return pres;
  });
};

const getPrescriptionDetails = async (id) => {
  const prescription = await Prescription.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
    ]
  });

  if (!prescription) {
    const error = new Error('Prescription not found.');
    error.statusCode = 404;
    throw error;
  }

  const pres = prescription.toJSON();
  if (pres.user) {
    if (pres.user.phone) {
      pres.patient_phone = pres.user.phone;
      pres.user_phone = pres.user.phone;
    }
    if (pres.user.name && !pres.patient_name) {
      pres.patient_name = pres.user.name;
      pres.user_name = pres.user.name;
    }
  }

  pres.imageBase64 = pres.imageUrl;
  pres.imageMimeType = pres.imageMimeType || 'image/jpeg';
  pres.image_url = buildImageSource(pres.imageUrl, pres.imageMimeType);
  pres.imageUrl = pres.image_url;

  return pres;
};

const approveAndCreateOrder = async (prescriptionId, adminId, items, addressId) => {
  const t = await sequelize.transaction();

  try {
    const prescription = await Prescription.findByPk(prescriptionId, { transaction: t });

    if (!prescription) {
      throw new Error('Prescription not found.');
    }

    if (prescription.status !== 'pending') {
      throw new Error('Prescription has already been processed.');
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: {
          id: item.product_id,
          status: { [Op.notIn]: ['hidden', 'Inactive'] }
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!product) {
        throw new Error(`Product ID ${item.product_id} is invalid or not available.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const price = product.offerPrice ? parseFloat(product.offerPrice) : parseFloat(product.price);
      totalAmount += price * item.quantity;

      validatedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price,
        purchasePrice: product.costPrice || 0
      });

      product.stock -= item.quantity;
      await product.save({ transaction: t });
    }

    const order = await Order.create({
      userId: prescription.userId,
      addressId: addressId || null,
      totalAmount: totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    for (const item of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: item.purchasePrice
      }, { transaction: t });
    }

    prescription.status = 'approved';
    prescription.orderId = order.id;
    prescription.approvedBy = adminId;
    prescription.approvedAt = new Date();
    await prescription.save({ transaction: t });

    await t.commit();
    return order.id;
  } catch (error) {
    await t.rollback();
    if (!error.statusCode) {
      if (error.message.includes('Insufficient stock') || error.message.includes('invalid or not available') || error.message.includes('already been processed') || error.message.includes('not found')) {
        error.statusCode = 400;
        if (error.message.includes('not found')) error.statusCode = 404;
      }
    }
    throw error;
  }
};

const rejectExistingPrescription = async (id) => {
  const prescription = await Prescription.findByPk(id);

  if (!prescription) {
    const error = new Error('Prescription not found.');
    error.statusCode = 404;
    throw error;
  }

  prescription.status = 'rejected';
  await prescription.save();
};

module.exports = {
  uploadNewPrescription,
  getPrescriptionsForUser,
  getAllPrescriptionsList,
  getPrescriptionDetails,
  approveAndCreateOrder,
  rejectExistingPrescription
};
