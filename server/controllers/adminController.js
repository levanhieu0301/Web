const adminService = require("../services/adminService");

const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsersService();
    return res.status(200).json(users);
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    return res.status(500).json({ error: "Lỗi tải danh sách người dùng" });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await adminService.getAllBookingsService();
    return res.status(200).json(bookings);
  } catch (err) {
    console.error("Error in getAllBookings:", err);
    return res.status(500).json({ error: "Lỗi tải danh sách lịch đặt" });
  }
};

const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedBooking = await adminService.updateBookingStatusService(
      id,
      status
    );
    if (!updatedBooking)
      return res.status(404).json({ error: "Không tìm thấy lịch đặt" });

    return res.status(200).json({
      message: "Cập nhật trạng thái thành công",
      data: updatedBooking,
    });
  } catch (err) {
    if (err.message === "Trạng thái không hợp lệ") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Error in updateBookingStatus:", err);
    return res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
  }
};

const assignStaffToBooking = async (req, res) => {
  const { id } = req.params; // booking id
  const { staffId } = req.body;

  try {
    const updatedBooking = await adminService.assignStaffService(id, staffId);
    if (!updatedBooking)
      return res.status(404).json({ error: "Không tìm thấy booking" });

    return res.status(200).json({
      message: "Gán nhân viên thành công",
      data: updatedBooking,
    });
  } catch (err) {
    console.error("Error in assignStaffToBooking:", err);
    return res.status(500).json({ error: err.message || "Lỗi gán nhân viên" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await adminService.getAllEmployeesService();
    return res.status(200).json(employees);
  } catch (err) {
    console.error("Error in getAllEmployees:", err);
    return res.status(500).json({ error: "Lỗi tải danh sách nhân viên" });
  }
};

const createEmployee = async (req, res) => {
  try {
    const newEmployee = await adminService.createEmployeeService(req.body);
    return res.status(201).json({
      message: "Tạo nhân viên thành công",
      data: newEmployee,
    });
  } catch (err) {
    console.error("Error in createEmployee:", err);
    if (err.message === "Email đã được sử dụng") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Lỗi tạo nhân viên" });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteEmployeeService(id);
    return res.status(200).json({ message: "Đã xóa nhân viên thành công" });
  } catch (err) {
    console.error("Error in deleteEmployee:", err);
    return res.status(400).json({ error: err.message || "Lỗi xóa nhân viên" });
  }
};

module.exports = {
  getAllUsers,
  getAllBookings,
  updateBookingStatus,
  assignStaffToBooking,
  getAllEmployees,
  createEmployee,
  deleteEmployee,
};
