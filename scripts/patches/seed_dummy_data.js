require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { 
  sequelize, User, Category, Product, Address, Order, OrderItem, 
  Prescription, WishlistItem, DailyRevenue 
} = require('../../src/models');
const revenueService = require('../../src/modules/revenue/revenue.service');

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    // IMPORTANT: Assuming tables exist. We are just inserting data.
    const passwordHash = await bcrypt.hash('password123', 10);
    
    console.log('1. Seeding Admin...');
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@ayushbasket.com' },
      defaults: {
        name: 'Super Admin',
        phone: '1000000000',
        password: passwordHash,
        role: 'admin'
      }
    });

    console.log('2. Seeding Customers...');
    const customers = [];
    const customerData = [
      { name: 'John Doe', email: 'john@example.com', phone: '9876543210' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211' },
      { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543212' }
    ];
    for (const c of customerData) {
      const [user] = await User.findOrCreate({
        where: { email: c.email },
        defaults: { ...c, password: passwordHash, role: 'customer' }
      });
      customers.push(user);
    }

    console.log('3. Seeding Addresses...');
    const addresses = [];
    for (const user of customers) {
      const [address] = await Address.findOrCreate({
        where: { userId: user.id },
        defaults: {
          fullName: user.name,
          phone: user.phone,
          street: '123 Main St, Apt ' + user.id,
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          type: 'home'
        }
      });
      addresses.push(address);
    }

    console.log('4. Seeding Categories...');
    const [catHomeo] = await Category.findOrCreate({
      where: { name: 'Homeopathy' },
      defaults: { description: 'Homeopathic Medicines' }
    });
    const [catAyur] = await Category.findOrCreate({
      where: { name: 'Ayurveda' },
      defaults: { description: 'Ayurvedic Products' }
    });

    console.log('5. Seeding Products...');
    const productsData = [
      { name: 'Arnica Montana 30 CH', categoryId: catHomeo.id, price: 150, costPrice: 90, stock: 50, returnPolicy: 'No Return' },
      { name: 'Nux Vomica 200 CH', categoryId: catHomeo.id, price: 120, costPrice: 70, stock: 100, returnPolicy: 'Easy Return' },
      { name: 'Ashwagandha Churna', categoryId: catAyur.id, price: 250, costPrice: 150, stock: 30, returnPolicy: 'Easy Return' },
      { name: 'Chyawanprash 1kg', categoryId: catAyur.id, price: 400, costPrice: 280, stock: 15, returnPolicy: 'No Return' },
      { name: 'Brahmi Vati', categoryId: catAyur.id, price: 180, costPrice: 100, stock: 0, returnPolicy: 'Easy Return', status: 'Out of Stock' }
    ];
    
    const products = [];
    for (const p of productsData) {
      const [prod] = await Product.findOrCreate({
        where: { name: p.name },
        defaults: {
          description: 'A highly effective medicine.',
          fullDescription: 'This is a long description of the product benefits and uses.',
          price: p.price,
          offerPrice: p.price,
          costPrice: p.costPrice,
          stock: p.stock,
          status: p.status || 'In Stock',
          categoryId: p.categoryId,
          returnPolicy: p.returnPolicy,
          packageSize: '100g',
          imageUrl: '/public/default-product.png' // Dummy image
        }
      });
      products.push(prod);
    }

    console.log('6. Seeding Wishlists...');
    for (let i = 0; i < customers.length; i++) {
      await WishlistItem.findOrCreate({
        where: { userId: customers[i].id, productId: products[i % products.length].id }
      });
    }

    console.log('7. Seeding Prescriptions...');
    for (let i = 0; i < customers.length; i++) {
      await Prescription.findOrCreate({
        where: { userId: customers[i].id },
        defaults: {
          imageUrl: '/public/dummy-prescription.jpg',
          status: i % 2 === 0 ? 'pending' : 'approved',
          notes: 'Please review this prescription'
        }
      });
    }

    console.log('8. Seeding Orders & Daily Revenue...');
    const pastDate1 = new Date(); pastDate1.setDate(pastDate1.getDate() - 1);
    const pastDate2 = new Date(); pastDate2.setDate(pastDate2.getDate() - 2);
    
    const orderScenarios = [
      { user: customers[0], addr: addresses[0], date: pastDate2, status: 'completed' },
      { user: customers[1], addr: addresses[1], date: pastDate1, status: 'completed' },
      { user: customers[2], addr: addresses[2], date: new Date(), status: 'pending' },
      { user: customers[0], addr: addresses[0], date: new Date(), status: 'out_for_delivery' },
    ];

    for (let i = 0; i < orderScenarios.length; i++) {
      const sc = orderScenarios[i];
      // Create Order
      const [order, created] = await Order.findOrCreate({
        where: { userId: sc.user.id, created_at: sc.date },
        defaults: {
          addressId: sc.addr.id,
          totalAmount: products[0].price + products[1].price,
          status: sc.status,
          paymentMethod: 'Online',
          paymentStatus: sc.status === 'completed' ? 'paid' : 'pending',
          created_at: sc.date
        }
      });

      if (created) {
        // Add Order Items
        await OrderItem.create({
          orderId: order.id,
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
          purchasePrice: products[0].costPrice
        });
        await OrderItem.create({
          orderId: order.id,
          productId: products[1].id,
          quantity: 1,
          price: products[1].price,
          purchasePrice: products[1].costPrice
        });

        // Trigger Revenue if completed
        if (sc.status === 'completed') {
          // Temporarily attach items to order for the logOrderRevenue trigger
          order.items = await OrderItem.findAll({ where: { orderId: order.id } });
          await revenueService.logOrderRevenue(order.id);
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    process.exit();
  }
};

seedDatabase();
