const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OilConsumption = sequelize.define('OilConsumption', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    oilType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.ENUM('liters', 'gallons'),
      defaultValue: 'liters'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    aircraftId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'aircraft',
        key: 'id'
      }
    },
    engineId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'engines',
        key: 'id'
      }
    }
  }, {
    tableName: 'oil_consumptions',
    timestamps: true
  });

  return OilConsumption;
}; 