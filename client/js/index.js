/* ============================================
   INDEX.JS - TRANG CHỦ: HERO SLIDER
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
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
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  const slides = document.querySelectorAll(".hero-slide");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const dotsContainer = document.getElementById("sliderDots");

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Tạo dots
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("div");
    dot.classList.add("slider-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  }
  const dots = document.querySelectorAll(".slider-dot");

  function updateSlider() {
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, idx) =>
      dot.classList.toggle("active", idx === currentIndex)
    );
  }

  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlider();
  }

  prevBtn.addEventListener("click", prevSlide);
  nextBtn.addEventListener("click", nextSlide);

  // Auto slide
  let autoSlide = setInterval(nextSlide, 5000);
  const hero = slider.parentElement;
  hero.addEventListener("mouseenter", () => clearInterval(autoSlide));
  hero.addEventListener(
    "mouseleave",
    () => (autoSlide = setInterval(nextSlide, 5000))
  );

  // Touch swipe
  let touchStartX = 0;
  hero.addEventListener(
    "touchstart",
    (e) => (touchStartX = e.touches[0].clientX),
    { passive: true }
  );
  hero.addEventListener(
    "touchend",
    (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
    },
    { passive: true }
  );
});
