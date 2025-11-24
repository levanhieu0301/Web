const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");

  if (!token || user.role !== "admin") {
    alert("Không có quyền truy cập!");
    window.location.href = "login.html";
    return;
  }

  await loadDashboard();

  // === ĐĂNG XUẤT ===
  document.getElementById("logoutLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Đăng xuất admin?")) {
      localStorage.clear();
      alert("Đã đăng xuất!");
      location.href = "login.html";
    }
  });

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

  // === TẠO NHÂN VIÊN ===
  const createEmployeeSection = document.getElementById(
    "createEmployeeSection"
  );
  const showCreateFormBtn = document.getElementById("showCreateFormBtn");
  const cancelCreateBtn = document.getElementById("cancelCreateBtn");
  const createEmployeeForm = document.getElementById("createEmployeeForm");

  document
    .getElementById("createEmployeeLink")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      createEmployeeSection.style.display = "block";
      createEmployeeSection.scrollIntoView({ behavior: "smooth" });
    });

  showCreateFormBtn?.addEventListener("click", () => {
    createEmployeeSection.style.display = "block";
    createEmployeeSection.scrollIntoView({ behavior: "smooth" });
  });

  cancelCreateBtn?.addEventListener("click", () => {
    createEmployeeSection.style.display = "none";
    createEmployeeForm.reset();
  });

  createEmployeeForm?.addEventListener("submit", handleCreateEmployee);

  // === QUẢN LÝ SẢN PHẨM ===
  const manageProductsLink = document.getElementById("manageProductsLink");
  const productsSection = document.getElementById("productsSection");
  const showCreateProductFormBtn = document.getElementById("showCreateProductFormBtn");
  const productFormSection = document.getElementById("productFormSection");
  const productForm = document.getElementById("productForm");
  const cancelProductFormBtn = document.getElementById("cancelProductFormBtn");
  const productImageInput = document.getElementById("productImage");

  manageProductsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    productsSection.style.display = "block";
    productsSection.scrollIntoView({ behavior: "smooth" });
    loadProducts();
  });

  showCreateProductFormBtn?.addEventListener("click", () => {
    productFormSection.style.display = "block";
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("productImagePreview").innerHTML = "";
    productFormSection.scrollIntoView({ behavior: "smooth" });
  });

  cancelProductFormBtn?.addEventListener("click", () => {
    productFormSection.style.display = "none";
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("productImagePreview").innerHTML = "";
  });

  // Preview ảnh
  productImageInput?.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file
      if (file.size > 5 * 1024 * 1024) {
        alert("File ảnh không được vượt quá 5MB!");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById("productImagePreview");
        preview.innerHTML = `<div class="image-preview-container">
          <img src="${e.target.result}" class="product-preview-image" alt="Preview" />
          <p class="image-preview-label">Xem trước ảnh mới</p>
        </div>`;
      };
      reader.readAsDataURL(file);
    } else {
      document.getElementById("productImagePreview").innerHTML = "";
    }
  });

  productForm?.addEventListener("submit", handleProductSubmit);
});

// ================== LOAD DASHBOARD ==================
async function loadDashboard() {
  const token = localStorage.getItem("token");

  try {
    // Lấy tất cả users, bookings, orders và employees
    const [usersRes, bookingsRes, employeesRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!usersRes.ok || !bookingsRes.ok || !employeesRes.ok || !ordersRes.ok)
      throw new Error("Lỗi tải dữ liệu");

    const users = await usersRes.json();
    const bookings = await bookingsRes.json();
    const employees = await employeesRes.json();
    const ordersData = await ordersRes.json();
    const orders = ordersData.data || [];
    
    console.log("Orders for admin:", orders); // Debug

    localStorage.setItem("employees", JSON.stringify(employees));

    // Lọc chỉ lấy users có role = "user"
    const userOnly = users.filter((u) => u.role === "user");
    
    // Lọc bookings có status = "completed" cho biểu đồ
    const completedBookings = bookings.filter((b) => b.status === "completed");

    // Thống kê nhanh - chỉ đếm users có role = "user"
    document.getElementById("totalUsers").textContent = userOnly.length;
    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("pendingBookings").textContent = bookings.filter(
      (b) => b.status === "pending"
    ).length;
    document.getElementById("completedBookings").textContent = bookings.filter(
      (b) => b.status === "completed"
    ).length;

    // Chỉ hiển thị users có role = "user"
    loadUsersTable(userOnly);
    loadBookingsTable(bookings, employees);
    // Biểu đồ chỉ hiển thị bookings đã hoàn thành (status = "completed")
    renderServiceChart(completedBookings);
    loadEmployeesTable(employees);
    loadOrdersTable(orders);
  } catch (err) {
    console.error("Lỗi tải dashboard:", err);
    alert("Lỗi tải dữ liệu. Vui lòng thử lại.");
  }
}

