// server/services/adminService.js
const User = require("../models/User");
const Booking = require("../models/Booking");
const db = require("../models"); // <--- THÊM DÒNG NÀY

// Lấy tất cả người dùng
const getAllUsersService = async () => {
  return await User.findAll({
    attributes: ["id", "name", "email", "phone", "role", "created_at"],
  });
};

// Lấy tất cả booking (bao gồm user + staff) để Admin quản lý
const getAllBookingsService = async () => {
  try {
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.User,
          as: "user", // <--- BẮT BUỘC PHẢI CÓ 'as' NÀY (để lấy thông tin khách đặt)
          attributes: ["id", "name", "phone", "email"]
        },
        {
          model: db.User,
          as: "assigned_staff", // <--- Thêm cái này nếu muốn lấy cả nhân viên được phân công
          attributes: ["id", "name"],
          through: { attributes: [] } // Bỏ qua các trường bảng phụ nếu không cần
        }
      ],
      order: [["created_at", "DESC"]]
    });
    return bookings;
  } catch (error) {
    throw error;
  }
};
// const getAllBookingsService = async () => {
//   const bookings = await Booking.findAll({
//     include: [
//       { model: User, as: "user", attributes: ["id", "name", "email"] },
//       { model: User, as: "staff", attributes: ["id", "name", "email"] },
//     ],
//     order: [["created_at", "DESC"]],
//   });

//   // map lại dữ liệu để frontend dễ dùng
//   return bookings.map((b) => ({
//     id: b.id,
//     service: b.service,
//     car_brand: b.car_brand,
//     car_model: b.car_model,
//     appointment_date: b.appointment_date,
//     appointment_time: b.appointment_time,
//     status: b.status,
//     user_name: b.user?.name || "",
//     full_name: b.full_name || b.user?.name || "",
//     phone: b.phone,
//     email: b.email,
//     address: b.address,
//     notes: b.notes,
//     user_id: b.user_id,
//     staff_id: b.staff?.id || null,
//     staff_name: b.staff?.name || "—",
//     created_at: b.created_at,
//   }));
// };

// Cập nhật trạng thái booking
const updateBookingStatusService = async (id, status) => {
  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  const normalizedStatus = status.toLowerCase();

  if (!validStatuses.includes(normalizedStatus)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  const booking = await Booking.findByPk(id);
  if (!booking) return null;

  booking.status = normalizedStatus;
  await booking.save();
  return booking;
};

// Gán nhân viên vào booking
const assignStaffService = async (bookingId, staffId) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) return null;

  const staff = await User.findByPk(staffId);
  if (!staff || staff.role !== "staff")
    throw new Error("Nhân viên không tồn tại");

  booking.staff_id = staffId;
  await booking.save();

  return {
    ...booking.toJSON(),
    staff_name: staff.name,
  };
};

// Lấy danh sách nhân viên
const getAllEmployeesService = async () => {
  const employees = await User.findAll({
    where: { role: "staff" },
    attributes: [
      "id",
      "name",
      "email",
      "phone",
      "role",
      "created_at",
    ],
  });
  
  // Map để thêm các trường mặc định nếu cần
  return employees.map(emp => ({
    ...emp.toJSON(),
    position: "Nhân viên", // Mặc định vì không có trong model
    status: "Đang làm việc", // Mặc định vì không có trong model
    joinDate: emp.created_at,
  }));
};

// Tạo nhân viên mới
const createEmployeeService = async (employeeData) => {
  const bcrypt = require("bcrypt");
  
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ where: { email: employeeData.email } });
  if (existingUser) {
    throw new Error("Email đã được sử dụng");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(employeeData.password, 10);

  // Tạo user với role staff
  const newEmployee = await User.create({
    name: employeeData.name,
    email: employeeData.email,
    phone: employeeData.phone || null,
    password: hashedPassword,
    role: "staff",
  });

  return {
    ...newEmployee.toJSON(),
    position: employeeData.position || "Nhân viên",
    status: employeeData.status || "Đang làm việc",
    joinDate: newEmployee.created_at,
  };
};

// Xóa nhân viên
const deleteEmployeeService = async (employeeId) => {
  const employee = await User.findByPk(employeeId);
  if (!employee) {
    throw new Error("Nhân viên không tồn tại");
  }
  
  if (employee.role !== "staff") {
    throw new Error("Chỉ có thể xóa nhân viên");
  }

  await employee.destroy();
  return { message: "Đã xóa nhân viên thành công" };
};

module.exports = {
  getAllUsersService,
  getAllBookingsService,
  updateBookingStatusService,
  assignStaffService,
  getAllEmployeesService,
  createEmployeeService,
  deleteEmployeeService,
};
