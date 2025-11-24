const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  // =================== Tab chuyển đổi ===================
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".auth-tab-content")
        .forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab + "Tab").classList.add("active");
    });
  });

  // =================== Hiển thị/ẩn mật khẩu ===================
  const showRegister = document.getElementById("showRegisterPassword");
  const registerPwd = document.getElementById("registerPassword");
  const registerConfirm = document.getElementById("registerPasswordConfirm");
  if (showRegister && registerPwd && registerConfirm) {
    showRegister.addEventListener("change", function () {
      registerPwd.type = this.checked ? "text" : "password";
      registerConfirm.type = this.checked ? "text" : "password";
    });
  }

  const showLogin = document.getElementById("showLoginPassword");
  const loginPwd = document.getElementById("loginPassword");
  if (showLogin && loginPwd) {
    showLogin.addEventListener("change", function () {
      loginPwd.type = this.checked ? "text" : "password";
    });
  }

  // =================== Gửi OTP ===================
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async () => {
      const email = document.getElementById("registerEmail").value.trim();
      if (!email) return alert("Vui lòng nhập email!");
      try {
        const res = await fetch(`${API_URL}/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        alert(data.message || "OTP đã gửi!");
      } catch (err) {
        console.error(err);
        alert("Không gửi được OTP, thử lại!");
      }
    });
  }

  // =================== Form submit ===================
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
});

// =================== Đăng ký ===================
async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    phone: formData.get("phone").trim(),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    otp: document.getElementById("registerOtp").value.trim(),
  };

  if (!data.name || !data.email || !data.password || !data.otp) {
    return alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
  }

  if (data.password !== data.confirmPassword) {
    return alert("Mật khẩu không khớp!");
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Đăng ký thất bại");

    // Hiển thị thông báo thành công
    document.getElementById("registerSuccess").style.display = "block";

    // Chuyển sang tab login sau 1.5s
    setTimeout(() => {
      document.querySelector('[data-tab="login"]').click();
      registerForm.reset();
      document.getElementById("registerSuccess").style.display = "none";
    }, 1500);
  } catch (err) {
    console.error(err);
    alert("Không kết nối được server!");
  }
}

// =================== Đăng nhập ===================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) return alert("Vui lòng nhập email và mật khẩu!");

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "Đăng nhập thất bại");

    localStorage.setItem("token", json.token);
    localStorage.setItem("currentUser", JSON.stringify(json.user));

    // Phân quyền điều hướng
    switch (json.user.role) {
      case "admin":
        window.location.href = "admin.html";
        break;
      case "staff":
        window.location.href = "staff.html"; // giao diện nhân viên
        break;
      default:
        window.location.href = "profile.html"; // user bình thường
    }
  } catch (err) {
    console.error(err);
    alert("Không kết nối được server!");
  }
}
