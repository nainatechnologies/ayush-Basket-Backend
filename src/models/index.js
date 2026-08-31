const sequelize = require('../config/db');

const User = require('../modules/user/user.model');
const Category = require('../modules/category/category.model');
const Product = require('../modules/product/product.model');
const Address = require('../modules/address/address.model');
const Order = require('../modules/order/order.model');
const OrderItem = require('../modules/order/orderItem.model');
const CartItem = require('../modules/cart/cartItem.model');
const OtpToken = require('../modules/user/otpToken.model');
const Prescription = require('../modules/prescription/prescription.model');
const SupportTicket = require('../modules/support/supportTicket.model');
const Coupon = require('../modules/coupon/coupon.model');
const Review = require('../modules/review/review.model');
const WishlistItem = require('../modules/wishlist/wishlistItem.model');
const OrderStatusHistory = require('../modules/order/orderStatusHistory.model');

// Relationships

// Order <-> OrderStatusHistory
Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// User <-> OrderStatusHistory (Admin who changed it)
User.hasMany(OrderStatusHistory, { foreignKey: 'changedBy', as: 'statusChanges' });
OrderStatusHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'adminUser' });

// User <-> Address
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> CartItem
User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> OtpToken
User.hasMany(OtpToken, { foreignKey: 'userId', as: 'otpTokens' });
OtpToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Prescription
User.hasMany(Prescription, { foreignKey: 'userId', as: 'prescriptions' });
Prescription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> SupportTicket
User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Order <-> Address
Address.hasMany(Order, { foreignKey: 'addressId', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// OrderItem <-> Product
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// CartItem <-> Product
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> WishlistItem
User.hasMany(WishlistItem, { foreignKey: 'userId', as: 'wishlistItems' });
WishlistItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Product <-> WishlistItem
Product.hasMany(WishlistItem, { foreignKey: 'productId', as: 'wishlistItems' });
WishlistItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Product <-> Review
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Coupon <-> Order
Coupon.hasMany(Order, { foreignKey: 'couponId', as: 'orders' });
Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

// Optional: Sync function exported for server.js
const syncDB = async () => {
  // Turn off alter: true to prevent deadlock during hot-reloads
  await sequelize.sync({ alter: false });
  console.log('✅ All Sequelize models synchronized successfully.');
};

module.exports = {
  sequelize,
  syncDB,
  User,
  Category,
  Product,
  Address,
  Order,
  OrderItem,
  CartItem,
  OtpToken,
  Prescription,
  SupportTicket,
  Coupon,
  Review,
  WishlistItem,
  OrderStatusHistory
};
