// File: server/models/User.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connect_db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user','staff','admin'), 
    allowNull: false,
    defaultValue: 'user',             
  },
  // Không cần khai báo created_at ở đây, Sequelize sẽ tự thêm nhờ timestamps: true
}, {
  tableName: "users",
  timestamps: true,    // <--- SỬA THÀNH TRUE (để có created_at, updated_at)
  underscored: true,   // <--- THÊM DÒNG NÀY (để tên cột là created_at thay vì createdAt)
});

module.exports = User;
