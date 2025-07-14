/**
 * Aircraft Model
 * สำหรับเก็บข้อมูลเครื่องบิน
 * @module models/aircraft
 */

module.exports = (sequelize, DataTypes) => {
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
    aircraft_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    engine_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    engine_qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'aircrafts',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // กำหนดความสัมพันธ์กับโมเดลอื่น
  Aircraft.associate = (models) => {
    Aircraft.hasMany(models.Engine, {
      foreignKey: 'aircraft_id',
      as: 'engines'
    });
  };

  return Aircraft;
}; 