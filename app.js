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
    const header = document.querySelector('.navbar');
    let lastScroll = 0;
    let scrollTimeout;

    function handleScroll() {
        const currentScroll = window.scrollY;
        
        // Always show header at the top of the page
        if (currentScroll < 100) {
            header.classList.remove('hidden');
            header.classList.remove('scrolled');
            return;
        }

        // Add scrolled class for background
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Handle hide/show based on scroll direction
        if (currentScroll > lastScroll && currentScroll > 200) {
            // Scrolling down & not at top
            header.classList.add('hidden');
        } else {
            // Scrolling up
            header.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    }

    // Throttled scroll handler
    function throttledScroll() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                handleScroll();
                scrollTimeout = null;
            }, 150);
        }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true });
}

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
  load3DModel();
  initHeaderBehavior();

  // Initialize other components or features here
});
