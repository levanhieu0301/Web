// client/js/forgot-password.js
document.addEventListener("DOMContentLoaded", () => {
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const otpSection = document.getElementById("otpSection");
  const forgotForm = document.getElementById("forgotPasswordForm");

  const forgotEmailInput = document.getElementById("forgotEmail");
  const otpInput = document.getElementById("otpInput");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const showPasswordCheckbox = document.getElementById("showPassword");
  showPasswordCheckbox.addEventListener("change", () => {
    newPasswordInput.type = showPasswordCheckbox.checked ? "text" : "password";
    confirmPasswordInput.type = showPasswordCheckbox.checked
      ? "text"
      : "password";
  });

  // ================= Gửi OTP =================
  sendOtpBtn.addEventListener("click", async () => {
    const email = forgotEmailInput.value.trim();
    if (!email) {
      document.getElementById("forgotEmailError").textContent =
        "Vui lòng nhập email";
      return;
    }
    document.getElementById("forgotEmailError").textContent = "";

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "OTP đã gửi thành công!");
        otpSection.style.display = "flex";
        sendOtpBtn.style.display = "none";
      } else {
        // ======= THÊM PHẦN XỬ LÝ LIMIT OTP =======
        if (res.status === 429) {
          alert(data.message); // thông báo limit từ server
        }

        document.getElementById("forgotEmailError").textContent =
          data.message || "Gửi OTP thất bại";
      }
    } catch (err) {
      console.error(err);
      alert("Gửi OTP thất bại. Kiểm tra kết nối server.");
    }
  });

  // ================= Đặt lại mật khẩu =================
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = forgotEmailInput.value.trim();
    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    let error = false;

    if (!otp) {
      document.getElementById("otpError").textContent = "Vui lòng nhập OTP";
      error = true;
    } else document.getElementById("otpError").textContent = "";

    if (!newPassword) {
      document.getElementById("newPasswordError").textContent =
        "Vui lòng nhập mật khẩu mới";
      error = true;
    } else document.getElementById("newPasswordError").textContent = "";

    if (newPassword !== confirmPassword) {
      document.getElementById("confirmPasswordError").textContent =
        "Mật khẩu không khớp";
      error = true;
    } else document.getElementById("confirmPasswordError").textContent = "";

    if (error) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        document.getElementById("forgotSuccess").style.display = "block";
        otpSection.style.display = "none";
      } else {
        alert(data.message || "OTP hoặc email không hợp lệ");
      }
    } catch (err) {
      console.error(err);
      alert("Đặt lại mật khẩu thất bại. Kiểm tra kết nối server.");
    }
  });
});
