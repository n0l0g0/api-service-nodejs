/**
 * API Service Models
 * กำหนด models และ associations
 */

const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import individual models
const createAircraftModel = require('./aircraft');
const createEngineModel = require('./engine');
const createOilConsumptionModel = require('./oil-consumption');
const createUserModel = require('./user');

// สร้าง models
const Aircraft = createAircraftModel(sequelize, DataTypes);
const Engine = createEngineModel(sequelize, DataTypes);
const OilConsumption = createOilConsumptionModel(sequelize, DataTypes);
const User = createUserModel(sequelize, DataTypes);

const models = {
  Aircraft,
  Engine,
  OilConsumption,
  User
};

// กำหนด associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// เพิ่ม sequelize instance สำหรับการใช้งาน
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

module.exports = { Aircraft, Engine, OilConsumption, User };
