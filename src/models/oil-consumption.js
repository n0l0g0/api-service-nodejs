/**
 * OilConsumption Model
 * สำหรับเก็บข้อมูลการเติมและใช้งานน้ำมันเครื่องของเครื่องยนต์
 * @module models/oilConsumption
 * @requires sequelize
 * @requires DataTypes
 */

module.exports = (sequelize, DataTypes) => {
  const OilConsumption = sequelize.define('OilConsumption', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    flight_hours: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    oil_added: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    engine_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'oil_consumptions',
    timestamps: true,
    underscored: true,
    paranoid: true, // เปิดใช้งาน Soft Delete
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  // กำหนดความสัมพันธ์กับโมเดลอื่น
  OilConsumption.associate = (models) => {
    OilConsumption.belongsTo(models.Engine, {
      foreignKey: 'engine_id',
      as: 'engine',
      onDelete: 'CASCADE' // หาก Engine ถูกลบ ให้ลบข้อมูลการใช้น้ำมันด้วย
    });
  };

  return OilConsumption;
}; 