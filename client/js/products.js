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
    const loginLink = document.getElementById("loginLink");
    const profileLink = document.getElementById("profileLink");
    if (loginLink) loginLink.style.display = "none";
    if (profileLink) {
      profileLink.style.display = "block";
      profileLink.textContent = user.name || "Hồ sơ";
    }
  }

  // === LOAD SẢN PHẨM ===
  loadProducts();

  // === SEARCH ===
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadProducts(this.value);
      }, 300);
    });
  }
});

async function loadProducts(searchTerm = "") {
  const productsGrid = document.getElementById("productsGrid");
  const loading = document.getElementById("loading");
  const noProducts = document.getElementById("noProducts");

  try {
    loading.style.display = "block";
    productsGrid.innerHTML = "";
    noProducts.style.display = "none";

    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Lỗi tải sản phẩm");

    const resData = await res.json();
    let products = resData.data || [];

    // Filter theo search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }

    loading.style.display = "none";

    if (products.length === 0) {
      noProducts.style.display = "block";
      return;
    }

    // Render products
    products.forEach((product) => {
      const card = createProductCard(product);
      productsGrid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    loading.style.display = "none";
    noProducts.style.display = "block";
    noProducts.textContent = "Lỗi tải sản phẩm. Vui lòng thử lại.";
  }
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.style.cursor = "pointer";
  card.addEventListener("click", () => {
    window.location.href = `Product.html?id=${product.id}`;
  });

  // Sửa đường dẫn ảnh - sử dụng đúng API endpoint
  let imageUrl = "";
  if (product.image) {
    imageUrl = `http://localhost:5000/api/products/images/${product.image}`;
  } else if (product.image_url) {
    imageUrl = product.image_url.startsWith('http') 
      ? product.image_url 
      : `http://localhost:5000${product.image_url}`;
  } else {
    imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  }

  const stockClass = product.stock > 0 ? "in-stock" : "out-of-stock";
  const stockText = product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng";

  card.innerHTML = `
    <img src="${imageUrl}" 
         alt="${product.name}" 
         class="product-image" 
         onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'300\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'300\\' height=\\'300\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'18\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3ENo Image%3C/text%3E%3C/svg%3E'">
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-description">${product.description || "Không có mô tả"}</p>
      <div class="product-footer">
        <div>
          <div class="product-price">${formatPrice(product.price)}</div>
          <div class="product-stock ${stockClass}">${stockText}</div>
        </div>
      </div>
    </div>
  `;

  return card;
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}


