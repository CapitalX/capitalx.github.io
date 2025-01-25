// Dark Mode Toggle
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;

darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", body.classList.contains("dark-mode"));
});

if (localStorage.getItem("darkMode") === "true") {
  body.classList.add("dark-mode");
}
[1];

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});
[2];

// 3D Model Loading
function load3DModel() {
  // Placeholder: Add your 3D model loading logic here
  console.log("Loading 3D model...");
}
[3];

// Intersection Observer for Animations
const observerOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: "0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
    }
  });
}, observerOptions);

document.querySelectorAll(".animate-on-scroll").forEach((element) => {
  observer.observe(element);
});

// Header scroll behavior
function initHeaderBehavior() {
  const header = document.querySelector(".navbar");
  let lastScroll = 0;
  let scrollTimeout;

  function handleScroll() {
    const currentScroll = window.scrollY;

    // Fade in/out based on scroll position
    const opacity = Math.min(currentScroll / 200, 1);
    header.style.background = `rgba(10, 10, 15, ${opacity * 0.95})`;
    header.style.backdropFilter = `blur(${opacity * 12}px)`;

    // Always show header at the top of the page
    if (currentScroll < 100) {
      header.classList.remove("hidden");
      header.classList.remove("scrolled");
      return;
    }

    // Add scrolled class for border
    if (currentScroll > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Handle hide/show based on scroll direction
    if (currentScroll > lastScroll && currentScroll > 200) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }

    lastScroll = currentScroll;
  }

  // Throttled scroll handler
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 16); // ~60fps
      }
    },
    { passive: true }
  );

  // Initial call
  handleScroll();
}

// Initialize header behavior when DOM is loaded
document.addEventListener("DOMContentLoaded", initHeaderBehavior);

// Import the modal functions
import { showModal, hideModal } from "./public/js/nowgpt-modal.js";

// Initialize modal handlers
function initModalHandlers() {
  // Find all demo buttons
  const demoButtons = document.querySelectorAll(".try-demo-btn");

  demoButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      showModal();
    });
  });

  // Also expose to window for direct access
  window.showNowGPTModal = showModal;
  window.hideNowGPTModal = hideModal;
}

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
  load3DModel();
  initHeaderBehavior();
  initModalHandlers();
  // ... other initializations
});
