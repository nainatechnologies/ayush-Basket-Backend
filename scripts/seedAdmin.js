const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const email = 'admin@ayushbasket.com';
    const password = 'adminpassword123';
    
    // Check if admin already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.log('Admin user already exists!');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Super Admin', email, hashedPassword, 'admin']
    );

    console.log('Admin user created successfully!');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    process.exit();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
