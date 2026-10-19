require('dotenv').config();
const { Product } = require('../src/models');
const productService = require('../src/modules/product/product.service');
const cartService = require('../src/modules/cart/cart.service');
const orderService = require('../src/modules/order/order.service');

async function runTests() {
  console.log('=== STARTING OUT-OF-STOCK SYNC TESTS ===\n');

  // Find an active product to test
  const product = await Product.findOne({ where: { status: 'active' } }) || await Product.findOne();
  if (!product) {
    console.error('No products found in database to test.');
    process.exit(1);
  }

  const testId = product.id;
  const originalStock = product.stock;
  const originalStatus = product.status;
  console.log(`[TEST SETUP] Selected product ID: ${testId} ("${product.name}"), original stock: ${originalStock}, original status: "${originalStatus}"`);

  try {
    // 1. Admin sets product to "Out of Stock"
    console.log('\n--- 1. Testing Admin Update to "Out of Stock" ---');
    const updateResult = await productService.updateExistingProduct(testId, {
      status: 'Out of Stock'
    }, { img1: null, img2: null, img3: null });

    console.log(`Update result - status: "${updateResult.status}", stock: ${updateResult.stock}, inStock: ${updateResult.inStock}`);
    if (updateResult.status !== 'Out of Stock' || updateResult.stock !== 0 || updateResult.inStock !== false) {
      throw new Error(`Admin update did not properly set status to Out of Stock, stock to 0, or inStock to false.`);
    }
    console.log('PASS: Admin update synchronized status="Out of Stock" and stock=0.');

    // 2. Customer product details
    console.log('\n--- 2. Testing Customer getProductDetails ---');
    const details = await productService.getProductDetails(testId);
    console.log(`Details - status: "${details.status}", stock: ${details.stock}, inStock: ${details.inStock}, isOutOfStock: ${details.isOutOfStock}`);
    if (details.status !== 'Out of Stock' || details.stock !== 0 || details.inStock !== false || !details.isOutOfStock) {
      throw new Error('Customer getProductDetails failed out-of-stock check');
    }
    console.log('PASS: getProductDetails correctly returns Out of Stock, stock=0, inStock=false.');

    // 3. Customer listing getCustomerProducts
    console.log('\n--- 3. Testing Customer getCustomerProducts ---');
    const customerProducts = await productService.getCustomerProducts({});
    const foundInCustomer = customerProducts.find(p => p.id === testId);
    if (!foundInCustomer) {
      console.log('Notice: Product not returned in customer listing (may be filtered or hidden).');
    } else {
      console.log(`Customer listing - status: "${foundInCustomer.status}", stock: ${foundInCustomer.stock}, inStock: ${foundInCustomer.inStock}`);
      if (foundInCustomer.status !== 'Out of Stock' || foundInCustomer.stock !== 0 || foundInCustomer.inStock !== false) {
        throw new Error('Customer listing failed out-of-stock check');
      }
      console.log('PASS: getCustomerProducts correctly returns Out of Stock.');
    }

    // 4. Customer Search
    console.log('\n--- 4. Testing Customer searchProducts ---');
    const searchResults = await productService.searchProducts(product.name.slice(0, 5));
    const foundInSearch = searchResults.find(p => p.id === testId);
    if (foundInSearch) {
      console.log(`Search result - status: "${foundInSearch.status}", stock: ${foundInSearch.stock}, inStock: ${foundInSearch.inStock}`);
      if (foundInSearch.status !== 'Out of Stock' || foundInSearch.stock !== 0 || foundInSearch.inStock !== false) {
        throw new Error('Customer search failed out-of-stock check');
      }
      console.log('PASS: searchProducts correctly returns Out of Stock.');
    }

    // 5. Test Cart blocking
    console.log('\n--- 5. Testing Cart Protection (addItemToCart) ---');
    let cartBlocked = false;
    try {
      await cartService.addItemToCart(1, testId, 1);
    } catch (err) {
      cartBlocked = true;
      console.log(`addItemToCart correctly rejected with: "${err.message}"`);
    }
    if (!cartBlocked) {
      throw new Error('Cart failed to block adding out of stock product!');
    }
    console.log('PASS: addItemToCart blocked out-of-stock item.');

    // 6. Test Order blocking
    console.log('\n--- 6. Testing Order Protection (createOrder) ---');
    let orderBlocked = false;
    try {
      await orderService.createOrder(1, {
        orderItems: [{ product_id: testId, quantity: 1 }],
        address_id: 1,
        paymentMethod: 'cod'
      });
    } catch (err) {
      orderBlocked = true;
      console.log(`createOrder correctly rejected with: "${err.message}"`);
    }
    if (!orderBlocked) {
      throw new Error('Order creation failed to block out of stock item!');
    }
    console.log('PASS: createOrder blocked out-of-stock item.');

    // 7. Restore product back to original stock and status
    console.log('\n--- 7. Testing Restore to In Stock ---');
    const restoredStock = Math.max(10, originalStock || 10);
    const restoreResult = await productService.updateExistingProduct(testId, {
      status: 'In Stock',
      stock: restoredStock
    }, { img1: null, img2: null, img3: null });

    console.log(`Restored product - status: "${restoreResult.status}", stock: ${restoreResult.stock}, inStock: ${restoreResult.inStock}`);
    if (restoreResult.status !== 'In Stock' || restoreResult.stock !== restoredStock || restoreResult.inStock !== true) {
      throw new Error('Failed to restore product to In Stock');
    }
    console.log('PASS: Product restored to In Stock.');

    console.log('\nALL TESTS PASSED SUCCESSFULLY! Out-of-stock synchronization is complete and verified.');
    process.exit(0);
  } catch (err) {
    console.error('\nTEST FAILED:', err);
    // Cleanup if needed
    try {
      await Product.update({ stock: originalStock, status: originalStatus }, { where: { id: testId } });
      console.log('Restored product to original state after error.');
    } catch (cleanupErr) {
      console.error('Failed to cleanup product:', cleanupErr.message);
    }
    process.exit(1);
  }
}

runTests();
