const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Engine = sequelize.define('Engine', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    engineNumber: {
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
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'maintenance', 'retired'),
      defaultValue: 'active'
    },
    totalOperatingHours: {
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
    },
    aircraftId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'aircraft',
        key: 'id'
      }
    }
  }, {
    tableName: 'engines',
    timestamps: true
  });

  return Engine;
}; 