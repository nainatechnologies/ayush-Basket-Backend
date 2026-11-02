require('dotenv').config();
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const password = 'Admin@123';
    const phone = '7569363718';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // List of identifiers that should work for Admin login
    const adminAccounts = [
      { email: 'admin@ayushbasket.com', name: 'Super Admin' },
      { email: 'ayushbasket.com', name: 'AyushBasket Admin' }
    ];

    for (const acc of adminAccounts) {
      const existingUser = await User.findOne({ where: { email: acc.email } });
      if (existingUser) {
        existingUser.password = hashedPassword;
        existingUser.role = 'admin';
        existingUser.phone = phone;
        await existingUser.save();
        console.log(`Admin account '${acc.email}' updated successfully! Password reset to: ${password}`);
      } else {
        await User.create({
          name: acc.name,
          email: acc.email,
          password: hashedPassword,
          phone: phone,
          role: 'admin'
        });
        console.log(`Admin account '${acc.email}' created successfully! Password set to: ${password}`);
      }
    }

    console.log('\n--- Admin Credentials ---');
    console.log('Username / Email: admin@ayushbasket.com OR ayushbasket.com');
    console.log('Password: ' + password);
    console.log('Phone: ' + phone);
    console.log('Role: admin\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating/updating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
