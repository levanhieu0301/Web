const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const token = localStorage.getItem("token");
  
  // Store product globally for order functionality
  let currentProduct = null;

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
    const loginLink = document.getElementById("loginLink");
    const profileLink = document.getElementById("profileLink");
    if (loginLink) loginLink.style.display = "none";
    if (profileLink) {
      profileLink.style.display = "block";
      profileLink.textContent = user.name || "Hồ sơ";
    }
  }

  // === LẤY ID SẢN PHẨM TỪ URL ===
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    showError();
    return;
  }

  // === LOAD SẢN PHẨM ===
  loadProduct(productId);

  // === ZOOM IMAGE ===
  const zoomBtn = document.getElementById("zoomBtn");
  const imageModal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const closeModal = document.querySelector(".close-modal");

  zoomBtn?.addEventListener("click", () => {
    const img = document.getElementById("productMainImage");
    if (img && img.src) {
      modalImage.src = img.src;
      imageModal.style.display = "flex";
    }
  });

  closeModal?.addEventListener("click", () => {
    imageModal.style.display = "none";
  });

  imageModal?.addEventListener("click", (e) => {
    if (e.target === imageModal) {
      imageModal.style.display = "none";
    }
  });

  // === ORDER FUNCTIONALITY ===
  let currentQuantity = 1;

  // Quantity controls
  const decreaseBtn = document.getElementById("decreaseBtn");
  const increaseBtn = document.getElementById("increaseBtn");
  const quantityInput = document.getElementById("quantity");

  decreaseBtn?.addEventListener("click", () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      quantityInput.value = currentQuantity;
    }
  });

  increaseBtn?.addEventListener("click", () => {
    const product = window.currentProduct;
    if (product && currentQuantity < product.stock) {
      currentQuantity++;
      quantityInput.value = currentQuantity;
    }
  });

  quantityInput?.addEventListener("change", (e) => {
    const product = window.currentProduct;
    const value = parseInt(e.target.value);
    if (product) {
      if (value < 1) {
        currentQuantity = 1;
      } else if (value > product.stock) {
        currentQuantity = product.stock;
      } else {
        currentQuantity = value;
      }
      quantityInput.value = currentQuantity;
    }
  });

  // Order button
  const orderBtn = document.getElementById("orderBtn");
  const orderModal = document.getElementById("orderModal");
  const closeOrderModal = document.getElementById("closeOrderModal");
  const cancelOrderBtn = document.getElementById("cancelOrderBtn");
  const orderForm = document.getElementById("orderForm");

  orderBtn?.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("token");
    const product = window.currentProduct;

    if (!user || !token) {
      alert("Vui lòng đăng nhập để đặt hàng!");
      window.location.href = "login.html";
      return;
    }

    if (!product || product.stock === 0) {
      alert("Sản phẩm hiện đang hết hàng!");
      return;
    }

    // Fill order summary
    document.getElementById("summaryProductName").textContent = product.name;
    document.getElementById("summaryQuantity").textContent = currentQuantity;
    document.getElementById("summaryPrice").textContent = formatPrice(product.price);
    const total = parseFloat(product.price) * currentQuantity;
    document.getElementById("summaryTotal").textContent = formatPrice(total);

    // Pre-fill phone if available
    if (user.phone) {
      document.getElementById("phone").value = user.phone;
    }

    orderModal.style.display = "flex";
  });

  closeOrderModal?.addEventListener("click", () => {
    orderModal.style.display = "none";
  });

  cancelOrderBtn?.addEventListener("click", () => {
    orderModal.style.display = "none";
  });

  orderModal?.addEventListener("click", (e) => {
    if (e.target === orderModal) {
      orderModal.style.display = "none";
    }
  });

  // Submit order
  orderForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const shippingAddress = document.getElementById("shippingAddress").value;
    const phone = document.getElementById("phone").value;
    const notes = document.getElementById("notes").value;

    if (!shippingAddress || !phone) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [
            {
              product_id: window.currentProduct.id,
              quantity: currentQuantity,
            },
          ],
          shipping_address: shippingAddress,
          phone: phone,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi đặt hàng");
      }

      alert("Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
      orderModal.style.display = "none";
      orderForm.reset();
      // Reload product to update stock
      loadProduct(window.currentProduct.id);
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    }
  });
});

