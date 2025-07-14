/**
 * User Model
 * สำหรับเก็บข้อมูลผู้ใช้งานในระบบ
 * @module models/user
 * @requires sequelize
 * @requires DataTypes
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      required_duo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      duo_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
  return User;
}; 