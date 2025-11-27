const db = require("../models");
const Coupon = db.Coupon;

/**
 * Tạo mã giảm giá mới
 * Dữ liệu đầu vào được chuẩn hoá từ controller/frontend:
 * {
 *   code,
 *   type,               // 'percentage' | 'fixed'
 *   value,
 *   min_order_value,
 *   start_date,
 *   end_date,
 *   max_usage,
 *   description
 * }
 */
const createCoupon = async (rawData) => {
  const data = {
    code: rawData.code?.toUpperCase(),
    type: rawData.type,
    value: rawData.value,
    min_order_value: rawData.min_order_value ?? 0,
    start_date: rawData.start_date,
    end_date: rawData.end_date,
    max_usage: rawData.max_usage ?? null,
    description: rawData.description || null,
  };

  const existing = await Coupon.findOne({ where: { code: data.code } });
  if (existing) {
    throw new Error("Mã giảm giá này đã tồn tại.");
  }

  return await Coupon.create(data);
};

/**
 * Lấy danh sách coupon
 * @param {boolean|null} isActive - true: chỉ active, false: chỉ inactive, null: tất cả
 */
const getAllCoupons = async (isActive = null) => {
  const whereClause = {};
  if (isActive !== null) {
    whereClause.is_active = isActive;
  }
  return await Coupon.findAll({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });
};

/**
 * Validate coupon và tính toán số tiền giảm
 * @param {string} code
 * @param {number|string} orderValue - tổng tiền đơn hàng trước giảm
 */
const validateAndCalculate = async (code, orderValue) => {
  const coupon = await Coupon.findOne({
    where: {
      code: code.toUpperCase(),
      is_active: true,
    },
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

  const originalPrice = parseFloat(orderValue);
  if (originalPrice < parseFloat(coupon.min_order_value)) {
    const minVal = parseFloat(coupon.min_order_value).toLocaleString("vi-VN");
    throw new Error(
      `Đơn hàng phải từ ${minVal} VNĐ để áp dụng mã này.`
    );
  }

  let discountAmount = 0;

  if (coupon.type === "percentage") {
    discountAmount = originalPrice * (parseFloat(coupon.value) / 100);
  } else {
    discountAmount = parseFloat(coupon.value);
  }

  if (discountAmount > originalPrice) {
    discountAmount = originalPrice;
  }

  const finalPrice = originalPrice - discountAmount;

  return {
    coupon_id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discount_amount: discountAmount,
    final_price: finalPrice,
  };
};

/**
 * Vô hiệu hoá (hoặc xoá mềm) một coupon
 */
const deactivateCoupon = async (id) => {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    throw new Error("Không tìm thấy mã giảm giá.");
  }
  coupon.is_active = false;
  await coupon.save();
  return coupon;
};

module.exports = {
  createCoupon,
  getAllCoupons,
  validateAndCalculate,
  deactivateCoupon,
};