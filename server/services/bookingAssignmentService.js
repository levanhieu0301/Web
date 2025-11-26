const db = require("../models");
const Booking = db.Booking;
const User = db.User;
const BookingAssignment = db.BookingAssignment;

/**
 * 1. Gán một nhân viên vào một Booking
 * @param {Object} data - { booking_id, staff_id, task, notes }
 */
const assignStaff = async ({ booking_id, staff_id, task, notes }) => {
  const booking = await Booking.findByPk(booking_id);
  if (!booking) {
    throw new Error("Lịch đặt không tồn tại.");
  }

  const staff = await User.findByPk(staff_id);
  if (!staff) {
    throw new Error("Nhân viên không tồn tại.");
  }

  if (!["staff", "admin"].includes(staff.role)) {
    throw new Error("Người dùng này không phải là nhân viên, không thể phân công.");
  }

  const existingAssignment = await BookingAssignment.findOne({
    where: {
      booking_id: booking_id,
      staff_id: staff_id,
    },
  });

  if (existingAssignment) {
    throw new Error("Nhân viên này đã được phân công vào lịch đặt này rồi.");
  }

  const newAssignment = await BookingAssignment.create({
    booking_id,
    staff_id,
    task: task || "Kỹ thuật chung",
    notes,
  });

  if (booking.status === "pending") {
    await booking.update({ status: "confirmed" });
  }

  return newAssignment;
};

const removeAssignment = async (booking_id, staff_id) => {
  const assignment = await BookingAssignment.findOne({
    where: { booking_id, staff_id }
  });

  if (!assignment) {
    throw new Error("Phân công không tồn tại.");
  }

  await assignment.destroy();
  return { message: "Đã hủy phân công thành công." };
};

const getStaffByBooking = async (booking_id) => {
  const booking = await Booking.findByPk(booking_id, {
    include: [
      {
        model: User,
        as: "assigned_staff",
        attributes: ["id", "name", "phone", "email"],
        through: {
          attributes: ["task", "notes", "assigned_at"],
        },
      },
    ],
  });

  if (!booking) throw new Error("Lịch đặt không tồn tại.");

  return booking.assigned_staff;
};

const getTasksByStaff = async (staff_id) => {
  const staff = await User.findByPk(staff_id, {
    include: [
      {
        model: Booking,
        as: "assigned_tasks",
        attributes: ["id", "car_brand", "car_model", "status", "appointment_date"],
        through: {
          attributes: ["task", "notes", "assigned_at"],
        },
      },
    ],
  });

  if (!staff) throw new Error("Nhân viên không tồn tại.");

  return staff.assigned_tasks;
};

module.exports = {
  assignStaff,
  removeAssignment,
  getStaffByBooking,
  getTasksByStaff
};