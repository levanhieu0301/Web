const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");

const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Người dùng / nhân viên / admin có thể kiểm tra mã khi đặt hàng
router.post("/check", verifyToken, couponController.checkCoupon);

// Admin quản lý mã giảm giá
router.get("/", verifyToken, requireAdmin, couponController.getAllCoupons);

router.post("/", verifyToken, requireAdmin, couponController.createCoupon);

// Vô hiệu hoá (xoá mềm) coupon
router.delete("/:id", verifyToken, requireAdmin, couponController.deleteCoupon);

module.exports = router;