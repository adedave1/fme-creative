// ============================================
//  main.js — Connected to Firebase/Firestore
// ============================================

import { getProjects } from "./firebase.js";

// ─── LOADER ───────────────────────────────────
const loader    = document.getElementById("loader");
const loaderBar = document.getElementById("loaderBar");
const loaderPct = document.getElementById("loaderPct");

function runLoader(onDone) {
  let pct = 0;
  const tick = setInterval(() => {
    pct += Math.random() * 18;
    if (pct >= 100) { pct = 100; clearInterval(tick); }
    loaderBar.style.width = pct + "%";
    loaderPct.textContent = Math.floor(pct) + "%";
    if (pct === 100) setTimeout(onDone, 320);
  }, 80);
}

function hideLoader() {
  loader.classList.add("loader--done");
  setTimeout(() => loader.remove(), 700);
}

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

// ─── WHATSAPP FLOAT SHOW ON SCROLL ────────────
const waFloat = document.getElementById("waFloat");
window.addEventListener("scroll", () => {
  waFloat.classList.toggle("wa-float--visible", window.scrollY > 400);
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

// ─── LIGHTBOX ─────────────────────────────────
const lightbox         = document.getElementById("lightbox");
const lightboxBackdrop = document.getElementById("lightboxBackdrop");
const lightboxClose    = document.getElementById("lightboxClose");
const lightboxImg      = document.getElementById("lightboxImg");
const lightboxFallback = document.getElementById("lightboxFallback");
const lightboxCat      = document.getElementById("lightboxCat");
const lightboxTitle    = document.getElementById("lightboxTitle");
const lightboxDesc     = document.getElementById("lightboxDesc");
const lightboxTags     = document.getElementById("lightboxTags");

const CATEGORY_LABELS = {
  branding: "Brand Identity",
  logo:     "Logo Design",
  flyer:    "Flyer Design",
  social:   "Social Media Kit",
  motion:   "Motion Graphics",
  print:    "Print Design",
};

const FALLBACKS = {
  branding: "linear-gradient(160deg,#0d1a3a,#1a3a6e,#2d5fa0)",
  logo:     "linear-gradient(160deg,#0d1425,#1a2f55,#254d8a)",
  flyer:    "linear-gradient(160deg,#080d18,#111b30,#1e3060)",
  social:   "linear-gradient(160deg,#062040,#0d3a70,#1a5ca8)",
  motion:   "linear-gradient(160deg,#050d25,#0d1f4a,#1a3a8a)",
  print:    "linear-gradient(160deg,#080f20,#121e40,#1e3070)",
};

function openLightbox(project) {
  const { title, category, description, tags, imageURL } = project;
  const label = CATEGORY_LABELS[category] || category;

  lightboxCat.textContent   = label;
  lightboxTitle.textContent = title;
  lightboxDesc.textContent  = description || "A beautifully crafted project by FME Creative.";

  lightboxTags.innerHTML = (tags || [])
    .map(t => `<span class="lightbox-tag">${t}</span>`)
    .join("");

  if (imageURL) {
    lightboxImg.src                = imageURL;
    lightboxImg.alt                = title;
    lightboxImg.style.display      = "block";
    lightboxFallback.style.display = "none";
  } else {
    lightboxImg.style.display      = "none";
    lightboxFallback.style.background = FALLBACKS[category] || FALLBACKS.branding;
    lightboxFallback.style.display = "flex";
  }

  lightbox.classList.add("lightbox--open");
  lightboxBackdrop.classList.add("lightbox-backdrop--open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("lightbox--open");
  lightboxBackdrop.classList.remove("lightbox-backdrop--open");
  document.body.style.overflow = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxBackdrop.addEventListener("click", closeLightbox);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });

// ─── PORTFOLIO (DYNAMIC) ─────────────────────
const grid       = document.getElementById("portfolioGrid");
const filterBtns = document.querySelectorAll(".filter-btn");
let allProjects  = [];

function buildCard(project, index) {
  const { title, category, imageURL } = project;
  const label = CATEGORY_LABELS[category] || category;
  const num   = String(index + 1).padStart(2, "0");
  const isTall = index % 5 === 1;
  const isWide = index % 5 === 3;

  const article = document.createElement("article");
  article.className = ["project-card", isTall ? "project-card--tall" : "", isWide ? "project-card--wide" : ""]
    .filter(Boolean).join(" ");
  article.dataset.category = category;
  article.style.transition = "opacity 0.3s ease, transform 0.3s ease";

  const bgStyle = imageURL
    ? `background-image: url('${imageURL}'); background-size: cover; background-position: center;`
    : `background: ${FALLBACKS[category] || FALLBACKS.branding};`;

  article.innerHTML = `
    <div class="card-img-wrap">
      <div class="card-img" style="${bgStyle}"></div>
      <div class="card-overlay"><span class="card-view">View Project →</span></div>
      <span class="card-num">${num}</span>
    </div>
    <div class="card-info">
      <h3 class="card-title">${title}</h3>
      <span class="card-cat">${label}</span>
    </div>
  `;

  article.addEventListener("click", () => openLightbox(project));
  return article;
}

function renderCards(filter = "all") {
  const filtered = filter === "all" ? allProjects : allProjects.filter(p => p.category === filter);
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
    grid.style.opacity   = "1";
    grid.style.transform = "translateY(0)";
  }, 250);
}

