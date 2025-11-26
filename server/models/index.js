const { Sequelize } = require("sequelize");
const { sequelize } = require("../config/connect_db.js");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./User.js");
db.Booking = require("./Booking.js");
db.BookingAssignment = require("./BookingAssignment.js");
db.Coupon = require("./Coupon.js");
db.Invoice = require("./Invoice.js");
db.Product = require("./Product.js");
db.Order = require("./Order.js");
db.OrderItem = require("./OrderItem.js");

db.User.hasMany(db.Booking, { foreignKey: "user_id", as: "bookings" });
db.Booking.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

db.Booking.belongsToMany(db.User, {
  through: db.BookingAssignment,
  as: "assigned_staff",
  foreignKey: "booking_id",
  otherKey: "staff_id"
});
db.User.belongsToMany(db.Booking, {
  through: db.BookingAssignment,
  as: "assigned_tasks",
  foreignKey: "staff_id",
  otherKey: "booking_id"
});

db.Booking.hasOne(db.Invoice, { foreignKey: "booking_id", as: "invoice" });
db.Invoice.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });

db.User.hasMany(db.Invoice, { foreignKey: "user_id", as: "invoices" });
db.Invoice.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

db.Coupon.hasMany(db.Invoice, { foreignKey: "coupon_id", as: "invoices" });
db.Invoice.belongsTo(db.Coupon, { foreignKey: "coupon_id", as: "coupon" });

// db.User.hasMany(db.Order, { foreignKey: "user_id", as: "orders" });
// db.Order.belongsTo(db.User, { foreignKey: "user_id", as: "user" });

// db.Order.hasMany(db.OrderItem, { foreignKey: "order_id", as: "items" });
// db.OrderItem.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });

// db.Product.hasMany(db.OrderItem, { foreignKey: "product_id", as: "ordered_items" });
// db.OrderItem.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });

module.exports = db;