// ================== USERS ==================
function loadUsersTable(users) {
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";
  
  // Chỉ hiển thị users có role = "user" (đã được filter từ loadDashboard)
  if (users.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" style="text-align: center; color: var(--text-light); padding: 2rem;">Chưa có người dùng nào</td>`;
    tbody.appendChild(row);
    return;
  }
  
  users.forEach((u) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name || "—"}</td>
      <td>${u.email}</td>
      <td>${u.phone || "—"}</td>
      <td>${formatDate(u.created_at)}</td>
    `;
    tbody.appendChild(row);
  });
}

// ================== BOOKINGS ==================
function loadBookingsTable(bookings, employees) {
  const tbody = document.querySelector("#bookingsTable tbody");
  tbody.innerHTML = "";

  bookings.forEach((b) => {
    const statusClass =
      {
        pending: "status-pending",
        confirmed: "status-confirmed",
        cancelled: "status-cancelled",
        completed: "status-completed",
      }[b.status] || "status-pending";

    let staffSelect = "";
    if (b.status === "confirmed") {
      staffSelect = `
        <select onchange="assignStaff(${b.id}, this.value)">
          <option value="">-- Chọn nhân viên --</option>
          ${employees
            .map(
              (emp) =>
                `<option value="${emp.id}" ${
                  b.staff_id === emp.id ? "selected" : ""
                }>${emp.name}</option>`
            )
            .join("")}
        </select>
      `;
    } else {
      staffSelect = b.staff_name || "—";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.id}</td>
      <td>${b.full_name} (${b.user_name || "—"})</td>
      <td>${b.service} (${b.car_brand || ""} ${b.car_model || ""})</td>
      <td>${formatDate(b.appointment_date)} ${b.appointment_time}</td>
      <td><span class="status ${statusClass}">${getStatusText(
      b.status
    )}</span></td>
      <td>
        ${
          b.status === "pending"
            ? `<button class="action-btn btn-confirm" onclick="updateStatus(${b.id}, 'confirmed')">Duyệt</button>
             <button class="action-btn btn-cancel" onclick="updateStatus(${b.id}, 'cancelled')">Hủy</button>`
            : b.status === "completed"
            ? `<span class="status status-completed">Hoàn thành</span>`
            : "—"
        }
      </td>
      <td>${staffSelect}</td>
    `;
    tbody.appendChild(row);
  });
}

// ================== ASSIGN STAFF ==================
async function assignStaff(bookingId, staffId) {
  if (!staffId) return;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(
      `${API_URL}/admin/bookings/${bookingId}/assign-staff`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ staffId }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Cập nhật nhân viên thất bại");
    } else {
      alert("Đã gán nhân viên cho lịch!");
      loadDashboard();
    }
  } catch (err) {
    alert("Lỗi kết nối");
  }
}

// ================== EMPLOYEES ==================
function loadEmployeesTable(employees) {
  const tbody = document.querySelector("#employeesTable tbody");
  tbody.innerHTML = "";
  employees.forEach((emp) => {
    const statusClass =
      emp.status === "Đang làm việc"
        ? "status-confirmed"
        : emp.status === "Nghỉ phép"
        ? "status-pending"
        : "status-cancelled";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.email}</td>
      <td>${emp.phone}</td>
      <td>${emp.position}</td>
      <td><span class="status ${statusClass}">${emp.status}</span></td>
      <td>${formatDate(emp.joinDate)}</td>
      <td>
        <button class="action-btn btn-delete" onclick="deleteEmployee(${
          emp.id
        })">Xóa</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ================== CREATE EMPLOYEE ==================
