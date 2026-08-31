const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const modulesDir = path.join(srcDir, 'modules');

if (!fs.existsSync(modulesDir)) {
  fs.mkdirSync(modulesDir);
}

const map = [
  { module: 'auth', controller: 'authController.js', routes: 'authRoutes.js' },
  { module: 'admin', controller: 'adminAuthController.js', routes: 'adminAuthRoutes.js' },
  { module: 'product', controller: 'productController.js', routes: 'productRoutes.js', models: ['Product.js'] },
  { module: 'order', controller: 'orderController.js', routes: 'orderRoutes.js', models: ['Order.js', 'OrderItem.js', 'OrderStatusHistory.js'] },
  { module: 'user', controller: 'userController.js', routes: 'userRoutes.js', models: ['User.js', 'OtpToken.js'] },
  { module: 'category', controller: 'categoryController.js', routes: 'categoryRoutes.js', models: ['Category.js'] },
  { module: 'address', controller: 'addressController.js', routes: 'addressRoutes.js', models: ['Address.js'] },
  { module: 'cart', controller: 'cartController.js', routes: 'cartRoutes.js', models: ['CartItem.js'] },
  { module: 'coupon', controller: 'couponController.js', routes: 'couponRoutes.js', models: ['Coupon.js'] },
  { module: 'dashboard', controller: 'dashboardController.js', routes: 'dashboardRoutes.js' },
  { module: 'prescription', controller: 'prescriptionController.js', routes: 'prescriptionRoutes.js', models: ['Prescription.js'] },
  { module: 'review', controller: 'reviewController.js', routes: 'reviewRoutes.js', models: ['Review.js'] },
  { module: 'support', controller: 'supportController.js', routes: 'supportRoutes.js', models: ['SupportTicket.js'] },
  { module: 'wishlist', controller: 'wishlistController.js', routes: 'wishlistRoutes.js', models: ['WishlistItem.js'] },
  { module: 'revenue', controller: 'revenueController.js', routes: 'revenueRoutes.js' },
];

map.forEach(item => {
  const modPath = path.join(modulesDir, item.module);
  if (!fs.existsSync(modPath)) fs.mkdirSync(modPath);

  // Move controller
  if (item.controller) {
    const oldPath = path.join(srcDir, 'controllers', item.controller);
    const newPath = path.join(modPath, `${item.module}.controller.js`);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Moved ${item.controller} -> ${item.module}.controller.js`);
    }
  }

  // Move routes
  if (item.routes) {
    const oldPath = path.join(srcDir, 'routes', item.routes);
    const newPath = path.join(modPath, `${item.module}.routes.js`);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Moved ${item.routes} -> ${item.module}.routes.js`);
    }
  }

  // Move models
  if (item.models) {
    item.models.forEach(model => {
      const oldPath = path.join(srcDir, 'models', model);
      // For multiple models in one module, use the model's base name (lowercase first letter) + .model.js
      const baseName = model.replace('.js', '');
      const lowerName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
      const newPath = path.join(modPath, `${lowerName}.model.js`);
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${model} -> ${lowerName}.model.js`);
      }
    });
  }
});
