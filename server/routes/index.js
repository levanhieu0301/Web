const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const bookingRoutes = require("./booking");
const adminRoutes = require("./admin");
const userRoutes = require("./user");
const staffRoutes = require("./staff");
const productRoutes = require("./product");
const orderRoutes = require("./order");


router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/staff", staffRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

module.exports = router;