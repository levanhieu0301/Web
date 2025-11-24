// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Không có token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded chứa id, role, email, name
    next();
  } catch {
    return res.status(403).json({ error: "Token không hợp lệ" });
  }
};

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Không có quyền admin" });
  }
  next();
};

// Middleware kiểm tra staff
const requireStaff = (req, res, next) => {
  if (req.user.role !== "staff") {
    return res.status(403).json({ error: "Không có quyền nhân viên" });
  }
  next();
};

// Middleware kiểm tra user (nếu cần)
const requireUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ error: "Không có quyền user" });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireStaff, requireUser };