function showSkeletons(count = 6) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "project-card skeleton-card";
    sk.innerHTML = `<div class="skeleton-shimmer"></div>`;
    grid.appendChild(sk);
  }
}

async function loadProjects() {
  showSkeletons();
  try {
    const all = await getProjects();
    allProjects = all.filter(p => p.published === true || p.published === "true");
    renderCards("all");
  } catch (err) {
    console.error("Failed to load projects:", err);
    grid.innerHTML = `
      <div class="grid-error">
        <p>Couldn't load projects right now.</p>
        <p style="font-size:0.75rem;opacity:0.5;margin-top:0.5rem">${err.message}</p>
      </div>`;
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderCards(btn.dataset.filter);
  });
});

// ─── CONTACT FORM ─────────────────────────────
const form = document.getElementById("contactForm");
let formDirty = false;

// EmailJS contact form
const EMAILJS_PUBLIC_KEY  = "vv4pcESmEM148dmuh";
const EMAILJS_SERVICE_ID  = "service_xxc5g5c";
const EMAILJS_TEMPLATE_ID = "template_6s0pmb9";

if (form) {
  const ejsScript = document.createElement("script");
  ejsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  ejsScript.onload = () => emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  document.head.appendChild(ejsScript);

  form.addEventListener("input", () => { formDirty = true; });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector(".btn-submit");
    btn.textContent   = "Sending…";
    btn.disabled      = true;
    btn.style.opacity = "0.7";

    const templateParams = {
      from_name:    form.querySelector("[name=name]").value,
      from_email:   form.querySelector("[name=email]").value,
      project_type: form.querySelector("[name=project]").value || "Not specified",
      message:      form.querySelector("[name=message]").value,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      btn.textContent      = "Message sent ✓";
      btn.style.background = "#3ecf8e";
      btn.style.opacity    = "1";
      btn.disabled         = false;
      form.reset();
      formDirty = false;
      setTimeout(() => { btn.textContent = "Send message →"; btn.style.background = ""; }, 3500);
    } catch (err) {
      console.error("EmailJS error:", err);
      btn.textContent      = "Failed — try again";
      btn.style.background = "#e05555";
      btn.style.opacity    = "1";
      btn.disabled         = false;
      setTimeout(() => { btn.textContent = "Send message →"; btn.style.background = ""; }, 3500);
    }
  });
}

// ─── UNSAVED FORM WARNING ─────────────────────
window.addEventListener("beforeunload", e => {
  if (formDirty) { e.preventDefault(); e.returnValue = ""; }
});

// ─── INIT ─────────────────────────────────────
grid.innerHTML = "";
runLoader(async () => {
  hideLoader();
  await loadProjects();
});
