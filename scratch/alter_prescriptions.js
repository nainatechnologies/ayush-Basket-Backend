require('dotenv').config();
const sequelize = require('../src/config/db');

async function alterTable() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if columns already exist before adding them
    const tableInfo = await queryInterface.describeTable('prescriptions');
    
    if (!tableInfo.image_url_2) {
      await queryInterface.addColumn('prescriptions', 'image_url_2', {
        type: sequelize.Sequelize.DataTypes.TEXT('long'),
        allowNull: true
      });
      await queryInterface.addColumn('prescriptions', 'image_mime_type_2', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true
      });
      console.log('Added image 2 columns');
    }

    if (!tableInfo.image_url_3) {
      await queryInterface.addColumn('prescriptions', 'image_url_3', {
        type: sequelize.Sequelize.DataTypes.TEXT('long'),
        allowNull: true
      });
      await queryInterface.addColumn('prescriptions', 'image_mime_type_3', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true
      });
      console.log('Added image 3 columns');
    }

    if (!tableInfo.image_url_4) {
      await queryInterface.addColumn('prescriptions', 'image_url_4', {
        type: sequelize.Sequelize.DataTypes.TEXT('long'),
        allowNull: true
      });
      await queryInterface.addColumn('prescriptions', 'image_mime_type_4', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true
      });
      console.log('Added image 4 columns');
    }

    console.log('Alter table prescriptions completed successfully.');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    await sequelize.close();
  }
}

alterTable();
