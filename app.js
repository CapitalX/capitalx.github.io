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

// Update modal functionality to include success screen
function showSuccessScreen() {
  const modalContent = document.querySelector(".modal-content");
  modalContent.innerHTML = `
    <div class="success-screen">
      <div class="icon-container">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2>Message Sent!</h2>
      <p>Thank you for reaching out. I'll get back to you soon.</p>
      <button onclick="closeModal()">Close</button>
    </div>
  `;
}

// Send email (using EmailJS)
document.getElementById("form").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent page reload

  const btn = document.getElementById("button");
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const messageField = document.getElementById("message");
  const timeField = document.getElementById("time");

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailField.value)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Ensure all fields are filled
  if (!nameField.value || !emailField.value || !messageField.value) {
    alert("All fields are required.");
    return;
  }

  btn.value = "Sending...";

  // Autopopulate the time field
  timeField.value = new Date().toISOString();

  const formattedName = `${nameField.value} | ${emailField.value}`;

  const serviceID = "default_service";
  const templateID = "template_witgj8m";

  emailjs
    .send(serviceID, templateID, {
      name: formattedName,
      message: messageField.value,
      time: timeField.value,
    })
    .then(
      () => {
        btn.value = "Send Email";
        showSuccessScreen(); // Show success screen on success
      },
      (err) => {
        btn.value = "Send Email";
        alert("Failed to send email. Please try again.");
        console.error(err);
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

// View Toggle and Dynamic Content
const toggleViewButton = document.getElementById("toggleViewButton");
const viewToggle = document.getElementById("viewToggle");
const viewerCard = document.getElementById("viewer-card");

// Initialize view state
let currentView = "BeatsByCapitalX";

// Toggle view on button click
toggleViewButton.addEventListener("click", () => {
  currentView = currentView === "BeatsByCapitalX" ? "XTech" : "BeatsByCapitalX";
  updateView(currentView);
});

// Update view content
function updateView(view) {
  viewToggle.textContent = view;
  toggleViewButton.textContent = view === "BeatsByCapitalX" ? "Switch to XTech" : "Switch to BeatsByCapitalX";

  if (view === "BeatsByCapitalX") {
    viewerCard.innerHTML = `
      <div class="viewer-card">
        <h2>Capital X 🎧</h2>
        <div class="viewer-content">
          <iframe
            style="border-radius: 12px; width: 100%; height: 380px"
            src="https://open.spotify.com/embed/album/12z3l71d1e2FjLWAS14NCD?utm_source=generator&theme=0"
            frameborder="0"
            allowfullscreen=""
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/zFIuqzCdOOA"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
          <div class="soundcloud-container">
            <iframe
              width="100%"
              height="300"
              scrolling="no"
              frameborder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1269104419&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
            ></iframe>
          </div>
        </div>
      </div>
    `;
  } else {
    viewerCard.innerHTML = `
      <div class="viewer-card">
        <h2>XTech AI Automation</h2>
        <div class="viewer-content">
          <p>Explore cutting-edge AI and automation projects.</p>
          <div class="project-card">
            <h3>Project 1: AI Chatbot</h3>
            <p>An intelligent chatbot powered by OpenAI and LangChain.</p>
          </div>
          <div class="project-card">
            <h3>Project 2: Workflow Automation</h3>
            <p>Streamline your business processes with custom automation solutions.</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize the default view
updateView(currentView);

// Single DOMContentLoaded listener for all initializations
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded"); // Debug log

  // Initialize features in order
  initHeaderBehavior();
  load3DModel();
  // Removed typewriterEffect() call to avoid conflicts with TypewriterJS in index.html
});
