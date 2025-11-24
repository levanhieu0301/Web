const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Lấy thông tin profile user theo ID
 * @param {number} userId
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "phone", "role"],
  });
  return user;
};

/**
 * Cập nhật thông tin user
 * @param {number} userId
 * @param {object} data - { name, phone, password }
 */
const updateUserProfile = async (userId, data) => {
  const { name, phone, password } = data;

  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  const updateData = { name, phone };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await user.update(updateData);

  return user;
};

module.exports = {
  getUserById,
  updateUserProfile,
};