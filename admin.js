// ============================================
//  admin.js — Dashboard logic
// ============================================

import {
  getProjects, addProject, updateProject, deleteProject,
  uploadImage, login, logout, onAuthChange,
} from "./firebase.js";

// ─── ELEMENTS ────────────────────────────────
const loginScreen  = document.getElementById("loginScreen");
const dashboard    = document.getElementById("dashboard");
const loginForm    = document.getElementById("loginForm");
const loginEmail   = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError   = document.getElementById("loginError");
const loginBtn     = document.getElementById("loginBtn");
const loginSpinner = document.getElementById("loginSpinner");
const pwToggle     = document.getElementById("pwToggle");
const adminEmail   = document.getElementById("adminEmail");
const logoutBtn    = document.getElementById("logoutBtn");

const projectList  = document.getElementById("projectList");
const projectCount = document.getElementById("projectCount");
const btnNewProject = document.getElementById("btnNewProject");

const uploadForm   = document.getElementById("uploadForm");
const uploadPanelTitle = document.getElementById("uploadPanelTitle");
const editId       = document.getElementById("editId");
const dropZone     = document.getElementById("dropZone");
const dropInner    = document.getElementById("dropInner");
const dropPreview  = document.getElementById("dropPreview");
const previewImg   = document.getElementById("previewImg");
const removeImg    = document.getElementById("removeImg");
const fileInput    = document.getElementById("fileInput");
const uploadProgress = document.getElementById("uploadProgress");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const fieldTitle   = document.getElementById("fieldTitle");
const fieldCategory = document.getElementById("fieldCategory");
const fieldDescription = document.getElementById("fieldDescription");
const fieldTags    = document.getElementById("fieldTags");
const fieldPublished = document.getElementById("fieldPublished");
const saveBtn      = document.getElementById("saveBtn");
const saveBtnLabel = document.getElementById("saveBtnLabel");
const btnCancel    = document.getElementById("btnCancel");
const formError    = document.getElementById("formError");

const deleteModal  = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const toast        = document.getElementById("toast");

let selectedFile   = null;
let existingImageURL = null;
let pendingDeleteId  = null;
let allProjects    = [];

// ─── TOAST ───────────────────────────────────
function showToast(msg, type = "success") {
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  setTimeout(() => { toast.className = "toast"; }, 3200);
}

// ─── AUTH ────────────────────────────────────
onAuthChange(user => {
  if (user) {
    loginScreen.style.display  = "none";
    dashboard.style.display    = "flex";
    adminEmail.textContent     = user.email;
    loadProjects();
  } else {
    loginScreen.style.display  = "flex";
    dashboard.style.display    = "none";
  }
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  loginError.textContent = "";
  loginBtn.disabled      = true;
  loginSpinner.classList.add("visible");
  try {
    await login(loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = friendlyAuthError(err.code);
    loginBtn.disabled      = false;
    loginSpinner.classList.remove("visible");
  }
});

logoutBtn.addEventListener("click", async () => {
  await logout();
});

pwToggle.addEventListener("click", () => {
  const isText = loginPassword.type === "text";
  loginPassword.type  = isText ? "password" : "text";
  pwToggle.textContent = isText ? "Show" : "Hide";
});

function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email":      "Invalid email address.",
    "auth/user-not-found":     "No account found with that email.",
    "auth/wrong-password":     "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests":  "Too many attempts. Try again later.",
  };
  return map[code] || "Sign in failed. Check your credentials.";
}

