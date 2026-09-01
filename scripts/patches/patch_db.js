require('dotenv').config();
const sequelize = require('./src/config/db');
const { DataTypes } = require('sequelize');

const alterTable = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    const tableDesc = await queryInterface.describeTable('coupons');
    
    if (!tableDesc.tag) {
      await queryInterface.addColumn('coupons', 'tag', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'tagBg', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'title', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'titleAccent', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'subtitle', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'ctaLink', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'image', { type: DataTypes.STRING });
      await queryInterface.addColumn('coupons', 'gradientBg', { type: DataTypes.STRING });
      console.log('Columns added to coupons table.');
    } else {
      console.log('Columns already exist.');
    }
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    process.exit();
  }
};

alterTable();
