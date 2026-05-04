// ============================================
//  project.js — Project detail page
//  Reads ?id= from URL, fetches from Firestore
// ============================================

import { getProject, getProjects } from "./firebase.js";

// ─── CURSOR ───────────────────────────────────
const cursor   = document.getElementById("cursor");
const follower = document.getElementById("cursorFollower");
let mx = 0, my = 0, fx = 0, fy = 0;
document.addEventListener("mousemove", e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + "px"; cursor.style.top = my + "px";
});
(function loop() {
  fx += (mx - fx) * 0.1; fy += (my - fy) * 0.1;
  follower.style.left = fx + "px"; follower.style.top = fy + "px";
  requestAnimationFrame(loop);
})();

// ─── NAV ──────────────────────────────────────
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

const hamburger  = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  mobileMenu.classList.toggle("open");
  document.body.style.overflow = mobileMenu.classList.contains("open") ? "hidden" : "";
});
document.querySelectorAll(".mobile-link").forEach(l => {
  l.addEventListener("click", () => {
    hamburger.classList.remove("open");
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  });
});

// ─── SCROLL REVEAL ────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visible"); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.1 });

// ─── LABELS & FALLBACKS ───────────────────────
const LABELS = {
  branding: "Brand Identity", logo: "Logo Design",
  flyer: "Flyer Design",      social: "Social Media Kit",
  motion: "Motion Graphics",  print: "Print Design",
};
const FALLBACKS = {
  branding: "linear-gradient(160deg,#1a0a2e,#3d1a5e,#7b3fa0)",
  logo:     "linear-gradient(160deg,#2d1b00,#6b3a00,#c8780a)",
  flyer:    "linear-gradient(160deg,#0d0d0d,#1a1a1a,#2e2e2e)",
  social:   "linear-gradient(160deg,#003d2b,#006644,#00a86b)",
  motion:   "linear-gradient(160deg,#001a3d,#003080,#0057cc)",
  print:    "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)",
};

// ─── ELEMENTS ────────────────────────────────
const loadingEl  = document.getElementById("projLoading");
const errorEl    = document.getElementById("projError");
const pageEl     = document.getElementById("projPage");
const heroImg    = document.getElementById("projHeroImg");
const projTags   = document.getElementById("projTags");
const projCat    = document.getElementById("projCat");
const projTitle  = document.getElementById("projTitle");
const projDesc   = document.getElementById("projDesc");
const sidebarTags   = document.getElementById("sidebarTags");
const sidebarCat    = document.getElementById("sidebarCat");
const projNextWrap  = document.getElementById("projNext");
const nextCard      = document.getElementById("nextCard");
const nextImg       = document.getElementById("nextImg");
const nextTitle     = document.getElementById("nextTitle");
const nextCat       = document.getElementById("nextCat");

// ─── LOAD ────────────────────────────────────
async function load() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) { showError(); return; }

  try {
    const [project, all] = await Promise.all([getProject(id), getProjects()]);
    if (!project) { showError(); return; }
    render(project);
    renderNext(project, all);
    showPage();
  } catch (err) {
    console.error(err);
    showError();
  }
}

function render(p) {
  // Page title
  document.title = `${p.title} — FME Creative`;

  // Hero
  heroImg.style.background = p.imageURL
    ? `url('${p.imageURL}') center/cover no-repeat`
    : (FALLBACKS[p.category] || FALLBACKS.branding);

  // Category
  const label = LABELS[p.category] || p.category;
  projCat.textContent   = label;
  sidebarCat.textContent = label;

  // Title
  projTitle.textContent = p.title;

  // Tags in breadcrumb
  const tags = p.tags || [];
  projTags.innerHTML = tags.map(t => `<span class="tag-pill">${t}</span>`).join("");

  // Description
  const desc = p.description || "No description provided.";
  projDesc.innerHTML = desc.split("\n").filter(Boolean).map(l => `<p>${l}</p>`).join("");

  // Sidebar tags
  if (tags.length > 0) {
    sidebarTags.innerHTML = `
      <span class="sidebar-label">Tags</span>
      <div class="sidebar-tags">${tags.map(t => `<span class="tag-pill">${t}</span>`).join("")}</div>
    `;
  } else {
    sidebarTags.style.display = "none";
  }

  // Attach reveal observers
  document.querySelectorAll(".reveal-up").forEach(el => revealObs.observe(el));
}

function renderNext(current, all) {
  const published = all.filter(p =>
    (p.published === true || p.published === "true") && p.id !== current.id
  );
  if (!published.length) return;

  const idx  = published.findIndex(p => p.id === current.id);
  const next = published[(idx + 1) % published.length] || published[0];
  if (!next) return;

  nextImg.style.background = next.imageURL
    ? `url('${next.imageURL}') center/cover no-repeat`
    : (FALLBACKS[next.category] || FALLBACKS.branding);
  nextTitle.textContent = next.title;
  nextCat.textContent   = LABELS[next.category] || next.category;
  nextCard.href         = `project.html?id=${next.id}`;
  projNextWrap.style.display = "block";
}

function showPage()  { loadingEl.style.display = "none"; pageEl.style.display = "block"; }
function showError() { loadingEl.style.display = "none"; errorEl.style.display = "flex"; }

load();


