// js/booking.js - HOÀN CHỈNH 100% - ĐÃ SỬA LỖI HIỂN THỊ KHI ĐĂNG NHẬP
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const token = localStorage.getItem("token");

  // === MENU MOBILE ===
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu"); 
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () =>
      navMenu.classList.toggle("active")
    );
    navMenu
      .querySelectorAll("a")
      .forEach((link) =>
        link.addEventListener("click", () => navMenu.classList.remove("active"))
      );
  }
  // === CẬP NHẬT MENU KHI ĐĂNG NHẬP ===
  if (user && token) {
    // Ẩn "Đăng nhập", hiện "Hồ sơ"
    const loginLink = document.getElementById("loginLink");
    const profileLink = document.getElementById("profileLink");
    if (loginLink) loginLink.style.display = "none";
    if (profileLink) {
      profileLink.style.display = "block";
      profileLink.textContent = user.name || "Hồ sơ";
    }

    // HIỆN FORM ĐẶT LỊCH + TỰ ĐỘNG ĐIỀN
    document.getElementById("bookingSection").style.display = "block";
    document.getElementById("loginPrompt").style.display = "none";
    autoFillUserInfo(user);
  } else {
    // CHƯA ĐĂNG NHẬP
    document.getElementById("bookingSection").style.display = "none";
    document.getElementById("loginPrompt").style.display = "block";
  }

  // === XỬ LÝ FORM ===
  const form = document.getElementById("bookingForm");
  const successMsg = document.getElementById("bookingSuccess");

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      clearErrors();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      let valid = true;
      if (!data.fullName) {
        showError("fullNameError", "Vui lòng nhập họ tên");
        valid = false;
      }
      if (!/^(03|05|07|08|09)\d{8}$/.test(data.phone)) {
        showError("phoneError", "SĐT không hợp lệ");
        valid = false;
      }
      if (!data.email) {
        showError("emailError", "Vui lòng nhập email");
        valid = false;
      }
      if (!data.address) {
        showError("addressError", "Vui lòng nhập địa chỉ");
        valid = false;
      }
      if (!data.serviceType) {
        showError("serviceTypeError", "Chọn dịch vụ");
        valid = false;
      }
      if (!data.carType) {
        showError("carTypeError", "Chọn loại xe");
        valid = false;
      }
      if (!data.appointmentDate) {
        showError("appointmentDateError", "Chọn ngày");
        valid = false;
      }
      if (!data.appointmentTime) {
        showError("appointmentTimeError", "Chọn giờ");
        valid = false;
      }

      if (!valid) return;

      const payload = {
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        service: data.serviceType,
        car_brand: data.carBrand || null,
        car_model: data.carType,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        notes: data.notes || null,
      };

      try {
        const res = await fetch(`${API_URL}/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (res.ok) {
          form.style.display = "none";
          successMsg.style.display = "block";
        } else {
          alert(json.error || "Đặt lịch thất bại");
        }
      } catch (err) {
        alert("Lỗi kết nối server");
        console.error(err);
      }
    });
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    document
      .querySelectorAll(".error-message")
      .forEach((el) => (el.textContent = ""));
  }

  function autoFillUserInfo(user) {
    if (document.getElementById("fullName") && user.name)
      document.getElementById("fullName").value = user.name;
    if (document.getElementById("phone") && user.phone)
      document.getElementById("phone").value = user.phone;
    if (document.getElementById("email") && user.email)
      document.getElementById("email").value = user.email;
  }
});