// ─── PANEL NAVIGATION ────────────────────────
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.panel;
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${target}`).classList.add("active");
  });
});

function goToPanel(name) {
  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("active", b.dataset.panel === name);
  });
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`panel-${name}`).classList.add("active");
}

// ─── LOAD PROJECTS ────────────────────────────
async function loadProjects() {
  projectList.innerHTML = `<div class="table-empty">Loading projects…</div>`;
  try {
    allProjects = await getProjects();
    renderTable();
  } catch (err) {
    projectList.innerHTML = `<div class="table-empty">Failed to load: ${err.message}</div>`;
  }
}

function renderTable() {
  const count = allProjects.length;
  projectCount.textContent = count === 0
    ? "No projects yet"
    : `${count} project${count !== 1 ? "s" : ""}`;

  if (count === 0) {
    projectList.innerHTML = `<div class="table-empty">No projects yet — upload your first one!</div>`;
    return;
  }

  projectList.innerHTML = "";
  allProjects.forEach(p => {
    const row = document.createElement("div");
    row.className = "project-row";
    const isLive = p.published === true || p.published === "true";
    row.innerHTML = `
      ${p.imageURL
        ? `<img class="row-thumb" src="${p.imageURL}" alt="${p.title}" loading="lazy" />`
        : `<div class="row-thumb-placeholder"></div>`}
      <span class="row-title">${p.title}</span>
      <span class="row-cat">${p.category || "—"}</span>
      <span class="row-status">
        <span class="status-dot ${isLive ? "live" : "draft"}"></span>
        ${isLive ? "Live" : "Draft"}
      </span>
      <div class="row-actions">
        <button class="btn-edit" data-id="${p.id}">Edit</button>
        <button class="btn-del"  data-id="${p.id}">Del</button>
      </div>
    `;
    row.querySelector(".btn-edit").addEventListener("click", () => openEdit(p));
    row.querySelector(".btn-del").addEventListener("click",  () => openDeleteModal(p.id));
    projectList.appendChild(row);
  });
}

// ─── NEW PROJECT ─────────────────────────────
btnNewProject.addEventListener("click", () => {
  resetForm();
  uploadPanelTitle.textContent = "New Project";
  goToPanel("upload");
});

// ─── EDIT PROJECT ────────────────────────────
function openEdit(project) {
  resetForm();
  uploadPanelTitle.textContent = "Edit Project";
  editId.value               = project.id;
  fieldTitle.value           = project.title || "";
  fieldCategory.value        = project.category || "";
  fieldDescription.value     = project.description || "";
  fieldTags.value            = (project.tags || []).join(", ");
  fieldPublished.value       = String(project.published ?? "true");

  if (project.imageURL) {
    existingImageURL    = project.imageURL;
    previewImg.src      = project.imageURL;
    dropInner.style.display   = "none";
    dropPreview.style.display = "block";
  }
  goToPanel("upload");
}

// ─── CANCEL ──────────────────────────────────
btnCancel.addEventListener("click", () => {
  resetForm();
  goToPanel("projects");
});

// ─── DROP ZONE ───────────────────────────────
dropInner.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) setFile(fileInput.files[0]);
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});

removeImg.addEventListener("click", () => {
  selectedFile     = null;
  existingImageURL = null;
  previewImg.src   = "";
  dropPreview.style.display = "none";
  dropInner.style.display   = "flex";
  fileInput.value  = "";
});

function setFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file.", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast("Image must be under 10 MB.", "error");
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    dropInner.style.display   = "none";
    dropPreview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// ─── SAVE (ADD / UPDATE) ─────────────────────
uploadForm.addEventListener("submit", async e => {
  e.preventDefault();
  formError.textContent = "";

  if (!fieldTitle.value.trim()) {
    formError.textContent = "Please enter a project title.";
    return;
  }
  if (!fieldCategory.value) {
    formError.textContent = "Please select a category.";
    return;
  }

  saveBtn.disabled    = true;
  saveBtnLabel.textContent = "Saving…";

  try {
    let imageURL      = existingImageURL || "";
    let cloudinaryId  = "";

    // Upload new image if selected
    if (selectedFile) {
      uploadProgress.style.display = "flex";
      const result = await uploadImage(selectedFile, pct => {
        progressFill.style.width    = pct + "%";
        progressLabel.textContent   = pct + "%";
      });
      imageURL     = result.url;
      cloudinaryId = result.cloudinaryId;
      uploadProgress.style.display = "none";
    }

    const tags = fieldTags.value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const data = {
      title:       fieldTitle.value.trim(),
      category:    fieldCategory.value,
      description: fieldDescription.value.trim(),
      tags,
      published:   fieldPublished.value === "true",
      imageURL,
      cloudinaryId,
    };

    const id = editId.value;
    if (id) {
      await updateProject(id, data);
      showToast("Project updated!");
    } else {
      await addProject(data);
      showToast("Project published!");
    }

    resetForm();
    await loadProjects();
    goToPanel("projects");

  } catch (err) {
    formError.textContent = "Error: " + err.message;
    showToast("Something went wrong.", "error");
  } finally {
    saveBtn.disabled         = false;
    saveBtnLabel.textContent = "Save project";
  }
});

// ─── DELETE ──────────────────────────────────
function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.style.display = "flex";
}

cancelDelete.addEventListener("click", () => {
  deleteModal.style.display = "none";
  pendingDeleteId = null;
});

confirmDelete.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  deleteModal.style.display = "none";
  try {
    await deleteProject(pendingDeleteId);
    showToast("Project deleted.");
    pendingDeleteId = null;
    await loadProjects();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
});

// ─── RESET FORM ──────────────────────────────
function resetForm() {
  uploadForm.reset();
  editId.value       = "";
  selectedFile       = null;
  existingImageURL   = null;
  previewImg.src     = "";
  dropPreview.style.display   = "none";
  dropInner.style.display     = "flex";
  uploadProgress.style.display = "none";
  progressFill.style.width    = "0%";
  progressLabel.textContent   = "0%";
  formError.textContent       = "";
  saveBtnLabel.textContent    = "Save project";
  saveBtn.disabled            = false;
}


