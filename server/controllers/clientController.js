const client = (req, res) => {
  res.json({
    message: "AutoCare Backend API - Đang hoạt động!",
    endpoints: {
      auth: "/api/auth",
      bookings: "/api/bookings",
      admin: "/api/admin",
      users: "/api/users",
    },
  });
}


module.exports = {
  client,
};