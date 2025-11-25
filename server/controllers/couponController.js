const couponService = require("../services/couponService");

const createCoupon = async (req, res) => {
  try {
    const newCoupon = await couponService.createCoupon(req.body);
    res.status(201).json({
      message: "Tạo mã giảm giá thành công",
      data: newCoupon
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const isActive = req.query.active === 'true' ? true : null;
    const coupons = await couponService.getAllCoupons(isActive);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server khi tải danh sách mã." });
  }
};

const checkCoupon = async (req, res) => {
  const { code, order_value } = req.body;

  if (!code || !order_value) {
    return res.status(400).json({ error: "Chưa mã giảm giá hoặc giá trị đơn hàng không đáp ứng!." });
  }

  try {
    const result = await couponService.validateAndCalculate(code, order_value);
    res.json({
      message: "Áp dụng mã thành công!",
      data: result
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  checkCoupon
};