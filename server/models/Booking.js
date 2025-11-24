// server/models/Booking.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connect_db");
const User = require("./User");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: User, key: "id" },
    },
    service: { type: DataTypes.STRING, allowNull: true },
    car_brand: { type: DataTypes.STRING, allowNull: true },
    car_model: { type: DataTypes.STRING, allowNull: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
    appointment_time: { type: DataTypes.TIME, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "bookings",
    timestamps: false,
    underscored: true,
  }
);

// Quan hệ
Booking.belongsTo(User, { foreignKey: "user_id", as: "user" });
Booking.belongsTo(User, { foreignKey: "staff_id", as: "staff" }); // Quan hệ staff

module.exports = Booking;
