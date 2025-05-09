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
    const target = document.querySelector(this.getAttribute("href"));
    const offset = 80; // Adjust for navbar height
    const targetPosition = target.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
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

// Modal functionality
function openModal() {
  document.getElementById("contactModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("contactModal").style.display = "none";
}

// Send email (using EmailJS)
document.getElementById("form").addEventListener("submit", function (event) {
  event.preventDefault();

  const btn = document.getElementById("button");
  btn.value = "Sending...";

  // Autopopulate the time field
  const timeField = document.getElementById("time");
  timeField.value = new Date().toISOString();

  const serviceID = "default_service";
  const templateID = "template_witgj8m";

  emailjs.sendForm(serviceID, templateID, this).then(
    () => {
      btn.value = "Send Email";
      alert("Sent!");
      closeModal();
    },
    (err) => {
      btn.value = "Send Email";
      alert(JSON.stringify(err));
    }
  );
});

// Close modal on outside click
window.addEventListener("click", (event) => {
  const modal = document.getElementById("contactModal");
  if (event.target === modal) {
    closeModal();
  }
});

// Single DOMContentLoaded listener for all initializations
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded"); // Debug log

  // Initialize features in order
  initHeaderBehavior();
  load3DModel();
  // Removed typewriterEffect() call to avoid conflicts with TypewriterJS in index.html
});
