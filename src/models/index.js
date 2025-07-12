/**
 * API Service Models
 * ใช้ local models แทน shared models
 */

const { sequelize } = require('../config/database');

// Import models
const Aircraft = require('./aircraft')(sequelize);
const Engine = require('./engine')(sequelize);
const OilConsumption = require('./oil-consumption')(sequelize);

// Define associations
Aircraft.hasMany(Engine, {
  foreignKey: 'aircraftId',
  as: 'engines'
});

Engine.belongsTo(Aircraft, {
  foreignKey: 'aircraftId',
  as: 'aircraft'
});

Aircraft.hasMany(OilConsumption, {
  foreignKey: 'aircraftId',
  as: 'oilConsumptions'
});

Engine.hasMany(OilConsumption, {
  foreignKey: 'engineId',
  as: 'oilConsumptions'
});

OilConsumption.belongsTo(Aircraft, {
  foreignKey: 'aircraftId',
  as: 'aircraft'
});

OilConsumption.belongsTo(Engine, {
  foreignKey: 'engineId',
  as: 'engine'
});

// Export models
module.exports = {
  Aircraft,
  Engine,
  OilConsumption,
  sequelize
};
