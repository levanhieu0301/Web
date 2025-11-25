const db = require("../models");
const Discount = db.Discount;
const { Op } = require("sequelize");

const createCoupon = async (data) => {
  const existing = await Discount.findOne({ where: { code: data.code } });
  if (existing) {
    throw new Error("Mã giảm giá này đã tồn tại.");
  }

  return await Discount.create(data);
};

const getAllCoupons = async (isActive = null) => {
  const whereClause = {};
  if (isActive !== null) {
    whereClause.is_active = isActive;
  }
  return await Discount.findAll({ where: whereClause, order: [['created_at', 'DESC']] });
};

const validateAndCalculate = async (code, orderValue) => {
  const coupon = await Discount.findOne({
    where: {
      code: code,
      is_active: true
    }
  });

  if (!coupon) {
    throw new Error("Mã giảm giá không tồn tại hoặc đã bị khóa.");
  }

  const now = new Date();
  if (now < new Date(coupon.start_date)) {
    throw new Error("Mã giảm giá chưa đến đợt áp dụng.");
  }
  if (now > new Date(coupon.end_date)) {
    throw new Error("Mã giảm giá đã hết hạn.");
  }

  if (coupon.max_usage !== null && coupon.usage_count >= coupon.max_usage) {
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  }

  if (parseFloat(orderValue) < parseFloat(coupon.min_order_value)) {
    const minVal = parseFloat(coupon.min_order_value).toLocaleString('vi-VN');
    throw new Error(`Đơn hàng phải từ ${minVal} VNĐ để áp dụng mã này.`);
  }

  let discountAmount = 0;
  const originalPrice = parseFloat(orderValue);

  if (coupon.type === 'percentage') {
    discountAmount = originalPrice * (parseFloat(coupon.value) / 100);
  } else {
    discountAmount = parseFloat(coupon.value);
  }

  if (discountAmount > originalPrice) {
    discountAmount = originalPrice;
  }

  return {
    coupon_id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discount_amount: discountAmount,
    final_price: originalPrice - discountAmount
  };
};

module.exports = {
  createCoupon,
  getAllCoupons,
  validateAndCalculate
};