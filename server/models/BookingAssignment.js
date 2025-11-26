const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connect_db");

const BookingAssignment = sequelize.define("BookingAssignment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  staff_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  task: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "General",
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: "booking_assignments",
  timestamps: false,
  underscored: true,
});

module.exports = BookingAssignment;