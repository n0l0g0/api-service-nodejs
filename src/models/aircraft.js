const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Aircraft = sequelize.define('Aircraft', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    registration: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    yearOfManufacture: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'maintenance', 'retired'),
      defaultValue: 'active'
    },
    totalFlightHours: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextMaintenanceDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'aircraft',
    timestamps: true
  });

  return Aircraft;
}; 