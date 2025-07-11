/**
 * API Service Models
 * ใช้ shared models และกำหนด associations
 */

const { createModels } = require('aircraft-shared-models');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// สร้าง models ทั้งหมดจาก shared models
const models = createModels(sequelize, DataTypes);

// Export models สำหรับใช้งานใน api service
const { Aircraft, Engine, OilConsumption } = models;

// เพิ่ม sequelize instance สำหรับการใช้งาน
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

module.exports = { Aircraft, Engine, OilConsumption };
