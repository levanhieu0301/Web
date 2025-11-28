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

  // Load danh sách mã giảm giá từ backend
  loadDiscounts();

  // Xử lý form
  const form = document.getElementById("discountForm");
  form.addEventListener("submit", handleSubmit);

  // Nút tạo mã tự động
  document.getElementById("generateBtn").addEventListener("click", generateCode);

  // Set min date cho date inputs
  const today = new Date().toISOString().split("T")[0];
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

// Xử lý submit form (tạo mã mới)
async function handleSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const formData = new FormData(e.target);

  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");

  if (startDate >= endDate) {
    alert("Ngày kết thúc phải sau ngày bắt đầu!");
    return;
  }

  const payload = {
    code: formData.get("code").toUpperCase(),
    type: formData.get("discountType"),
    value: parseFloat(formData.get("discountValue")),
    min_order_value: formData.get("minOrder")
      ? parseFloat(formData.get("minOrder"))
      : 0,
    // maxDiscount hiện chưa hỗ trợ trong model => bỏ qua
    start_date: startDate,
    end_date: endDate,
    max_usage: formData.get("usageLimit")
      ? parseInt(formData.get("usageLimit"), 10)
      : null,
    description: formData.get("description") || "",
  };

  try {
    const res = await fetch(`${API_URL}/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Tạo mã giảm giá thất bại");
    }

    alert("Tạo mã giảm giá thành công!");
    e.target.reset();
    loadDiscounts();
  } catch (err) {
    console.error("Error creating coupon:", err);
    alert(err.message || "Lỗi tạo mã giảm giá");
  }
}

// Load danh sách mã giảm giá từ backend
async function loadDiscounts() {
  const token = localStorage.getItem("token");
  const tbody = document.getElementById("discountsTableBody");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/coupons`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Lỗi tải danh sách mã giảm giá");
    }

    const coupons = data.data || [];

    if (coupons.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="8" style="text-align:center; padding: 1rem;">Chưa có mã giảm giá nào</td>';
      tbody.appendChild(row);
      return;
    }

    const now = new Date();

    coupons.forEach((coupon) => {
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);

      let status = "active";
      let statusText = "Đang hoạt động";

      if (!coupon.is_active) {
        status = "inactive";
        statusText = "Đã khóa";
      } else if (now < startDate) {
        status = "inactive";
        statusText = "Chưa bắt đầu";
      } else if (now > endDate) {
        status = "expired";
        statusText = "Hết hạn";
      } else if (
        coupon.max_usage !== null &&
        coupon.usage_count >= coupon.max_usage
      ) {
        status = "expired";
        statusText = "Hết lượt dùng";
      }

      const typeText =
        coupon.type === "percentage" ? "Phần trăm" : "Cố định";

      const valueText =
        coupon.type === "percentage"
          ? `${parseFloat(coupon.value)}%`
          : `${Number(coupon.value).toLocaleString("vi-VN")}đ`;

      const usedText =
        coupon.max_usage !== null
          ? `${coupon.usage_count}/${coupon.max_usage}`
          : `${coupon.usage_count}`;
      
      
      const toggleBtnText = coupon.is_active ? "Khóa" : "Mở";
      const toggleBtnColor = coupon.is_active ? "orange" : "green";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="discount-code">${coupon.code}</span></td>
        <td><span class="discount-type ${coupon.type}">${coupon.type === 'percentage' ? 'Phần trăm' : 'Cố định'}</span></td>
        <td><span class="discount-value">${coupon.type === 'percentage' ? coupon.value + '%' : Number(coupon.value).toLocaleString() + 'đ'}</span></td>
        <td>${formatDate(coupon.start_date)}</td>
        <td>${formatDate(coupon.end_date)}</td>
        <td>${coupon.usage_count}/${coupon.max_usage || '∞'}</td>
        <td><span class="status-${coupon.is_active ? 'active' : 'inactive'}">${coupon.is_active ? 'Hoạt động' : 'Đã khóa'}</span></td>
        <td>
          <div style="display: flex; gap: 5px;">
             <button class="btn-edit" onclick='openEditModal(${JSON.stringify(coupon)})' style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-edit"></i> Sửa
             </button>

             <button onclick="toggleStatus(${coupon.id})" style="background: ${toggleBtnColor}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                ${toggleBtnText}
             </button>

             <button onclick="deleteCouponPermanent(${coupon.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                Xóa
             </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading coupons:", err);
    const row = document.createElement("tr");
    row.innerHTML =
      '<td colspan="8" style="text-align:center; padding: 1rem; color: red;">Lỗi tải danh sách mã giảm giá</td>';
    tbody.appendChild(row);
  }
}

// Vô hiệu hoá mã giảm giá
window.deleteDiscount = async function (id) {
  if (!confirm("Bạn có chắc muốn vô hiệu hoá mã giảm giá này?")) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/coupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Vô hiệu hoá mã giảm giá thất bại");
    }

    alert("Đã vô hiệu hoá mã giảm giá!");
    loadDiscounts();
  } catch (err) {
    console.error("Error deactivating coupon:", err);
    alert(err.message || "Lỗi vô hiệu hoá mã giảm giá");
  }
};

// 1. Xử lý Bật/Tắt trạng thái
async function toggleStatus(id) {
    if(!confirm("Bạn có muốn thay đổi trạng thái mã này?")) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_URL}/coupons/${id}/status`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
            alert("Đã cập nhật trạng thái!");
            loadDiscounts();
        } else {
            alert("Lỗi khi cập nhật trạng thái");
        }
    } catch(e) { console.error(e); }
}

// 2. Xử lý Xóa vĩnh viễn
async function deleteCouponPermanent(id) {
    if(!confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn mã giảm giá và không thể khôi phục. Bạn chắc chứ?")) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_URL}/coupons/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if(res.ok) {
            alert("Đã xóa thành công!");
            loadDiscounts();
        } else {
            alert(data.error || "Không thể xóa mã (có thể do mã đã được sử dụng trong đơn hàng).");
        }
    } catch(e) { console.error(e); }
}

// 3. Xử lý Modal Sửa
function openEditModal(coupon) {
    const modal = document.getElementById("editCouponModal");
    // Điền dữ liệu cũ vào form
    document.getElementById("edit_id").value = coupon.id;
    document.getElementById("edit_code").value = coupon.code;
    document.getElementById("edit_type").value = coupon.type;
    document.getElementById("edit_value").value = coupon.value;
    // Format date cho input type="date" (YYYY-MM-DD)
    document.getElementById("edit_start_date").value = new Date(coupon.start_date).toISOString().split('T')[0];
    document.getElementById("edit_end_date").value = new Date(coupon.end_date).toISOString().split('T')[0];
    
    modal.style.display = "block";
}

function closeEditModal() {
    document.getElementById("editCouponModal").style.display = "none";
}

// 4. Xử lý Submit Form Sửa
document.getElementById("editCouponForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit_id").value;
    const token = localStorage.getItem("token");
    
    const payload = {
        code: document.getElementById("edit_code").value,
        type: document.getElementById("edit_type").value,
        value: document.getElementById("edit_value").value,
        start_date: document.getElementById("edit_start_date").value,
        end_date: document.getElementById("edit_end_date").value,
    };

    try {
        const res = await fetch(`${API_URL}/coupons/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(res.ok) {
            alert("Cập nhật thành công!");
            closeEditModal();
            loadDiscounts();
        } else {
            alert(data.error || "Lỗi cập nhật");
        }
    } catch(err) {
        console.error(err);
        alert("Lỗi kết nối");
    }
});

// Format ngày
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}
