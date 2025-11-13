// ---- SAFETY HELPERS ----
function $(selector, scope = document) {
  return scope.querySelector(selector);
}
function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

// ---- SLIDE LOGIC ----
const slides = $all(".slide");
const viewport = $("#slidesViewport");
const prevBtn = $("#prevSlideBtn");
const nextBtn = $("#nextSlideBtn");
const dotsContainer = $("#slideDots");

let currentIndex = 0;
const totalSlides = slides.length;

// build dots
if (dotsContainer && totalSlides > 0) {
  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "slide-dot" + (index === 0 ? " is-active" : "");
    dot.setAttribute("type", "button");
    dot.dataset.index = String(index);
    dotsContainer.appendChild(dot);
  });
}

const dots = $all(".slide-dot");

function updateSlides() {
  slides.forEach((slide, index) => {
    const offset = index - currentIndex;
    slide.style.setProperty("--slide-offset", offset);

    if (index === currentIndex) {
      slide.classList.add("is-active");
      slide.classList.remove("is-far");
    } else {
      slide.classList.remove("is-active");
      // fade distant slides a bit more
      if (Math.abs(offset) > 1) {
        slide.classList.add("is-far");
      } else {
        slide.classList.remove("is-far");
      }
    }
  });

  dots.forEach((dot, index) => {
    if (index === currentIndex) {
      dot.classList.add("is-active");
    } else {
      dot.classList.remove("is-active");
    }
  });

  applyParallax();
}

function goToSlide(index) {
  if (!totalSlides) return;
  const clamped =
    ((index % totalSlides) + totalSlides) % totalSlides; // wrap safely
  currentIndex = clamped;
  updateSlides();
}

// initial state
if (totalSlides) {
  updateSlides();
}

// button events
if (prevBtn) {
  prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
}
if (nextBtn) {
  nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));
}

// dot click events
dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const idx = parseInt(dot.dataset.index || "0", 10);
    goToSlide(idx);
  });
});

// keyboard
document.addEventListener("keydown", (evt) => {
  if (evt.key === "ArrowRight") {
    goToSlide(currentIndex + 1);
  } else if (evt.key === "ArrowLeft") {
    goToSlide(currentIndex - 1);
  }
});

// basic touch swipe for mobile
let touchStartX = null;

viewport &&
  viewport.addEventListener(
    "touchstart",
    (evt) => {
      const t = evt.touches[0];
      touchStartX = t.clientX;
    },
    { passive: true }
  );

viewport &&
  viewport.addEventListener(
    "touchend",
    (evt) => {
      if (touchStartX === null) return;
      const t = evt.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const threshold = 50; // px
      if (dx > threshold) {
        goToSlide(currentIndex - 1);
      } else if (dx < -threshold) {
        goToSlide(currentIndex + 1);
      }
      touchStartX = null;
    },
    { passive: true }
  );

// ---- PARALLAX / BLUR LOGIC ----
const rootStyle = document.documentElement.style;
const parallaxLayers = $all(".parallax-layer");

// preset buttons
const presetButtons = $all(".preset-btn");

// blur sliders
const blurBg = $("#blurBg");
const blurMid1 = $("#blurMid1");
const blurMid2 = $("#blurMid2");
const blurFore = $("#blurFore");

// apply blur from sliders
function syncBlurFromSliders() {
  if (blurBg) rootStyle.setProperty("--blur-bg1", blurBg.value + "px");
  if (blurMid1) rootStyle.setProperty("--blur-layer3", blurMid1.value + "px");
  if (blurMid2) rootStyle.setProperty("--blur-layer2", blurMid2.value + "px");
  if (blurFore) rootStyle.setProperty("--blur-main", blurFore.value + "px");
}

[blurBg, blurMid1, blurMid2, blurFore].forEach((input) => {
  if (!input) return;
  input.addEventListener("input", syncBlurFromSliders);
});

syncBlurFromSliders();

// presets
function applyPreset(name) {
  presetButtons.forEach((btn) =>
    btn.classList.toggle("is-active", btn.dataset.preset === name)
  );

  if (name === "subtle") {
    if (blurBg) blurBg.value = "1.5";
    if (blurMid1) blurMid1.value = "2.0";
    if (blurMid2) blurMid2.value = "1.0";
    if (blurFore) blurFore.value = "0";
  } else if (name === "medium") {
    if (blurBg) blurBg.value = "2.5";
    if (blurMid1) blurMid1.value = "3.0";
    if (blurMid2) blurMid2.value = "1.8";
    if (blurFore) blurFore.value = "0.25";
  } else if (name === "deep") {
    if (blurBg) blurBg.value = "3.5";
    if (blurMid1) blurMid1.value = "4.0";
    if (blurMid2) blurMid2.value = "2.5";
    if (blurFore) blurFore.value = "0.5";
  }

  syncBlurFromSliders();
  applyParallax();
}

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.preset || "medium";
    applyPreset(name);
  });
});

// horizontal parallax tied to slide index and pointer movement
let pointerOffsetX = 0;
let pointerOffsetY = 0;

function applyParallax() {
  if (!parallaxLayers.length) return;

  const progress =
    totalSlides > 1 ? currentIndex / (totalSlides - 1) : 0.5; // 0 → 1

  parallaxLayers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || "0.5");
    const baseX = (progress - 0.5) * depth * 60; // slide-based
    const pointerX = pointerOffsetX * depth * 20;
    const pointerY = pointerOffsetY * depth * 16;

    const translateX = baseX + pointerX;
    const translateY = pointerY;

    layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(1.02)`;
  });
}

// pointer-based parallax (desktop)
const parallaxRoot = $("#parallaxRoot");
if (parallaxRoot) {
  parallaxRoot.addEventListener("pointermove", (evt) => {
    const rect = parallaxRoot.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / rect.width; // 0–1
    const y = (evt.clientY - rect.top) / rect.height;
    pointerOffsetX = x - 0.5;
    pointerOffsetY = y - 0.5;
    applyParallax();
  });
}

// update on resize just in case
window.addEventListener("resize", applyParallax);

// initial parallax
applyParallax();
