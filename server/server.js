const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./models");

const indexRoutes = require("./routes/index");
const clientRoutes = require("./routes/client");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products/images", express.static(path.join(__dirname, "HinhAnhSanPham")));

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Đã kết nối và đồng bộ hóa CSDL thành công.");
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối CSDL:", err.message);
  });

app.use("/", clientRoutes);

app.use("/api", indexRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend chạy tại: http://localhost:${PORT}`);
});