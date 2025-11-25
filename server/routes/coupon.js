const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.post("/check", verifyToken, couponController.checkCoupon);

router.get("/", verifyToken, requireAdmin, couponController.getAllCoupons);

router.post("/", verifyToken, requireAdmin, couponController.createCoupon);

module.exports = router;