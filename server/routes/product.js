const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Public routes - Lấy tất cả sản phẩm và chi tiết
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/images/:imageName", productController.getProductImage);

// Admin routes - CRUD sản phẩm
router.post(
  "/",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  productController.createProduct
);
router.patch(
  "/:id",
  verifyToken,
  requireAdmin,
  upload.single("image"),
  productController.updateProduct
);
router.delete(
  "/:id",
  verifyToken,
  requireAdmin,
  productController.deleteProduct
);

module.exports = router;






