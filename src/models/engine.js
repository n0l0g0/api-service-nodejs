/**
 * Engine Model
 * สำหรับเก็บข้อมูลเครื่องยนต์ของเครื่องบิน
 * @module models/engine
 */

module.exports = (sequelize, DataTypes) => {
  const Engine = sequelize.define('Engine', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serial_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // สถานะน้ำมันและการแจ้งเตือน
    average_consumption_rate_per_hour: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    estimated_hours_remaining: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    low_oil_threshold_hours: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    last_calculation_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // คีย์นอกสำหรับความสัมพันธ์กับเครื่องบิน
    aircraft_id: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'aircraft_id'
    },
    // สำหรับ Soft Delete
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    tableName: 'engines',
    timestamps: true,
    underscored: true,
    paranoid: true, // เปิดใช้งาน Soft Delete
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  // กำหนดความสัมพันธ์กับโมเดลอื่น
  Engine.associate = (models) => {
    Engine.belongsTo(models.Aircraft, {
      foreignKey: 'aircraft_id',
      as: 'aircraft',
      onDelete: 'CASCADE' // หาก Aircraft ถูกลบ ให้ลบ Engine ด้วย
    });

    Engine.hasMany(models.OilConsumption, {
      foreignKey: 'engine_id',
      as: 'oil_consumptions'
    });
  };

  return Engine;
}; 