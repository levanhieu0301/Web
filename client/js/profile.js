const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async function () {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const token = localStorage.getItem("token");

  // === KIỂM TRA ĐĂNG NHẬP ===
  if (!user || !token) {
    alert("Vui lòng đăng nhập để xem hồ sơ!");
    window.location.href = "login.html";
    return;
  }

  // === HIỂN THỊ THÔNG TIN USER ===
  document.getElementById("userName").textContent =
    user.name || "Chưa cập nhật";
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userPhone").textContent =
    user.phone || "Chưa cập nhật";

  const bookingList = document.getElementById("bookingList");
  const noBooking = document.getElementById("noBooking");

  // Khai báo biến đơn hàng trước khi sử dụng
  const ordersList = document.getElementById("ordersList");
  const noOrder = document.getElementById("noOrder");

  async function loadBookings() {
    try {
      const res = await fetch(`${API_URL}/bookings/user/${user.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Không thể tải lịch sử đặt dịch vụ");

      const resData = await res.json();
      const userBookings = resData.data;

      bookingList.innerHTML = "";

      updateStatistics(userBookings);

      if (!userBookings || userBookings.length === 0) {
        noBooking.style.display = "block";
        bookingList.style.display = "none";
        return;
      } else {
        noBooking.style.display = "none";
        bookingList.style.display = "grid";
      }

      userBookings.forEach((booking) => {
        const item = document.createElement("div");
        item.className = "booking-item";

        // --- STATUS CLASS ---
        const statusClassMap = {
          pending: "status-pending",
          confirmed: "status-confirmed",
          cancelled: "status-cancelled",
          completed: "status-completed",
        };

        const statusTextMap = {
          pending: "Đang chờ",
          confirmed: "Đã duyệt",
          cancelled: "Đã hủy",
          completed: "Hoàn thành",
        };

        const statusClass = statusClassMap[booking.status] || "status-pending";
        const statusText = statusTextMap[booking.status] || "Không rõ";

        item.innerHTML = `
          <div class="booking-service">${booking.service}</div>
          <div class="booking-date">Ngày: ${formatDate(
            booking.appointment_date
          )} | ${booking.appointment_time}</div>
          <span class="booking-status ${statusClass}">${statusText}</span>
        `;

        // --- NÚT HỦY chỉ cho pending ---
        if (booking.status === "pending") {
          const cancelBtn = document.createElement("button");
          cancelBtn.className = "cancel-btn";
          cancelBtn.dataset.id = booking.id;
          cancelBtn.textContent = "Hủy lịch";
          item.appendChild(cancelBtn);
        }

        bookingList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      noBooking.textContent = "Lỗi tải lịch sử. Vui lòng thử lại.";
      noBooking.style.display = "block";
      bookingList.style.display = "none";
    }
  }

  // Gắn event listener cho các nút trước khi load dữ liệu
  // --- NÚT ĐĂNG XUẤT ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
        try {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
          localStorage.removeItem("employees");
          alert("Đăng xuất thành công!");
          window.location.href = "index.html";
        } catch (error) {
          console.error("Lỗi khi đăng xuất:", error);
          alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.");
        }
      }
    });
  } else {
    console.error("Không tìm thấy nút đăng xuất (logoutBtn)");
  }

  // --- NÚT CHỈNH SỬA ---
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "edit-profile.html";
    });
  } else {
    console.error("Không tìm thấy nút chỉnh sửa (editProfileBtn)");
  }

  // Load dữ liệu
  try {
    await loadBookings();
  } catch (error) {
    console.error("Lỗi khi load bookings:", error);
  }

  // Load đơn hàng - đảm bảo được gọi
  if (ordersList && noOrder) {
    try {
      await loadOrders();
    } catch (error) {
      console.error("Lỗi khi load orders:", error);
      if (noOrder) {
        noOrder.textContent = "Lỗi tải đơn hàng. Vui lòng thử lại.";
        noOrder.style.display = "block";
      }
      if (ordersList) {
        ordersList.style.display = "none";
      }
    }
  } else {
    console.error(
      "Không tìm thấy elements cho đơn hàng - ordersList hoặc noOrder"
    );
    console.log("ordersList:", ordersList);
    console.log("noOrder:", noOrder);
  }

  // --- XỬ LÝ HỦY LỊCH (EVENT DELEGATION) ---
  if (bookingList) {
    bookingList.addEventListener("click", async (e) => {
      if (!e.target.classList.contains("cancel-btn")) return;

      const bookingId = e.target.dataset.id;

      if (!confirm("Bạn có chắc muốn hủy lịch này không?")) return;

      try {
        const res = await fetch(`${API_URL}/bookings/cancel/${bookingId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Hủy lịch thất bại!");
        }

        alert("Đã hủy lịch thành công!");
        await loadBookings();
      } catch (err) {
        alert("Lỗi khi hủy lịch. Vui lòng thử lại.");
        console.error(err);
      }
    });
  }

  // --- MENU MOBILE ---
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

  // === XỬ LÝ ĐƠN HÀNG ===
  // Biến ordersList và noOrder đã được khai báo ở trên

  async function loadOrders() {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Không thể tải đơn hàng");

      const resData = await res.json();
      console.log("API Response:", resData); // Debug

      const orders = resData.data || [];
      console.log("Orders loaded:", orders); // Debug
      console.log("Number of orders:", orders.length); // Debug

      if (!ordersList || !noOrder) {
        console.error("Không tìm thấy elements cho đơn hàng");
        console.log("ordersList exists:", !!ordersList);
        console.log("noOrder exists:", !!noOrder);
        return;
      }

      ordersList.innerHTML = "";

      if (!orders || orders.length === 0) {
        noOrder.style.display = "block";
        ordersList.style.display = "none";
        console.log("No orders found, showing noOrder message");
        return;
      } else {
        noOrder.style.display = "none";
        ordersList.style.display = "flex";
        console.log("Displaying", orders.length, "orders");
      }

      orders.forEach((order) => {
        const item = document.createElement("div");
        item.className = "order-item";

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

        // Timeline trạng thái
        const statusTimeline = getStatusTimeline(
          order.status,
          order.created_at,
          order.updated_at
        );

        let itemsHtml = "";
        if (order.items && order.items.length > 0) {
          itemsHtml =
            '<div class="order-items-list"><strong>Sản phẩm:</strong>';
          order.items.forEach((orderItem) => {
            itemsHtml += `
              <div class="order-item-product">
                <span>${
                  orderItem.product?.name || "Sản phẩm #" + orderItem.product_id
                } x ${orderItem.quantity}</span>
                <span>${formatPrice(
                  orderItem.subtotal || orderItem.price * orderItem.quantity
                )}</span>
              </div>
            `;
          });
          itemsHtml += "</div>";
        }

        item.innerHTML = `
          <div class="order-header">
            <span class="order-id">Đơn hàng #${order.id}</span>
            <span class="order-status ${statusClass}">${statusText}</span>
          </div>
          <div class="order-details">
            <div class="order-detail-row">
              <strong>Tổng tiền:</strong>
              <span>${formatPrice(order.total_amount || 0)}</span>
            </div>
            <div class="order-detail-row">
              <strong>Địa chỉ:</strong>
              <span>${order.shipping_address || "—"}</span>
            </div>
            <div class="order-detail-row">
              <strong>SĐT:</strong>
              <span>${order.phone || "—"}</span>
            </div>
            <div class="order-detail-row">
              <strong>Ngày đặt:</strong>
              <span>${formatDate(order.created_at)}</span>
            </div>
            ${
              order.updated_at && order.updated_at !== order.created_at
                ? `
            <div class="order-detail-row">
              <strong>Cập nhật lần cuối:</strong>
              <span>${formatDate(order.updated_at)}</span>
            </div>
            `
                : ""
            }
            ${
              order.notes
                ? `<div class="order-detail-row"><strong>Ghi chú:</strong><span>${order.notes}</span></div>`
                : ""
            }
          </div>
          ${itemsHtml}
          ${statusTimeline}
          ${
            order.status === "pending"
              ? `
            <div class="order-actions">
              <button class="btn-edit-order" onclick="editOrder(${order.id})">Chỉnh sửa</button>
              <button class="btn-delete-order" onclick="deleteOrder(${order.id})">Xóa</button>
            </div>
          `
              : ""
          }
        `;

        ordersList.appendChild(item);
      });
    } catch (err) {
      console.error(err);
      noOrder.textContent = "Lỗi tải đơn hàng. Vui lòng thử lại.";
      noOrder.style.display = "block";
      ordersList.style.display = "none";
    }
  }

  // === MODAL CHỈNH SỬA ĐƠN HÀNG ===
  const editOrderModal = document.getElementById("editOrderModal");
  const closeEditOrderModal = document.getElementById("closeEditOrderModal");
  const cancelEditOrderBtn = document.getElementById("cancelEditOrderBtn");
  const editOrderForm = document.getElementById("editOrderForm");

  closeEditOrderModal?.addEventListener("click", () => {
    editOrderModal.style.display = "none";
  });

  cancelEditOrderBtn?.addEventListener("click", () => {
    editOrderModal.style.display = "none";
  });

  editOrderModal?.addEventListener("click", (e) => {
    if (e.target === editOrderModal) {
      editOrderModal.style.display = "none";
    }
  });

  editOrderForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const orderId = document.getElementById("editOrderId").value;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping_address: document.getElementById("editShippingAddress")
            .value,
          phone: document.getElementById("editPhone").value,
          notes: document.getElementById("editNotes").value || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cập nhật đơn hàng thất bại!");
      }

      alert("Cập nhật đơn hàng thành công!");
      editOrderModal.style.display = "none";
      await loadOrders();
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật đơn hàng. Vui lòng thử lại.");
      console.error(err);
    }
  });

  // === HÀM CHỈNH SỬA ĐƠN HÀNG ===
  window.editOrder = async function (orderId) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Không thể tải thông tin đơn hàng");

      const resData = await res.json();
      const order = resData.data;

      if (order.status !== "pending") {
        alert("Chỉ có thể chỉnh sửa đơn hàng đang chờ duyệt!");
        return;
      }

      document.getElementById("editOrderId").value = order.id;
      document.getElementById("editShippingAddress").value =
        order.shipping_address || "";
      document.getElementById("editPhone").value = order.phone || "";
      document.getElementById("editNotes").value = order.notes || "";

      // Hiển thị chi tiết sản phẩm
      const itemsEdit = document.getElementById("orderItemsEdit");
      if (order.items && order.items.length > 0) {
        let itemsHtml = "<h4>Chi tiết sản phẩm:</h4>";
        order.items.forEach((item) => {
          itemsHtml += `
            <div class="order-item-edit">
              <span>${
                item.product?.name || "Sản phẩm #" + item.product_id
              }</span>
              <div>
                <label>Số lượng: </label>
                <input type="number" min="1" value="${item.quantity}" 
                       data-item-id="${item.id}" 
                       data-product-id="${item.product_id}"
                       onchange="updateOrderItemQuantity(${
                         item.id
                       }, this.value, ${item.product_id})" />
                <span style="margin-left: 10px;">${formatPrice(
                  item.price
                )}/sản phẩm</span>
              </div>
            </div>
          `;
        });
        itemsHtml += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);">
          <strong>Tổng tiền: <span id="editOrderTotal">${formatPrice(
            order.total_amount
          )}</span></strong>
        </div>`;
        itemsEdit.innerHTML = itemsHtml;
      } else {
        itemsEdit.innerHTML = "<p>Không có sản phẩm nào</p>";
      }

      editOrderModal.style.display = "flex";
    } catch (err) {
      console.error(err);
      alert("Lỗi tải thông tin đơn hàng");
    }
  };

  // === HÀM CẬP NHẬT SỐ LƯỢNG SẢN PHẨM ===
  window.updateOrderItemQuantity = async function (
    itemId,
    quantity,
    productId
  ) {
    if (quantity < 1) {
      alert("Số lượng phải lớn hơn 0!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/orders/items/${itemId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: parseInt(quantity) }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Cập nhật số lượng thất bại!");
      }

      // Reload order để cập nhật tổng tiền và danh sách sản phẩm
      const orderId = document.getElementById("editOrderId").value;
      const orderRes = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const order = orderData.data;

        // Cập nhật tổng tiền
        document.getElementById("editOrderTotal").textContent = formatPrice(
          order.total_amount
        );

        // Cập nhật lại danh sách sản phẩm với giá mới
        const itemsEdit = document.getElementById("orderItemsEdit");
        if (order.items && order.items.length > 0) {
          let itemsHtml = "<h4>Chi tiết sản phẩm:</h4>";
          order.items.forEach((item) => {
            itemsHtml += `
              <div class="order-item-edit">
                <span>${
                  item.product?.name || "Sản phẩm #" + item.product_id
                }</span>
                <div>
                  <label>Số lượng: </label>
                  <input type="number" min="1" value="${item.quantity}" 
                         data-item-id="${item.id}" 
                         data-product-id="${item.product_id}"
                         onchange="updateOrderItemQuantity(${
                           item.id
                         }, this.value, ${item.product_id})" />
                  <span style="margin-left: 10px;">${formatPrice(
                    item.price
                  )}/sản phẩm</span>
                </div>
              </div>
            `;
          });
          itemsHtml += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);">
            <strong>Tổng tiền: <span id="editOrderTotal">${formatPrice(
              order.total_amount
            )}</span></strong>
          </div>`;
          itemsEdit.innerHTML = itemsHtml;
        }
      }
    } catch (err) {
      alert(err.message || "Lỗi khi cập nhật số lượng");
      console.error(err);
      // Reload lại modal để hiển thị đúng
      const orderId = document.getElementById("editOrderId").value;
      if (orderId) {
        window.editOrder(orderId);
      }
    }
  };

  // === HÀM XÓA ĐƠN HÀNG ===
  window.deleteOrder = async function (orderId) {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này không?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Xóa đơn hàng thất bại!");
      }

      alert("Đã xóa đơn hàng thành công!");
      await loadOrders();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa đơn hàng. Vui lòng thử lại.");
      console.error(err);
    }
  };
});