async function handleCreateEmployee(e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const formData = new FormData(e.target);

  const employeeData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    status: formData.get("status") || "Đang làm việc",
    password: formData.get("password"),
  };

  try {
    const res = await fetch(`${API_URL}/admin/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(employeeData),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Tạo nhân viên thất bại");
    } else {
      alert("Tạo nhân viên thành công!");
      e.target.reset();
      document.getElementById("createEmployeeSection").style.display = "none";
      loadDashboard();
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối");
  }
}

// ================== DELETE EMPLOYEE ==================
window.deleteEmployee = async function (id) {
  if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return;
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API_URL}/admin/employees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Xóa nhân viên thất bại");
    } else {
      alert("Đã xóa nhân viên!");
      loadDashboard();
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối");
  }
};

// ================== UPDATE BOOKING STATUS ==================
window.updateStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      alert(`Đã ${status === "confirmed" ? "duyệt" : "hủy"} lịch!`);
      loadDashboard();
    } else {
      const err = await res.json();
      alert(err.error || "Cập nhật thất bại");
    }
  } catch (err) {
    alert("Lỗi kết nối");
  }
};

// ================== HELPER ==================
function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? date : d.toLocaleDateString("vi-VN");
}

function getStatusText(s) {
  return (
    { 
      pending: "Chờ duyệt", 
      confirmed: "Đã duyệt", 
      cancelled: "Đã hủy",
      completed: "Hoàn thành"
    }[s] || s
  );
}

// ================== PRODUCTS ==================
async function loadProducts() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Lỗi tải sản phẩm");
    const products = await res.json();
    loadProductsTable(products.data || []);
  } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
    alert("Lỗi tải danh sách sản phẩm");
  }
}

function loadProductsTable(products) {
  const tbody = document.querySelector("#productsTable tbody");
  tbody.innerHTML = "";
  products.forEach((p) => {
    const row = document.createElement("tr");
    // Sửa đường dẫn ảnh - sử dụng đúng API endpoint
    let imageUrl = "";
    if (p.image) {
      // Nếu có image, tạo đường dẫn đầy đủ đến thư mục HinhAnhSanPham
      imageUrl = `http://localhost:5000/api/products/images/${p.image}`;
    } else if (p.image_url) {
      // Nếu có image_url từ API
      imageUrl = p.image_url.startsWith('http') ? p.image_url : `http://localhost:5000${p.image_url}`;
    } else {
      // Ảnh mặc định
      imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
    }
    row.innerHTML = `
      <td>${p.id}</td>
      <td>
        <div class="product-image-cell">
          <img src="${imageUrl}" 
               alt="${p.name}" 
               class="product-table-image"
               onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'100\\' height=\\'100\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ENo Image%3C/text%3E%3C/svg%3E'" />
        </div>
      </td>
      <td><strong>${p.name}</strong></td>
      <td>${formatPrice(p.price)}</td>
      <td><span class="stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock}</span></td>
      <td class="description-cell">${(p.description || "Không có mô tả").substring(0, 50)}${p.description && p.description.length > 50 ? "..." : ""}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-edit" onclick="editProduct(${p.id})">Sửa</button>
          <button class="action-btn btn-delete" onclick="deleteProduct(${p.id})">Xóa</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const formData = new FormData(e.target);
  const productId = document.getElementById("productId").value;

  try {
    let res;
    if (productId) {
      // Update
      res = await fetch(`${API_URL}/products/${productId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } else {
      // Create
      res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Lỗi lưu sản phẩm");
    } else {
      alert(productId ? "Cập nhật sản phẩm thành công!" : "Tạo sản phẩm thành công!");
      e.target.reset();
      document.getElementById("productId").value = "";
      document.getElementById("productImagePreview").innerHTML = "";
      document.getElementById("productFormSection").style.display = "none";
      loadProducts();
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối");
  }
}

