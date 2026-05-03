// ============================================
//  main.js — Connected to Firebase/Firestore
//  Projects are fetched + rendered dynamically
// ============================================

import { getProjects } from "./firebase.js";

// ─── CURSOR ───────────────────────────────────
const cursor   = document.getElementById("cursor");
const follower = document.getElementById("cursorFollower");
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener("mousemove", e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + "px";
  cursor.style.top  = my + "px";
});

(function animateFollower() {
  fx += (mx - fx) * 0.1;
  fy += (my - fy) * 0.1;
  follower.style.left = fx + "px";
  follower.style.top  = fy + "px";
  requestAnimationFrame(animateFollower);
})();

// ─── NAV SCROLL ───────────────────────────────
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

// ─── MOBILE MENU ──────────────────────────────
const hamburger  = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileMenu.classList.toggle("open");
  document.body.style.overflow = mobileMenu.classList.contains("open") ? "hidden" : "";
});

document.querySelectorAll(".mobile-link").forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("open");
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  });
});

// ─── SCROLL REVEAL ────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal-up").forEach(el => revealObserver.observe(el));

// ─── PORTFOLIO (DYNAMIC) ─────────────────────
const grid       = document.getElementById("portfolioGrid");
const filterBtns = document.querySelectorAll(".filter-btn");

// Human-readable category labels
const CATEGORY_LABELS = {
  branding: "Brand Identity",
  logo:     "Logo Design",
  flyer:    "Flyer Design",
  social:   "Social Media Kit",
  motion:   "Motion Graphics",
  print:    "Print Design",
};

// Gradient fallback per category (shown while image loads or if no image)
const FALLBACKS = {
  branding: "linear-gradient(160deg,#1a0a2e,#3d1a5e,#7b3fa0)",
  logo:     "linear-gradient(160deg,#2d1b00,#6b3a00,#c8780a)",
  flyer:    "linear-gradient(160deg,#0d0d0d,#1a1a1a,#2e2e2e)",
  social:   "linear-gradient(160deg,#003d2b,#006644,#00a86b)",
  motion:   "linear-gradient(160deg,#001a3d,#003080,#0057cc)",
  print:    "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",
};

let allProjects = [];

// Build one card DOM element from a Firestore project
function buildCard(project, index) {
  const { id, title, category, imageURL } = project;
  const label  = CATEGORY_LABELS[category] || category;
  const num    = String(index + 1).padStart(2, "0");

  // Layout variation: every 5-card cycle has a tall + wide card
  const isTall = index % 5 === 1;
  const isWide = index % 5 === 3;

  const article = document.createElement("article");
  article.className = [
    "project-card",
    isTall ? "project-card--tall" : "",
    isWide ? "project-card--wide" : "",
  ].filter(Boolean).join(" ");

  article.dataset.category = category;
  article.dataset.id       = id;
  article.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  // Use real image if available, fallback gradient otherwise
  const bgStyle = imageURL
    ? `background-image: url('${imageURL}'); background-size: cover; background-position: center;`
    : `background: ${FALLBACKS[category] || FALLBACKS.branding};`;

  article.innerHTML = `
    <div class="card-img-wrap">
      <div class="card-img" style="${bgStyle}"></div>
      <div class="card-overlay">
        <span class="card-view">View Project →</span>
      </div>
      <span class="card-num">${num}</span>
    </div>
    <div class="card-info">
      <h3 class="card-title">${title}</h3>
      <span class="card-cat">${label}</span>
    </div>
  `;

  // Click → project detail page
  article.addEventListener("click", () => {
    window.location.href = `project.html?id=${id}`;
  });

  return article;
}

// Render cards into grid, filtered by category
function renderCards(filter = "all") {
  const filtered = filter === "all"
    ? allProjects
    : allProjects.filter(p => p.category === filter);

  // Fade the grid out
  grid.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  grid.style.opacity    = "0";
  grid.style.transform  = "translateY(8px)";

  setTimeout(() => {
    grid.innerHTML = "";

    if (filtered.length === 0) {
      grid.innerHTML = `<p class="grid-empty">No projects in this category yet.</p>`;
    } else {
      filtered.forEach((p, i) => grid.appendChild(buildCard(p, i)));
    }

    // Fade back in
    grid.style.opacity   = "1";
    grid.style.transform = "translateY(0)";
  }, 250);
}

// Show skeleton placeholders while loading
function showSkeletons(count = 6) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "project-card skeleton-card";
    sk.innerHTML = `<div class="skeleton-shimmer"></div>`;
    grid.appendChild(sk);
  }
}

// Fetch from Firestore and render
async function loadProjects() {
  showSkeletons();
  try {
    // Only show published projects on the public site
    const all = await getProjects();
    allProjects = all.filter(p => p.published === true || p.published === "true");
    renderCards("all");
  } catch (err) {
    console.error("Failed to load projects:", err);
    grid.innerHTML = `
      <div class="grid-error">
        <p>Couldn't load projects right now.</p>
        <p style="font-size:0.75rem;opacity:0.5;margin-top:0.5rem">${err.message}</p>
      </div>
    `;
  }
}

// Filter button clicks
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderCards(btn.dataset.filter);
  });
});

// ─── CONTACT FORM ─────────────────────────────
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const btn = form.querySelector(".btn-submit");
    btn.textContent   = "Sending…";
    btn.style.opacity = "0.7";
    // TODO: wire up EmailJS or a backend function here
    setTimeout(() => {
      btn.textContent      = "Message sent ✓";
      btn.style.background = "#3ecf8e";
      btn.style.opacity    = "1";
      form.reset();
      setTimeout(() => {
        btn.textContent      = "Send message →";
        btn.style.background = "";
      }, 3000);
    }, 1200);
  });
}

// ─── INIT ─────────────────────────────────────
// Remove all hardcoded HTML cards — grid is now 100% data-driven
grid.innerHTML = "";
loadProjects();
