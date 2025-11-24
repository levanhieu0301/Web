// js/discount.js
const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

  // KIỂM TRA role === 'admin'
  if (!token || user.role !== "admin") {
    alert("Không có quyền truy cập!");
    window.location.href = "login.html";
    return;
  }

  // Load danh sách mã giảm giá
  loadDiscounts();

  // Xử lý form
  const form = document.getElementById("discountForm");
  form.addEventListener("submit", handleSubmit);

  // Nút tạo mã tự động
  document.getElementById("generateBtn").addEventListener("click", generateCode);

  // Set min date cho date inputs
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("startDate").setAttribute("min", today);
  document.getElementById("endDate").setAttribute("min", today);

  // Đăng xuất
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.onclick = (e) => {
      e.preventDefault();
      if (confirm("Đăng xuất admin?")) {
        localStorage.clear();
        alert("Đã đăng xuất!");
        location.href = "login.html";
      }
    };
  }

  // Menu mobile
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
});

// Tạo mã tự động
function generateCode() {
  const prefixes = ["SUMMER", "WINTER", "SPRING", "AUTUMN", "VIP", "NEW", "SALE"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const numbers = Math.floor(1000 + Math.random() * 9000);
  const code = `${prefix}${numbers}`;
  document.getElementById("code").value = code;
}

// Xử lý submit form
async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = {
    code: formData.get("code").toUpperCase(),
    discountType: formData.get("discountType"),
    discountValue: parseFloat(formData.get("discountValue")),
    minOrder: formData.get("minOrder") ? parseFloat(formData.get("minOrder")) : 0,
    maxDiscount: formData.get("maxDiscount") ? parseFloat(formData.get("maxDiscount")) : null,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    usageLimit: formData.get("usageLimit") ? parseInt(formData.get("usageLimit")) : null,
    description: formData.get("description") || ""
  };

  // Validate
  if (data.startDate >= data.endDate) {
    alert("Ngày kết thúc phải sau ngày bắt đầu!");
    return;
  }

  // Lưu vào localStorage (mock - không có backend)
  const discounts = JSON.parse(localStorage.getItem("discounts") || "[]");
  const newDiscount = {
    id: discounts.length > 0 ? Math.max(...discounts.map(d => d.id)) + 1 : 1,
    ...data,
    usedCount: 0,
    createdAt: new Date().toISOString()
  };
  discounts.push(newDiscount);
  localStorage.setItem("discounts", JSON.stringify(discounts));

  alert("Tạo mã giảm giá thành công!");
  e.target.reset();
  loadDiscounts();
}

// Load danh sách mã giảm giá
function loadDiscounts() {
  // Lấy từ localStorage (mock data)
  let discounts = JSON.parse(localStorage.getItem("discounts") || "[]");

  // Nếu chưa có, tạo dữ liệu mẫu
  if (discounts.length === 0) {
    discounts = [
      {
        id: 1,
        code: "SUMMER2024",
        discountType: "percentage",
        discountValue: 20,
        minOrder: 500000,
        maxDiscount: 100000,
        startDate: "2024-06-01",
        endDate: "2024-08-31",
        usageLimit: 100,
        usedCount: 45,
        description: "Giảm 20% cho đơn hàng từ 500k, tối đa 100k",
        createdAt: "2024-05-25T10:00:00Z"
      },
      {
        id: 2,
        code: "NEWUSER50",
        discountType: "fixed",
        discountValue: 50000,
        minOrder: 0,
        maxDiscount: null,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        usageLimit: null,
        usedCount: 120,
        description: "Giảm 50k cho khách hàng mới",
        createdAt: "2024-01-01T00:00:00Z"
      }
    ];
    localStorage.setItem("discounts", JSON.stringify(discounts));
  }

  const tbody = document.getElementById("discountsTableBody");
  tbody.innerHTML = "";

  discounts.forEach((discount) => {
    const now = new Date();
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    
    let status = "active";
    let statusText = "Đang hoạt động";
    if (now < startDate) {
      status = "inactive";
      statusText = "Chưa bắt đầu";
    } else if (now > endDate) {
      status = "expired";
      statusText = "Hết hạn";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="discount-code">${discount.code}</span></td>
      <td>
        <span class="discount-type ${discount.discountType}">
          ${discount.discountType === "percentage" ? "Phần trăm" : "Cố định"}
        </span>
      </td>
      <td>
        <span class="discount-value">
          ${discount.discountType === "percentage" 
            ? `${discount.discountValue}%` 
            : `${discount.discountValue.toLocaleString("vi-VN")}đ`}
        </span>
      </td>
      <td>${formatDate(discount.startDate)}</td>
      <td>${formatDate(discount.endDate)}</td>
      <td>${discount.usedCount}${discount.usageLimit ? `/${discount.usageLimit}` : ""}</td>
      <td><span class="status-${status}">${statusText}</span></td>
      <td>
        <button class="btn-delete" onclick="deleteDiscount(${discount.id})">
          Xóa
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Xóa mã giảm giá
window.deleteDiscount = function(id) {
  if (!confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;

  const discounts = JSON.parse(localStorage.getItem("discounts") || "[]");
  const filtered = discounts.filter(d => d.id !== id);
  localStorage.setItem("discounts", JSON.stringify(filtered));
  loadDiscounts();
  alert("Đã xóa mã giảm giá!");
};

// Format ngày
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

