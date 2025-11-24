// server/routes/staff.js
const express = require("express");
const router = express.Router();
const { verifyToken, requireStaff } = require("../middleware/authMiddleware");
const {
  getStaffBookings,
  completeBooking,
} = require("../controllers/staffController");

// Lấy tất cả booking của nhân viên
router.get("/bookings", verifyToken, requireStaff, getStaffBookings);

// Nhân viên đánh dấu hoàn thành
router.patch(
  "/bookings/:id/complete",
  verifyToken,
  requireStaff,
  completeBooking
);

module.exports = router;
