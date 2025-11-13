// ------------- SLIDE SETUP -------------

const slides = Array.from(document.querySelectorAll(".slide"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideDotsContainer = document.getElementById("slideDots");

let currentSlideIndex = 0;

// build dots
slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.className = "slide-dot";
  dot.type = "button";
  dot.dataset.index = String(index);
  slideDotsContainer.appendChild(dot);
});

const dots = Array.from(document.querySelectorAll(".slide-dot"));

function layoutSlides() {
  slides.forEach((slide, index) => {
    const offset = index - currentSlideIndex; // -1, 0, 1, ...
    slide.style.setProperty("--slide-offset", offset);
    slide.classList.toggle("is-active", index === currentSlideIndex);
    slide.classList.toggle("is-far", Math.abs(offset) > 1);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentSlideIndex);
  });

  // update hash (1-based)
  const hashIndex = currentSlideIndex + 1;
  if (location.hash !== `#${hashIndex}`) {
    history.replaceState(null, "", `#${hashIndex}`);
  }

  // nudge parallax so slide move is visible
  applyParallax(lastMouseXRatio, lastMouseYRatio);
}

function goToSlide(newIndex) {
  if (newIndex < 0 || newIndex >= slides.length) return;
  currentSlideIndex = newIndex;
  layoutSlides();
}

// initial index from hash
(function initFromHash() {
  const hash = location.hash.replace("#", "");
  const asNum = Number(hash);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= slides.length) {
    currentSlideIndex = asNum - 1;
  }
})();

layoutSlides();

// nav buttons
prevBtn.addEventListener("click", () => {
  goToSlide(currentSlideIndex - 1);
});

nextBtn.addEventListener("click", () => {
  goToSlide(currentSlideIndex + 1);
});

// dots click
dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.index || "0");
    goToSlide(index);
  });
});

// keyboard navigation
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    goToSlide(currentSlideIndex + 1);
  } else if (event.key === "ArrowLeft") {
    goToSlide(currentSlideIndex - 1);
  }
});

// ------------- PARALLAX ENGINE -------------

const parallaxLayers = Array.from(
  document.querySelectorAll(".parallax-layer")
);

let parallaxStrengthX = 40; // mouse based
let parallaxStrengthY = 25;

const slideParallaxShift = 140; // pixels per slide at depth 1.0

let lastMouseXRatio = 0.5;
let lastMouseYRatio = 0.5;

function applyParallax(mouseXRatio, mouseYRatio) {
  lastMouseXRatio = mouseXRatio;
  lastMouseYRatio = mouseYRatio;

  parallaxLayers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth || "0");
    const mouseOffsetX = (mouseXRatio - 0.5) * parallaxStrengthX * depth;
    const mouseOffsetY = (mouseYRatio - 0.5) * parallaxStrengthY * depth;
    const slideOffsetX = currentSlideIndex * slideParallaxShift * depth;

    const x = mouseOffsetX + slideOffsetX;
    const y = mouseOffsetY;

    layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

// mouse move
window.addEventListener("mousemove", (event) => {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const xRatio = event.clientX / w;
  const yRatio = event.clientY / h;
  applyParallax(xRatio, yRatio);
});

// set initial state
applyParallax(0.5, 0.5);

// ------------- PRESETS & BLUR CONTROLS -------------

const rootStyle = document.documentElement.style;
const presetButtons = Array.from(document.querySelectorAll(".preset-btn"));

const blurBgInput = document.getElementById("blurBg");
const blurLayer3Input = document.getElementById("blurLayer3");
const blurLayer2Input = document.getElementById("blurLayer2");
const blurMainInput = document.getElementById("blurMain");

const presets = {
  subtle: {
    strengthX: 25,
    strengthY: 18,
    blurBg1: 1.5,
    blurLayer3: 2,
    blurLayer2: 1.2,
    blurMain: 0
  },
  medium: {
    strengthX: 40,
    strengthY: 25,
    blurBg1: 2.5,
    blurLayer3: 3,
    blurLayer2: 1.6,
    blurMain: 0
  },
  deep: {
    strengthX: 60,
    strengthY: 32,
    blurBg1: 4,
    blurLayer3: 4.5,
    blurLayer2: 2.2,
    blurMain: 0.4
  }
};

function applyBlurVars({
  blurBg1,
  blurLayer3,
  blurLayer2,
  blurMain
}) {
  rootStyle.setProperty("--blur-bg1", `${blurBg1}px`);
  rootStyle.setProperty("--blur-layer3", `${blurLayer3}px`);
  rootStyle.setProperty("--blur-layer2", `${blurLayer2}px`);
  rootStyle.setProperty("--blur-main", `${blurMain}px`);

  // sync sliders
  blurBgInput.value = String(blurBg1);
  blurLayer3Input.value = String(blurLayer3);
  blurLayer2Input.value = String(blurLayer2);
  blurMainInput.value = String(blurMain);
}

function activatePreset(name) {
  const preset = presets[name];
  if (!preset) return;

  parallaxStrengthX = preset.strengthX;
  parallaxStrengthY = preset.strengthY;
  applyBlurVars(preset);

  presetButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.preset === name);
  });

  // re-apply parallax with new strengths
  applyParallax(lastMouseXRatio, lastMouseYRatio);
}

// preset button events
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const presetName = btn.dataset.preset;
    activatePreset(presetName);
  });
});

// slider events – fine tuning per layer
function handleBlurInput() {
  const bg = Number(blurBgInput.value || "0");
  const l3 = Number(blurLayer3Input.value || "0");
  const l2 = Number(blurLayer2Input.value || "0");
  const main = Number(blurMainInput.value || "0");

  rootStyle.setProperty("--blur-bg1", `${bg}px`);
  rootStyle.setProperty("--blur-layer3", `${l3}px`);
  rootStyle.setProperty("--blur-layer2", `${l2}px`);
  rootStyle.setProperty("--blur-main", `${main}px`);
}

[blurBgInput, blurLayer3Input, blurLayer2Input, blurMainInput].forEach(
  (input) => {
    input.addEventListener("input", handleBlurInput);
  }
);

// initialize to "deep 3D" by default if you want strong depth,
// or switch to "medium" / "subtle" here.
activatePreset("deep");
