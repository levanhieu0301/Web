const bookingService = require("../services/bookingService");

const createBooking = async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      user_id: req.user.id
    };

    const newBooking = await bookingService.createBooking(bookingData);
    return res.status(201).json({ message: "Created", data: newBooking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getAllBookings();
    return res.status(200).json({ data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.findBookingById(req.params.id);
    return res.status(200).json({ data: booking });
  } catch (error) {
    const status = error.message === "Booking not found" ? 404 : 500;
    return res.status(status).json({ message: error.message });
  }
};

const getUserHistory = async (req, res) => {
  const { userId } = req.params;

  if (parseInt(userId) !== req.user.id) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }

  try {
    const bookings = await bookingService.getBookingsByUserId(userId);
    return res.status(200).json({ data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelByUser = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    await bookingService.cancelBookingByUser(bookingId, userId);
    return res.status(200).json({ message: "Hủy lịch thành công" });
  } catch (error) {
    if (error.message.includes("không có quyền") || error.message.includes("trạng thái")) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedBooking = await bookingService.updateBookingStatus(req.params.id, status);

    if (!updatedBooking) return res.status(404).json({ message: "Booking not found" });

    return res.status(200).json({ message: "Status changed", data: updatedBooking });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  getUserHistory,
  cancelByUser,
  changeStatus
};