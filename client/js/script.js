/* ============================================
   SCRIPT.JS - CHUNG CHO TOÀN SITE
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
  checkAuthStatus();

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
});

function initNavigation() {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () =>
      navMenu.classList.toggle("active")
    );
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navMenu.classList.remove("active"));
    });
  }
}

function checkAuthStatus() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const loginLink = document.getElementById("loginLink");
  const profileLink = document.getElementById("profileLink");
  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (profileLink) profileLink.style.display = "block";
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (profileLink) profileLink.style.display = "none";
  }
}

/* ============================================
   SCRIPT.JS - NAV + AUTH (CHUNG CHO TẤT CẢ TRANG)
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  const loginLink = document.getElementById("loginLink");
  const profileLink = document.getElementById("profileLink");
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  // === HÀM KIỂM TRA ĐĂNG NHẬP ===
  window.checkAuth = function () {
    const user = localStorage.getItem("currentUser");
    if (user) {
      if (loginLink) loginLink.style.display = "none";
      if (profileLink) profileLink.style.display = "block";
    } else {
      if (loginLink) loginLink.style.display = "block";
      if (profileLink) profileLink.style.display = "none";
    }
  };

  // === NAV TOGGLE (MOBILE) ===
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  // === KIỂM TRA ĐĂNG NHẬP KHI LOAD TRANG ===
  checkAuth();
});
