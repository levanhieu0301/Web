const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connect_db");

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    original_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Giá gốc trước khi giảm",
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: "Số tiền được giảm",
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Số tiền khách phải trả cuối cùng",
    },
    payment_status: {
      type: DataTypes.ENUM("unpaid", "paid", "refunded"),
      defaultValue: "unpaid",
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Thời điểm thanh toán thành công",
    }
  },
  {
    tableName: "invoices",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Invoice;