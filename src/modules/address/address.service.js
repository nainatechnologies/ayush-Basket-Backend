const { Address, sequelize } = require('../../models');

const getAddressesForUser = async (userId) => {
  return await Address.findAll({
    where: { userId },
    order: [['is_default', 'DESC'], ['created_at', 'DESC']]
  });
};

const addAddress = async (userId, data) => {
  const existingCount = await Address.count({ where: { userId } });
  const shouldBeDefault = existingCount === 0 || data.is_default;

  const t = await sequelize.transaction();

  try {
    if (shouldBeDefault) {
      await Address.update(
        { is_default: false },
        { where: { userId, is_default: true }, transaction: t }
      );
    }

    const address = await Address.create({
      userId,
      fullName: data.full_name ? data.full_name.trim() : (data.fullName || '').trim(),
      phone: data.phone.trim(),
      street: data.street.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      pincode: data.pincode.trim(),
      is_default: shouldBeDefault,
      addressType: data.address_type || data.addressType || 'home',
      flatHouse: data.flat_house || data.flatHouse || null
    }, { transaction: t });

    await t.commit();
    return address;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateAddress = async (userId, addressId, data) => {
  const address = await Address.findOne({
    where: { id: addressId, userId }
  });

  if (!address) {
    const error = new Error('Address not found');
    error.statusCode = 404;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    if (data.is_default && !address.is_default) {
      await Address.update(
        { is_default: false },
        { where: { userId, is_default: true }, transaction: t }
      );
      address.is_default = true;
    }

    if (data.full_name) address.fullName = data.full_name.trim();
    if (data.fullName) address.fullName = data.fullName.trim();
    if (data.phone) address.phone = data.phone.trim();
    if (data.street) address.street = data.street.trim();
    if (data.city) address.city = data.city.trim();
    if (data.state) address.state = data.state.trim();
    if (data.pincode) address.pincode = data.pincode.trim();
    if (data.address_type || data.addressType) address.addressType = data.address_type || data.addressType;
    if (data.flat_house !== undefined || data.flatHouse !== undefined) address.flatHouse = data.flat_house || data.flatHouse || null;

    await address.save({ transaction: t });
    await t.commit();
    
    return address;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ where: { id: addressId, userId } });
  
  if (!address) {
    const error = new Error('Address not found');
    error.statusCode = 404;
    throw error;
  }

  const wasDefault = address.is_default;
  await address.destroy();

  // If we deleted the default address, optionally make another one default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ where: { userId } });
    if (nextAddress) {
      nextAddress.is_default = true;
      await nextAddress.save();
    }
  }
};

module.exports = {
  getAddressesForUser,
  addAddress,
  updateAddress,
  deleteAddress
};
