const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// Tất cả routes đều cần đăng nhập
router.use(verifyToken);

// Tạo đơn hàng mới
router.post("/", orderController.createOrder);

// Lấy tất cả đơn hàng (user chỉ thấy đơn hàng của mình, admin/staff thấy tất cả)
router.get("/", orderController.getAllOrders);

// Lấy đơn hàng theo ID
router.get("/:id", orderController.getOrderById);

// Cập nhật đơn hàng
router.patch("/:id", orderController.updateOrder);

// Xóa đơn hàng
router.delete("/:id", orderController.deleteOrder);

// Cập nhật chi tiết đơn hàng
router.patch("/items/:itemId", orderController.updateOrderItem);

// Xóa chi tiết đơn hàng
router.delete("/items/:itemId", orderController.deleteOrderItem);

module.exports = router;