async function loadProduct(id) {
  const loading = document.getElementById("loading");
  const productDetail = document.getElementById("productDetail");
  const errorMessage = document.getElementById("errorMessage");

  try {
    loading.style.display = "block";
    productDetail.style.display = "none";
    errorMessage.style.display = "none";

    const res = await fetch(`${API_URL}/products/${id}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        showError();
        return;
      }
      throw new Error("Lỗi tải sản phẩm");
    }

    const resData = await res.json();
    const product = resData.data;

    // Hiển thị sản phẩm
    displayProduct(product);

    loading.style.display = "none";
    productDetail.style.display = "block";
  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    showError();
  }
}

function displayProduct(product) {
  // Lưu product để dùng cho đặt hàng
  window.currentProduct = product;
  
  // Tên sản phẩm
  document.getElementById("productName").textContent = product.name;
  document.getElementById("productBreadcrumb").textContent = product.name;

  // Giá
  const price = formatPrice(product.price);
  document.getElementById("productPrice").textContent = price;

  // Số lượng
  const stockElement = document.getElementById("productStock");
  const quantityInput = document.getElementById("quantity");
  const orderBtn = document.getElementById("orderBtn");
  
  if (product.stock > 0) {
    stockElement.textContent = `✓ Còn ${product.stock} sản phẩm`;
    stockElement.className = "product-stock in-stock";
    if (quantityInput) {
      quantityInput.max = product.stock;
      quantityInput.value = 1;
    }
    if (orderBtn) {
      orderBtn.disabled = false;
      orderBtn.textContent = "🛒 Đặt hàng ngay";
    }
  } else {
    stockElement.textContent = "✗ Hết hàng";
    stockElement.className = "product-stock out-of-stock";
    if (quantityInput) {
      quantityInput.max = 0;
      quantityInput.value = 0;
      quantityInput.disabled = true;
    }
    if (orderBtn) {
      orderBtn.disabled = true;
      orderBtn.textContent = "Hết hàng";
    }
  }

  // Mô tả
  const description = product.description || "Không có mô tả cho sản phẩm này.";
  document.getElementById("productDescription").textContent = description;

  // Hình ảnh
  const imageElement = document.getElementById("productMainImage");
  if (product.image) {
    imageElement.src = `http://localhost:5000/api/products/images/${product.image}`;
  } else if (product.image_url) {
    const imageUrl = product.image_url.startsWith('http') 
      ? product.image_url 
      : `http://localhost:5000${product.image_url}`;
    imageElement.src = imageUrl;
  } else {
    // Ảnh mặc định
    imageElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect fill='%23ddd' width='500' height='500'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  }
  
  imageElement.alt = product.name;
  imageElement.onerror = function() {
    this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect fill='%23ddd' width='500' height='500'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  };

  // Thông tin chi tiết
  document.getElementById("productId").textContent = `#${product.id}`;
  
  const statusText = product.stock > 0 ? "Còn hàng" : "Hết hàng";
  document.getElementById("productStatus").textContent = statusText;
  
  if (product.created_at) {
    const date = new Date(product.created_at);
    document.getElementById("productDate").textContent = date.toLocaleDateString("vi-VN");
  } else {
    document.getElementById("productDate").textContent = "—";
  }
}

function showError() {
  const loading = document.getElementById("loading");
  const productDetail = document.getElementById("productDetail");
  const errorMessage = document.getElementById("errorMessage");

  loading.style.display = "none";
  productDetail.style.display = "none";
  errorMessage.style.display = "block";
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}


