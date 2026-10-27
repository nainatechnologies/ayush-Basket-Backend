require('dotenv').config();
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const email = 'admin@ayushbasket.com';
    const password = 'Admin@123';
    const phone = '7569363718';
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.phone = phone;
      await existingUser.save();
      console.log('Admin user updated successfully! Credentials reset.');
    } else {
      await User.create({
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        phone: phone,
        role: 'admin'
      });
      console.log('Admin user created successfully!');
    }

    console.log('Email: ' + email);
    console.log('Password: ' + password);
    process.exit();
  } catch (error) {
    console.error('Error creating/updating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
