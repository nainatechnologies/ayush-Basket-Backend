const { User, Order } = require('../../models');
const bcrypt = require('bcryptjs');

const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }
  });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.name) user.name = data.name;
  if (data.phone) user.phone = data.phone;

  await user.save();
  return user;
};

const getAllCustomersWithStats = async () => {
  const users = await User.findAll({
    where: { role: 'customer' },
    attributes: { exclude: ['password'] },
    order: [['created_at', 'DESC']]
  });

  const formattedCustomers = await Promise.all(users.map(async (user) => {
    const orders = await Order.findAll({ where: { userId: user.id } });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    
    const u = user.toJSON();
    return {
      ...u,
      totalOrders,
      totalSpent,
      date: u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'N/A',
      createdAt: u.created_at
    };
  }));

  return formattedCustomers;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    const error = new Error('New password must be different from current password.');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
};

module.exports = {
  getUserById,
  updateProfile,
  getAllCustomersWithStats,
  changeUserPassword
};
