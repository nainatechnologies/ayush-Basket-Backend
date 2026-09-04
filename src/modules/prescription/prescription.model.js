const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Prescription = sequelize.define('Prescription', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  imageUrl: {
    type: DataTypes.TEXT('long'),
    field: 'image_url'
  },
  imageMimeType: {
    type: DataTypes.STRING,
    field: 'image_mime_type',
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT
  },
  medicines: {
    type: DataTypes.TEXT
  },
  patient_name: {
    type: DataTypes.STRING(255),
    field: 'patient_name'
  },
  address: {
    type: DataTypes.TEXT
  },
  doctor_name: {
    type: DataTypes.STRING(255),
    field: 'doctor_name'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  orderId: {
    type: DataTypes.INTEGER,
    field: 'order_id'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by'
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  }
}, {
  tableName: 'prescriptions'
});

module.exports = Prescription;