// --- FORMAT NGÀY ---
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  } catch {
    return "Không xác định";
  }
}

// --- CẬP NHẬT THỐNG KÊ ---
function updateStatistics(bookings) {
  if (!bookings || bookings.length === 0) {
    document.getElementById("totalBookings").textContent = "0";
    document.getElementById("confirmedBookings").textContent = "0";
    document.getElementById("pendingBookings").textContent = "0";
    document.getElementById("totalSpent").textContent = "0đ";
    return;
  }

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  const servicePrices = {
    "Rửa xe": 100000,
    "Sửa chữa cơ bản": 200000,
    "Bảo dưỡng định kỳ": 500000,
    "Thay lốp": 300000,
    "Kiểm tra điện": 150000,
  };

  let totalSpent = 0;
  bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .forEach((b) => {
      const serviceType = b.serviceType || b.service || "";
      const price = servicePrices[serviceType] || 200000;
      totalSpent += price;
    });

  document.getElementById("totalBookings").textContent = total;
  document.getElementById("confirmedBookings").textContent = confirmed;
  document.getElementById("pendingBookings").textContent = pending;
  document.getElementById("totalSpent").textContent =
    totalSpent.toLocaleString("vi-VN") + "đ";
}

// --- FORMAT GIÁ TIỀN ---
function formatPrice(price) {
  if (!price && price !== 0) return "0₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

// --- TIMELINE TRẠNG THÁI ĐƠN HÀNG ---
function getStatusTimeline(status, created_at, updated_at) {
  const statuses = [
    { key: "pending", label: "Chờ duyệt", icon: "⏳" },
    { key: "confirmed", label: "Đã xác nhận", icon: "✅" },
    { key: "processing", label: "Đang xử lý", icon: "⚙️" },
    { key: "shipped", label: "Đang giao", icon: "🚚" },
    { key: "delivered", label: "Đã giao", icon: "📦" },
    { key: "cancelled", label: "Đã hủy", icon: "❌" },
  ];

  const currentIndex = statuses.findIndex((s) => s.key === status);
  if (currentIndex === -1) return "";

  let timelineHtml =
    '<div class="order-timeline"><strong>Tiến trình đơn hàng:</strong><div class="timeline-steps">';

  statuses.forEach((statusItem, index) => {
    // Nếu đơn hàng bị hủy, chỉ hiển thị đến trạng thái hủy
    if (status === "cancelled" && statusItem.key !== "cancelled" && index > 0) {
      return; // Bỏ qua các trạng thái sau khi hủy
    }

    const isActive = index <= currentIndex;
    const isCurrent = index === currentIndex;
    const isCancelled =
      status === "cancelled" && statusItem.key === "cancelled";

    timelineHtml += `
      <div class="timeline-step ${isActive ? "active" : ""} ${
      isCurrent ? "current" : ""
    } ${isCancelled ? "cancelled" : ""}">
        <div class="timeline-icon">${statusItem.icon}</div>
        <div class="timeline-label">${statusItem.label}</div>
        ${
          isCurrent && updated_at
            ? `<div class="timeline-date">${formatDate(updated_at)}</div>`
            : ""
        }
      </div>
    `;
  });

  timelineHtml += "</div></div>";
  return timelineHtml;
}
