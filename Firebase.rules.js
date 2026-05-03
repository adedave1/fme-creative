// ============================================
//  FIRESTORE RULES  →  firestore.rules
//  Paste this in Firebase Console →
//  Firestore → Rules tab
// ============================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Projects: anyone can READ, only authenticated admin can WRITE
    match /projects/{projectId} {
      allow read:  if true;
      allow write: if request.auth != null;
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}


// ============================================
//  STORAGE RULES  →  storage.rules
//  Paste in Firebase Console →
//  Storage → Rules tab
// ============================================

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Public read on all files
    match /{allPaths=**} {
      allow read: if true;
    }

    // Only authenticated admin can upload/delete
    match /projects/{fileName} {
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024   // max 10 MB
                   && request.resource.contentType.matches('image/.*');
    }
  }
}


// ============================================
//  FIRESTORE SCHEMA (reference)
//  Collection: projects
//  Document fields:
// ============================================
//
//  {
//    title:       string        — "Luxe Cosmetics"
//    category:    string        — "branding" | "logo" | "flyer" | "social" | "motion" | "print"
//    description: string        — full project description (shown on detail page)
//    tags:        string[]      — ["packaging", "identity", "print"]
//    imageURL:    string        — Firebase Storage download URL
//    storagePath: string        — e.g. "projects/1234-abcd.jpg"  (needed to delete)
//    published:   boolean       — true = visible on site, false = draft
//    createdAt:   timestamp     — serverTimestamp()
//    updatedAt:   timestamp     — serverTimestamp()
//  }
//
// ============================================


