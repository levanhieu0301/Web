// js/edit-profile.js
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
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
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

  if (!token || !user.id) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "login.html";
    return;
  }

  // TỰ ĐỘNG ĐIỀN TỪ localStorage
  document.getElementById("editName").value = user.name || "";
  document.getElementById("editEmail").value = user.email || "";
  document.getElementById("editPhone").value = user.phone || "";

  // GỌI API ĐỂ CẬP NHẬT
  const form = document.getElementById("editProfileForm");
  form.addEventListener("submit", handleSubmit);
});

async function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById("editName").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const password = document.getElementById("editPassword").value;
  const confirm = document.getElementById("editPasswordConfirm").value;

  let valid = true;
  if (!name) {
    showError("editNameError", "Nhập họ tên");
    valid = false;
  }
  if (!/^0[3|5|7|8|9]\d{8}$/.test(phone)) {
    showError("editPhoneError", "SĐT không hợp lệ");
    valid = false;
  }
  if (password && password.length < 6) {
    showError("editPasswordError", "Mật khẩu ≥ 6 ký tự");
    valid = false;
  }
  if (password && password !== confirm) {
    showError("editPasswordConfirmError", "Mật khẩu không khớp");
    valid = false;
  }

  if (!valid) return;

  const token = localStorage.getItem("token");
  const body = { name, phone };
  if (password) body.password = password;

  try {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (res.ok) {
      const updated = {
        ...JSON.parse(localStorage.getItem("currentUser")),
        name,
        phone,
      };
      localStorage.setItem("currentUser", JSON.stringify(updated));
      document.getElementById("editSuccess").style.display = "block";
      setTimeout(() => (location.href = "profile.html"), 1500);
    } else {
      alert(json.error || "Cập nhật thất bại");
    }
  } catch (err) {
    alert("Lỗi kết nối");
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearErrors() {
  document
    .querySelectorAll('[id$="Error"]')
    .forEach((el) => (el.textContent = ""));
}