window.editProduct = async function (id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Lỗi tải sản phẩm");
    const resData = await res.json();
    const product = resData.data;

    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productDescription").value = product.description || "";

    const preview = document.getElementById("productImagePreview");
    if (product.image || product.image_url) {
      const imageUrl = product.image 
        ? `http://localhost:5000/api/products/images/${product.image}`
        : (product.image_url && product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url || ''}`);
      preview.innerHTML = `<div class="image-preview-container">
        <img src="${imageUrl}" 
             alt="${product.name}" 
             class="product-preview-image"
             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'200\\' height=\\'200\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'16\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ENo Image%3C/text%3E%3C/svg%3E'" />
        <p class="image-preview-label">Ảnh hiện tại</p>
      </div>`;
    }

    document.getElementById("productFormSection").style.display = "block";
    document.getElementById("productFormSection").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alert("Lỗi tải thông tin sản phẩm");
  }
};

window.deleteProduct = async function (id) {
  if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Xóa sản phẩm thất bại");
    } else {
      alert("Đã xóa sản phẩm!");
      loadProducts();
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối");
  }
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// ================== CHART ==================
function renderServiceChart(bookings) {
  // Chỉ hiển thị bookings đã hoàn thành (status = "completed")
  const serviceCount = {};
  bookings.forEach((b) => {
    if (b.service) {
      serviceCount[b.service] = (serviceCount[b.service] || 0) + 1;
    }
  });

  const labels = Object.keys(serviceCount);
  const dataCounts = Object.values(serviceCount);

  const ctx = document.getElementById("serviceChart").getContext("2d");
  if (window.serviceChartInstance) window.serviceChartInstance.destroy();

  // Nếu không có dữ liệu
  if (labels.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText("Chưa có dịch vụ nào đã hoàn thành", ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  window.serviceChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Số lượng",
          data: dataCounts,
          backgroundColor: [
            "#36A2EB",
            "#FF6384",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#C9CBCF",
            "#FF6384",
            "#36A2EB",
          ],
          borderColor: [
            "#2E8BC0",
            "#E04E5F",
            "#E6B847",
            "#3BA8A8",
            "#7A4FC7",
            "#E68F30",
            "#B0B3B8",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          display: true,
          position: "top",
          labels: {
            font: { size: 12 },
            padding: 15,
          }
        },
        title: {
          display: true,
          text: "Biểu đồ dịch vụ đã hoàn thành (Status: Completed)",
          font: { size: 16, weight: "bold" },
          padding: { top: 10, bottom: 20 },
          color: "#333",
        },
        tooltip: {
          callbacks: { 
            label: (ctx) => `${ctx.label}: ${ctx.raw} lần đặt`,
            title: (items) => `Dịch vụ: ${items[0].label}`
          },
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 12 },
          },
          title: {
            display: true,
            text: "Số lượng đặt lịch",
            font: { size: 13, weight: "bold" },
          },
        },
        x: {
          ticks: {
            font: { size: 11 },
          },
          title: {
            display: true,
            text: "Loại dịch vụ",
            font: { size: 13, weight: "bold" },
          },
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

// ================== ORDERS ==================
function loadOrdersTable(orders) {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (orders.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="9" style="text-align: center; color: var(--text-light); padding: 2rem;">Chưa có đơn hàng nào</td>`;
    tbody.appendChild(row);
    return;
  }

  orders.forEach((order) => {
    const statusClassMap = {
      pending: "status-pending",
      confirmed: "status-confirmed",
      processing: "status-confirmed",
      shipped: "status-confirmed",
      delivered: "status-completed",
      cancelled: "status-cancelled",
    };

    const statusTextMap = {
      pending: "Chờ duyệt",
      confirmed: "Đã xác nhận",
      processing: "Đang xử lý",
      shipped: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };

    const statusClass = statusClassMap[order.status] || "status-pending";
    const statusText = statusTextMap[order.status] || "Không rõ";

    // Lấy danh sách sản phẩm
    let productsList = "—";
    if (order.items && order.items.length > 0) {
      productsList = order.items
        .map(
          (item) =>
            `${item.product?.name || "Sản phẩm #" + item.product_id} (x${item.quantity})`
        )
        .join(", ");
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.id}</td>
      <td>${order.user?.name || "—"} (${order.user?.email || "—"})</td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${productsList}">${productsList}</td>
      <td>${formatPrice(order.total_amount)}</td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order.shipping_address || "—"}">${order.shipping_address || "—"}</td>
      <td>${order.phone || "—"}</td>
      <td>${formatDate(order.created_at)}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td>
        ${
          order.status === "pending"
            ? `<button class="action-btn btn-confirm" onclick="updateOrderStatus(${order.id}, 'confirmed')">Duyệt</button>
               <button class="action-btn btn-cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Hủy</button>`
            : order.status === "confirmed"
            ? `<button class="action-btn btn-confirm" onclick="updateOrderStatus(${order.id}, 'processing')">Xử lý</button>`
            : order.status === "processing"
            ? `<button class="action-btn btn-confirm" onclick="updateOrderStatus(${order.id}, 'shipped')">Giao hàng</button>`
            : order.status === "shipped"
            ? `<button class="action-btn btn-confirm" onclick="updateOrderStatus(${order.id}, 'delivered')">Hoàn thành</button>`
            : "—"
        }
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ================== UPDATE ORDER STATUS ==================
window.updateOrderStatus = async function (orderId, status) {
  const token = localStorage.getItem("token");
  const statusTextMap = {
    confirmed: "xác nhận",
    cancelled: "hủy",
    processing: "chuyển sang xử lý",
    shipped: "chuyển sang giao hàng",
    delivered: "hoàn thành",
  };

  if (!confirm(`Bạn có chắc muốn ${statusTextMap[status] || "cập nhật"} đơn hàng này?`))
    return;

  try {
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Cập nhật đơn hàng thất bại");
      return;
    }

    alert(`Đã ${statusTextMap[status] || "cập nhật"} đơn hàng thành công!`);
    loadDashboard();
  } catch (err) {
    console.error(err);
    alert("Lỗi kết nối");
  }
};
