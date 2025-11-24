const Booking = require("../models/Booking");
const User = require("../models/User");

const createBooking = async (data) => {
  const newBooking = await Booking.create({
    user_id: data.user_id,
    full_name: data.full_name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    service: data.service,
    car_brand: data.car_brand,
    car_model: data.car_model,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    notes: data.notes,
    status: "pending"
  });
  return newBooking;
};

const getAllBookings = async () => {
  const bookings = await Booking.findAll({
    include: [{
      model: User,
      as: "user",
      attributes: ["name", "email"]
    }],
    order: [['created_at', 'DESC']]
  });
  return bookings;
};

const getBookingsByUserId = async (userId) => {
  const bookings = await Booking.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });
  return bookings;
};

const findBookingById = async (id) => {
  const booking = await Booking.findByPk(id);
  if (!booking) {
    throw new Error("Booking not found");
  }
  return booking;
};

const cancelBookingByUser = async (bookingId, userId) => {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    throw new Error("Lịch không tồn tại.");
  }

  if (booking.user_id !== userId) {
    throw new Error("Bạn không có quyền hủy lịch này.");
  }

  if (booking.status !== "pending") {
    throw new Error("Chỉ có thể hủy lịch đang chờ xử lý.");
  }

  booking.status = "cancelled";
  await booking.save();
  return booking;
};

const updateBookingStatus = async (id, status) => {
  const validStatuses = ["pending", "confirmed", "cancelled", "completed"];

  if (!validStatuses.includes(status)) {
    throw new Error("Trạng thái không hợp lệ.");
  }

  const booking = await Booking.findByPk(id);
  if (!booking) throw new Error("Booking not found");

  booking.status = status;
  await booking.save();
  return booking;
};

const updateBookingInfo = async (id, updateData) => {
  const booking = await Booking.findByPk(id);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== "pending") {
    throw new Error("Cannot update booking that is already processed");
  }

  // Cập nhật các trường cho phép
  Object.assign(booking, updateData);

  await booking.save();
  return booking;
};

const deleteBooking = async (id) => {
  const booking = await Booking.findByPk(id);
  if (!booking) throw new Error("Booking not found");

  await booking.destroy();
  return { message: "Booking deleted successfully" };
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByUserId,
  findBookingById,
  cancelBookingByUser,
  updateBookingStatus,
  updateBookingInfo,
  deleteBooking
};