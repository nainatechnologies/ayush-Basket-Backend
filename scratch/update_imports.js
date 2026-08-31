const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const modulesDir = path.join(srcDir, 'modules');

// Helper to replace in file
function replaceInFile(filepath, replacements) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated imports in ${path.basename(filepath)}`);
  }
}

// 1. Update server.js
replaceInFile(path.join(srcDir, 'server.js'), [
  { from: /require\('\.\/routes\/authRoutes'\)/g, to: "require('./modules/auth/auth.routes')" },
  { from: /require\('\.\/routes\/adminAuthRoutes'\)/g, to: "require('./modules/admin/admin.routes')" },
  { from: /require\('\.\/routes\/categoryRoutes'\)/g, to: "require('./modules/category/category.routes')" },
  { from: /require\('\.\/routes\/productRoutes'\)/g, to: "require('./modules/product/product.routes')" },
  { from: /require\('\.\/routes\/orderRoutes'\)/g, to: "require('./modules/order/order.routes')" },
  { from: /require\('\.\/routes\/dashboardRoutes'\)/g, to: "require('./modules/dashboard/dashboard.routes')" },
  { from: /require\('\.\/routes\/cartRoutes'\)/g, to: "require('./modules/cart/cart.routes')" },
  { from: /require\('\.\/routes\/addressRoutes'\)/g, to: "require('./modules/address/address.routes')" },
  { from: /require\('\.\/routes\/userRoutes'\)/g, to: "require('./modules/user/user.routes')" },
  { from: /require\('\.\/routes\/prescriptionRoutes'\)/g, to: "require('./modules/prescription/prescription.routes')" },
  { from: /require\('\.\/routes\/supportRoutes'\)/g, to: "require('./modules/support/support.routes')" },
  { from: /require\('\.\/routes\/revenueRoutes'\)/g, to: "require('./modules/revenue/revenue.routes')" },
  { from: /require\('\.\/routes\/wishlistRoutes'\)/g, to: "require('./modules/wishlist/wishlist.routes')" },
  { from: /require\('\.\/routes\/couponRoutes'\)/g, to: "require('./modules/coupon/coupon.routes')" },
  { from: /require\('\.\/routes\/reviewRoutes'\)/g, to: "require('./modules/review/review.routes')" }
]);

// 2. Update models/index.js
replaceInFile(path.join(srcDir, 'models', 'index.js'), [
  { from: /require\('\.\/User'\)/g, to: "require('../modules/user/user.model')" },
  { from: /require\('\.\/Category'\)/g, to: "require('../modules/category/category.model')" },
  { from: /require\('\.\/Product'\)/g, to: "require('../modules/product/product.model')" },
  { from: /require\('\.\/Address'\)/g, to: "require('../modules/address/address.model')" },
  { from: /require\('\.\/Order'\)/g, to: "require('../modules/order/order.model')" },
  { from: /require\('\.\/OrderItem'\)/g, to: "require('../modules/order/orderItem.model')" },
  { from: /require\('\.\/CartItem'\)/g, to: "require('../modules/cart/cartItem.model')" },
  { from: /require\('\.\/OtpToken'\)/g, to: "require('../modules/user/otpToken.model')" },
  { from: /require\('\.\/Prescription'\)/g, to: "require('../modules/prescription/prescription.model')" },
  { from: /require\('\.\/SupportTicket'\)/g, to: "require('../modules/support/supportTicket.model')" },
  { from: /require\('\.\/Coupon'\)/g, to: "require('../modules/coupon/coupon.model')" },
  { from: /require\('\.\/Review'\)/g, to: "require('../modules/review/review.model')" },
  { from: /require\('\.\/WishlistItem'\)/g, to: "require('../modules/wishlist/wishlistItem.model')" },
  { from: /require\('\.\/OrderStatusHistory'\)/g, to: "require('../modules/order/orderStatusHistory.model')" }
]);

// 3. Update controllers and routes in modules
const modules = fs.readdirSync(modulesDir);
modules.forEach(mod => {
  const modPath = path.join(modulesDir, mod);
  if (fs.statSync(modPath).isDirectory()) {
    const files = fs.readdirSync(modPath);
    
    files.forEach(file => {
      const filepath = path.join(modPath, file);
      let isController = file.endsWith('.controller.js');
      let isRoute = file.endsWith('.routes.js');
      let isModel = file.endsWith('.model.js');
      
      let replacements = [];

      // Update paths that went up one directory previously
      replacements.push({ from: /require\('\.\.\/models/g, to: "require('../../models" });
      replacements.push({ from: /require\('\.\.\/utils/g, to: "require('../../utils" });
      replacements.push({ from: /require\('\.\.\/middleware/g, to: "require('../../middleware" });
      replacements.push({ from: /require\('\.\.\/config/g, to: "require('../../config" });

      if (isRoute) {
        // Routes require controllers from same dir now
        replacements.push({ from: /require\('\.\.\/controllers\/([a-zA-Z0-9]+)Controller'\)/g, to: "require('./$1.controller')" });
        // Handle adminAuthController manually since it changes to admin.controller
        replacements.push({ from: /require\('\.\/adminAuth\.controller'\)/g, to: "require('./admin.controller')" });
      }

      replaceInFile(filepath, replacements);
    });
  }
});
