const Booking = require("../models/Booking");

// Lấy danh sách booking cho nhân viên
const getStaffBookings = async (req, res) => {
  try {
    const User = require("../models/User");
    // Chỉ lấy booking assigned cho nhân viên đang đăng nhập
    const bookings = await Booking.findAll({
      where: {
        staff_id: req.user.id,
      },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
      ],
      order: [["appointment_date", "ASC"], ["appointment_time", "ASC"]],
    });

    // Chuyển dữ liệu ra format frontend cần
    const result = bookings.map((b) => ({
      id: b.id,
      service: b.service,
      car_brand: b.car_brand,
      car_model: b.car_model,
      appointment_date: b.appointment_date,
      appointment_time: b.appointment_time,
      status: b.status,
      user_id: b.user_id,
      full_name: b.full_name,
      phone: b.phone,
      email: b.email,
      address: b.address,
      notes: b.notes,
      user_name: b.user?.name || b.full_name,
      user_email: b.user?.email || b.email,
      user_phone: b.user?.phone || b.phone,
      created_at: b.created_at,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Hoàn thành booking
const completeBooking = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking)
      return res.status(404).json({ error: "Booking không tồn tại" });

    // Kiểm tra quyền nhân viên
    if (booking.staff_id !== req.user.id)
      return res
        .status(403)
        .json({ error: "Bạn không có quyền hoàn thành booking này" });

    // Chỉ set completed nếu đang confirmed
    if (booking.status !== "confirmed")
      return res
        .status(400)
        .json({ error: "Chỉ booking đã xác nhận mới có thể hoàn thành" });

    booking.status = "completed";
    await booking.save();

    // Trả về dữ liệu đã cập nhật với thông tin user
    const User = require("../models/User");
    await booking.reload({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
        { model: User, as: "staff", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({ 
      message: "Đã đánh dấu hoàn thành dịch vụ",
      data: booking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

module.exports = { getStaffBookings, completeBooking };
