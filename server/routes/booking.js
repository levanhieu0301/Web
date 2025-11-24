const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController"); // Import controller vừa sửa
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.use(verifyToken);

/* ================= USER ROUTES ================= */

router.post("/", bookingController.createBooking);

router.get("/user/:userId", bookingController.getUserHistory);

router.put("/cancel/:id", bookingController.cancelByUser);

router.get("/:id", bookingController.getBookingById);


/* ================= ADMIN ROUTES ================= */

router.get("/", requireAdmin, bookingController.getAllBookings);

router.patch("/status/:id", requireAdmin, bookingController.changeStatus);

module.exports = router;