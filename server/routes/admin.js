const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.get("/users", verifyToken, requireAdmin, adminController.getAllUsers);
router.get(
  "/employees",
  verifyToken,
  requireAdmin,
  adminController.getAllEmployees
);
router.get(
  "/bookings",
  verifyToken,
  requireAdmin,
  adminController.getAllBookings
);
router.patch(
  "/bookings/:id",
  verifyToken,
  requireAdmin,
  adminController.updateBookingStatus
);
router.patch(
  "/bookings/:id/assign-staff",
  verifyToken,
  requireAdmin,
  adminController.assignStaffToBooking
);
router.post(
  "/employees",
  verifyToken,
  requireAdmin,
  adminController.createEmployee
);
router.delete(
  "/employees/:id",
  verifyToken,
  requireAdmin,
  adminController.deleteEmployee
);

module.exports = router;
