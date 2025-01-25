// Import the modal class first
import { NowGPTModal } from "/js/nowgpt-modal.js";

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

// Initialize modal handlers
function initModalHandlers() {
  console.log("Initializing modal handlers"); // Debug log

  // Create modal instance
  const modal = new NowGPTModal();

  // Find all demo buttons with data-project attribute
  const demoButtons = document.querySelectorAll(
    "button[data-project='nowgpt']"
  );
  console.log("Found demo buttons:", demoButtons.length); // Debug log

  if (demoButtons.length === 0) {
    console.error("No demo buttons found with data-project='nowgpt'");
    return;
  }

  demoButtons.forEach((button, index) => {
    console.log(`Adding click listener to button ${index}`); // Debug log
    button.addEventListener("click", (e) => {
      e.preventDefault();
      console.log(`Button ${index} clicked`); // Debug log
      modal.showModal();
    });
  });
}

// Single DOMContentLoaded listener for all initializations
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded"); // Debug log

  // Initialize features in order
  initModalHandlers();
  initHeaderBehavior();
  load3DModel();

  // Remove the other DOMContentLoaded listeners
});
