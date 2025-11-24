const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/profile", getUserProfile);

router.put("/profile", updateUserProfile);

module.exports = router;