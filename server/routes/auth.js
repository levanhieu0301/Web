const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");  // MODEL SEQUELIZE

require("dotenv").config();

const { sendOTP } = require("../services/emailService");

// =================== Lưu OTP + hạn chế gửi ===================
const otpStore = {};
const OTP_EXPIRE = 5 * 60 * 1000; // 5 phút

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function canSendOtp(email) {
  const today = todayStr();

  if (!otpStore[email]) {
    otpStore[email] = {
      dailyCount: 0,
      lastDay: today,
      lastSent: 0,
    };
  }

  if (otpStore[email].lastDay !== today) {
    otpStore[email].dailyCount = 0;
    otpStore[email].lastDay = today;
  }

  return otpStore[email].dailyCount < 3;
}

function recordOtpSent(email) {
  otpStore[email].dailyCount++;
  otpStore[email].lastDay = todayStr();
  otpStore[email].lastSent = Date.now();
}


// =================== Gửi OTP quên mật khẩu ===================
router.post("/forgot-send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  try {
    const existing = await User.findOne({ where: { email } });
    if (!existing)
      return res.status(400).json({ message: "Email không tồn tại" });

    const NOW = Date.now();

    if (!canSendOtp(email)) {
      return res.status(429).json({
        message: "Bạn đã gửi OTP quá 3 lần trong ngày. Vui lòng thử lại ngày mai.",
      });
    }

    if (otpStore[email].lastSent && NOW - otpStore[email].lastSent < OTP_EXPIRE) {
      const secLeft = Math.ceil((OTP_EXPIRE - (NOW - otpStore[email].lastSent)) / 1000);
      return res.status(429).json({ message: `Vui lòng đợi ${secLeft} giây để gửi lại OTP.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp: otp,
      expires: NOW + OTP_EXPIRE,
      lastSent: NOW,
      dailyCount: (otpStore[email]?.dailyCount || 0) + 1,
      lastDay: todayStr()
    };

    await sendOTP(email, otp);

    res.json({ message: "OTP đã gửi thành công! Hết hạn sau 5 phút." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
});


// =================== Đặt lại mật khẩu ===================
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: "Thiếu thông tin" });

  if (!otpStore[email])
    return res.status(400).json({ message: "OTP không hợp lệ" });

  if (otpStore[email].expires < Date.now()) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP đã hết hạn" });
  }

  if (otpStore[email].otp !== otp)
    return res.status(400).json({ message: "OTP không đúng" });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  try {
    const hashedPass = await bcrypt.hash(newPassword, 10);

    await User.update(
      { password: hashedPass },
      { where: { email } }
    );

    delete otpStore[email];
    res.json({ message: "Đặt lại mật khẩu thành công!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// =================== Gửi OTP đăng ký ===================
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email đã tồn tại" });

    const NOW = Date.now();

    if (!canSendOtp(email)) {
      return res.status(429).json({
        message: "Bạn đã gửi OTP quá 3 lần trong ngày. Vui lòng thử lại ngày mai.",
      });
    }

    if (otpStore[email]?.lastSent && NOW - otpStore[email].lastSent < OTP_EXPIRE) {
      const secLeft = Math.ceil((OTP_EXPIRE - (NOW - otpStore[email].lastSent)) / 1000);
      return res.status(429).json({ message: `Vui lòng đợi ${secLeft} giây để gửi lại OTP.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp: otp,
      expires: NOW + OTP_EXPIRE,
      lastSent: NOW,
      dailyCount: (otpStore[email]?.dailyCount || 0) + 1,
      lastDay: todayStr()
    };

    await sendOTP(email, otp);

    res.json({ message: "OTP đã gửi thành công! Hết hạn sau 5 phút." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
});


// =================== Đăng ký ===================
router.post("/register", async (req, res) => {
  const { name, email, password, phone, otp } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

  if (!otpStore[email] || otpStore[email].expires < Date.now() || otpStore[email].otp !== otp) {
    return res.status(400).json({ message: "OTP không đúng hoặc hết hạn" });
  }

  delete otpStore[email];

  if (password.length < 6)
    return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  try {
    const hashedPass = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPass,
      phone: phone || null,
      role: "user"  
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      userId: user.id,
    });

  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// =================== Đăng nhập ===================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Thiếu thông tin đăng nhập" });

  try {
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role || "user",
      },
    });

  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;


// // routers/auth.js
// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const db = require("../config/connect_db");
// require("dotenv").config();

// const { sendOTP } = require("../services/emailService");

// // =================== Lưu OTP + hạn chế gửi ===================
// /**
//  * otpStore[email] = {
//  *   otp: '123456',
//  *   expires: 123456789,
//  *   lastSent: 123456789,
//  *   dailyCount: 1,
//  *   lastDay: '2025-11-17'
//  * }
//  */
// const otpStore = {};
// const OTP_EXPIRE = 5 * 60 * 1000; // 5 phút

// // ===== Helper: kiểm tra ngày =====
// function todayStr() {
//   return new Date().toISOString().split("T")[0];
// }

// // ===== Helper: kiểm tra có được phép gửi OTP không =====
// function canSendOtp(email) {
//   const today = todayStr();

//   if (!otpStore[email]) {
//     otpStore[email] = {
//       dailyCount: 0,
//       lastDay: today,
//       lastSent: 0,
//     };
//   }

//   // Reset khi sang ngày mới
//   if (otpStore[email].lastDay !== today) {
//     otpStore[email].dailyCount = 0;
//     otpStore[email].lastDay = today;
//   }

//   // Giới hạn 3 lần/ngày
//   if (otpStore[email].dailyCount >= 3) return false;

//   return true;
// }

// // ===== Helper: ghi nhận 1 lần gửi OTP =====
// function recordOtpSent(email) {
//   otpStore[email].dailyCount++;
//   otpStore[email].lastDay = todayStr();
//   otpStore[email].lastSent = Date.now();
// }

// // =================== Gửi OTP quên mật khẩu ===================
// router.post("/forgot-send-otp", async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

//   try {
//     const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (existing.length === 0)
//       return res.status(400).json({ message: "Email không tồn tại" });

//     const NOW = Date.now();

//     // 1) Kiểm tra 3 lần / ngày
//     if (!canSendOtp(email)) {
//       return res.status(429).json({
//         message:
//           "Bạn đã gửi OTP quá 3 lần trong ngày. Vui lòng thử lại ngày mai.",
//       });
//     }

//     // 2) Kiểm tra cách nhau 5 phút
//     if (
//       otpStore[email].lastSent &&
//       NOW - otpStore[email].lastSent < OTP_EXPIRE
//     ) {
//       const secLeft = Math.ceil(
//         (OTP_EXPIRE - (NOW - otpStore[email].lastSent)) / 1000
//       );
//       return res.status(429).json({
//         message: `Vui lòng đợi ${secLeft} giây để gửi lại OTP.`,
//       });
//     }

//     // 3) Tạo OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     otpStore[email].otp = otp;
//     otpStore[email].expires = NOW + OTP_EXPIRE;

//     recordOtpSent(email);

//     await sendOTP(email, otp);
//     res.json({ message: "OTP đã gửi thành công! Hết hạn sau 5 phút." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Gửi OTP thất bại" });
//   }
// });

// // =================== Đặt lại mật khẩu ===================
// router.post("/reset-password", async (req, res) => {
//   const { email, otp, newPassword } = req.body;
//   if (!email || !otp || !newPassword)
//     return res.status(400).json({ message: "Thiếu thông tin" });

//   if (!otpStore[email])
//     return res.status(400).json({ message: "OTP không hợp lệ" });

//   if (otpStore[email].expires < Date.now()) {
//     delete otpStore[email];
//     return res.status(400).json({ message: "OTP đã hết hạn" });
//   }

//   if (otpStore[email].otp !== otp)
//     return res.status(400).json({ message: "OTP không đúng" });

//   if (newPassword.length < 6)
//     return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

//   try {
//     const hashedPass = await bcrypt.hash(newPassword, 10);
//     await db.query("UPDATE users SET password = ? WHERE email = ?", [
//       hashedPass,
//       email,
//     ]);

//     delete otpStore[email];
//     res.json({ message: "Đặt lại mật khẩu thành công!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// });

// // =================== Gửi OTP đăng ký ===================
// router.post("/send-otp", async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

//   try {
//     const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (existing.length > 0)
//       return res.status(400).json({ message: "Email đã tồn tại" });

//     const NOW = Date.now();

//     // 1) Kiểm tra 3 lần/ngày
//     if (!canSendOtp(email)) {
//       return res.status(429).json({
//         message:
//           "Bạn đã gửi OTP quá 3 lần trong ngày. Vui lòng thử lại ngày mai.",
//       });
//     }

//     // 2) Kiểm tra cách nhau 5 phút
//     if (
//       otpStore[email].lastSent &&
//       NOW - otpStore[email].lastSent < OTP_EXPIRE
//     ) {
//       const secLeft = Math.ceil(
//         (OTP_EXPIRE - (NOW - otpStore[email].lastSent)) / 1000
//       );
//       return res.status(429).json({
//         message: `Vui lòng đợi ${secLeft} giây để gửi lại OTP.`,
//       });
//     }

//     // 3) Tạo OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     otpStore[email].otp = otp;
//     otpStore[email].expires = NOW + OTP_EXPIRE;

//     recordOtpSent(email);

//     await sendOTP(email, otp);

//     res.json({ message: "OTP đã gửi thành công! Hết hạn sau 5 phút." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Gửi OTP thất bại" });
//   }
// });

// // =================== Đăng ký ===================
// router.post("/register", async (req, res) => {
//   const { name, email, password, phone, otp } = req.body;
//   if (!name || !email || !password)
//     return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

//   if (
//     !otpStore[email] ||
//     otpStore[email].expires < Date.now() ||
//     otpStore[email].otp !== otp
//   ) {
//     return res.status(400).json({ message: "OTP không đúng hoặc hết hạn" });
//   }

//   delete otpStore[email];

//   if (password.length < 6)
//     return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

//   try {
//     const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (existing.length > 0)
//       return res.status(400).json({ message: "Email đã tồn tại" });

//     const hashedPass = await bcrypt.hash(password, 10);
//     const [result] = await db.query(
//       "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')",
//       [name, email, hashedPass, phone || null]
//     );

//     res
//       .status(201)
//       .json({ message: "Đăng ký thành công", userId: result.insertId });
//   } catch (err) {
//     console.error("Lỗi đăng ký:", err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// });

// // =================== Đăng nhập ===================
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password)
//     return res.status(400).json({ message: "Thiếu thông tin đăng nhập" });

//   try {
//     const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if (rows.length === 0)
//       return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

//     const user = rows[0];
//     const validPass = await bcrypt.compare(password, user.password);
//     if (!validPass)
//       return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         role: user.role || "user",
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone || "",
//         role: user.role || "user",
//       },
//     });
//   } catch (err) {
//     console.error("Lỗi đăng nhập:", err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// });

// module.exports = router;
