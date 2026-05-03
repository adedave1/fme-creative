// ============================================
//  firebase.js — Firebase + Cloudinary helpers
//  Firestore for data, Cloudinary for images
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── FIREBASE CONFIG ─────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCSs13wd3Gos2e9gyE8caumId7g4v-DFoU",
  authDomain:        "fme-creative.firebaseapp.com",
  projectId:         "fme-creative",
  storageBucket:     "fme-creative.firebasestorage.app",
  messagingSenderId: "346344922423",
  appId:             "1:346344922423:web:470db12a718a4627a54eb2",
};

// ─── CLOUDINARY CONFIG ───────────────────────
const CLOUDINARY_CLOUD  = "dbn6jgzck";
const CLOUDINARY_PRESET = "fme_creative";
const CLOUDINARY_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

// ─── INIT ────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ─── PROJECTS ────────────────────────────────

/**
 * Fetch all projects ordered by newest first
 * @returns {Promise<Array>}
 */
export async function getProjects() {
  const q    = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch a single project by Firestore ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getProject(id) {
  const snap = await getDoc(doc(db, "projects", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Add a new project document to Firestore
 * @param {Object} data — { title, category, description, tags, imageURL, cloudinaryId, published }
 * @returns {Promise<string>} new document ID
 */
export async function addProject(data) {
  const docRef = await addDoc(collection(db, "projects"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing project
 * @param {string} id
 * @param {Object} data
 */
export async function updateProject(id, data) {
  await updateDoc(doc(db, "projects", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a project from Firestore
 * Note: Cloudinary image deletion requires a signed request (backend).
 * For now, old images stay in Cloudinary — free tier has plenty of space.
 * @param {string} id
 */
export async function deleteProject(id) {
  await deleteDoc(doc(db, "projects", id));
}

// ─── CLOUDINARY IMAGE UPLOAD ─────────────────

/**
 * Upload an image to Cloudinary via unsigned preset.
 * Calls onProgress(0–100) during upload.
 *
 * @param {File}     file
 * @param {Function} onProgress
 * @returns {Promise<{ url: string, cloudinaryId: string }>}
 */
export function uploadImage(file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file",         file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder",       "fme-creative");

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url:          data.secure_url,   // HTTPS image URL
          cloudinaryId: data.public_id,    // e.g. "fme-creative/abc123"
        });
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.open("POST", CLOUDINARY_URL);
    xhr.send(formData);
  });
}

// ─── AUTH ─────────────────────────────────────

/**
 * Sign in the admin user
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Listen to auth state — callback receives user or null
 * @param {Function} callback
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { db, auth };
