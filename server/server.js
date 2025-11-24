const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/connect_db");
const indexRoutes = require("./routes/index");
const clientRoutes = require("./routes/client");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ file ảnh sản phẩm
app.use("/api/products/images", express.static(path.join(__dirname, "HinhAnhSanPham")));

// Kết nối database
connectDB()

// Trang chủ API
app.use("/", clientRoutes);

// Routes
app.use("/api", indexRoutes);
 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend chạy tại: http://localhost:${PORT}`);
});
