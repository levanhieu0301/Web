const API_URL = "http://localhost:5000/api/staff";

document.addEventListener("DOMContentLoaded", async () => {
  const staff = JSON.parse(localStorage.getItem("currentUser"));
  const token = localStorage.getItem("token");

  if (!staff || !token || staff.role !== "staff") {
    alert("Chỉ nhân viên mới được phép truy cập trang này!");
    window.location.href = "login.html";
    return;
  }

  // Hiển thị thông tin nhân viên
  document.getElementById("staffName").textContent = staff.name;
  document.getElementById("staffEmail").textContent = staff.email;

  const bookingList = document.getElementById("bookingList");
  const noBooking = document.getElementById("noBooking");

  // Load danh sách booking của nhân viên
  async function loadBookings() {
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Lỗi tải dữ liệu");

      const resData = await res.json();
      const bookings = resData.data || [];

      bookingList.innerHTML = "";

      if (bookings.length === 0) {
        noBooking.style.display = "block";
        return;
      } else {
        noBooking.style.display = "none";
      }

      bookings.forEach((b) => {
        const item = document.createElement("div");
        item.className = "booking-item";

        const statusTextMap = {
          pending: "Đang chờ",
          confirmed: "Đã duyệt",
          cancelled: "Đã hủy",
          completed: "Hoàn thành",
        };
        const statusClassMap = {
          pending: "status-pending",
          confirmed: "status-confirmed",
          cancelled: "status-cancelled",
          completed: "status-completed",
        };

        const statusClass = statusClassMap[b.status] || "status-pending";
        const statusText = statusTextMap[b.status] || "Không rõ";

        item.innerHTML = `
          <div class="booking-header">
            <div class="booking-service">${b.service || "N/A"}</div>
            <span class="booking-status ${statusClass}">${statusText}</span>
          </div>
          <div class="booking-details">
            <div class="detail-row">
              <strong>Khách hàng:</strong> ${b.full_name || b.user_name || "N/A"}
            </div>
            <div class="detail-row">
              <strong>Điện thoại:</strong> ${b.phone || b.user_phone || "N/A"}
            </div>
            <div class="detail-row">
              <strong>Email:</strong> ${b.email || b.user_email || "N/A"}
            </div>
            ${b.car_brand || b.car_model ? `
            <div class="detail-row">
              <strong>Xe:</strong> ${b.car_brand || ""} ${b.car_model || ""}
            </div>
            ` : ""}
            <div class="detail-row">
              <strong>Địa chỉ:</strong> ${b.address || "N/A"}
            </div>
            <div class="detail-row">
              <strong>Ngày hẹn:</strong> ${formatDate(b.appointment_date)} lúc ${b.appointment_time || "N/A"}
            </div>
            ${b.notes ? `
            <div class="detail-row">
              <strong>Ghi chú:</strong> ${b.notes}
            </div>
            ` : ""}
          </div>
        `;

        // Nếu booking confirmed, thêm nút đánh dấu hoàn thành
        if (b.status === "confirmed") {
          const completeBtn = document.createElement("button");
          completeBtn.className = "btn-complete";
          completeBtn.textContent = "Hoàn thành dịch vụ";
          completeBtn.dataset.id = b.id;
          item.appendChild(completeBtn);
        }

        bookingList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      noBooking.textContent = "Lỗi tải booking.";
      noBooking.style.display = "block";
    }
  }

  await loadBookings();

  // Xử lý click đánh dấu completed
  bookingList.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-complete")) return;

    const id = e.target.dataset.id;
    if (!confirm("Xác nhận dịch vụ đã hoàn thành?")) return;

    try {
      const res = await fetch(`${API_URL}/bookings/${id}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cập nhật thất bại");
      }

      alert("Đã đánh dấu hoàn thành!");
      await loadBookings();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái.");
      console.error(err);
    }
  });

  // Đăng xuất
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return "Không xác định";
    }
  }
});
