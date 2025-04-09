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

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// 3D Model Loading
function load3DModel() {
  // Placeholder: Add your 3D model loading logic here
  console.log("Loading 3D model...");
}

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

function typewriterEffect(elementId, words, typingSpeed = 150, delay = 2000) {
  const element = document.getElementById(elementId);
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    const displayText = isDeleting
      ? currentWord.substring(0, charIndex--)
      : currentWord.substring(0, charIndex++);

    element.textContent = displayText;

    if (!isDeleting && charIndex === currentWord.length) {
      setTimeout(() => (isDeleting = true), delay);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }

    const nextSpeed = isDeleting ? typingSpeed / 2 : typingSpeed;
    setTimeout(type, nextSpeed);
  }

  type();
}

function typeWords(elementSelector, words, typingSpeed = 150, pause = 2000) {
  const element = document.querySelector(elementSelector);
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    const displayText = isDeleting
      ? currentWord.substring(0, charIndex--)
      : currentWord.substring(0, charIndex++);

    element.textContent = displayText;

    if (!isDeleting && charIndex === currentWord.length) {
      setTimeout(() => (isDeleting = true), pause);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }

    const nextSpeed = isDeleting ? typingSpeed / 2 : typingSpeed;
    setTimeout(type, nextSpeed);
  }

  type();
}

// Single DOMContentLoaded listener for all initializations
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded"); // Debug log

  // Initialize features in order
  initHeaderBehavior();
  load3DModel();
  typewriterEffect("typewriter", ["Technologist", "DJ", "Developer"]); // Corrected words array
});
