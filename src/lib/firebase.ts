
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let authInstance: Auth; // Renamed to avoid conflict with auth module
let storageInstance: FirebaseStorage; // Renamed for clarity
let persistenceAttempted = false;

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error("Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set in environment variables. Firebase will not initialize correctly.");
}
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  console.warn("Firebase Storage Bucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) is not set in environment variables. Storage operations might fail.");
}


if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);

if (typeof window !== 'undefined' && !persistenceAttempted) {
  persistenceAttempted = true;
  enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .then(() => {
      console.log("Firestore offline persistence enabled successfully.");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Firestore offline persistence failed (failed-precondition). This may be due to multiple tabs open or existing persistence.");
      } else if (err.code === 'unimplemented') {
        console.warn("Firestore offline persistence failed (unimplemented). The browser may not support the required features.");
      } else {
        console.error("An unknown error occurred while enabling Firestore offline persistence:", err);
      }
    });
}


authInstance = getAuth(app);
storageInstance = getStorage(app);

export { app, db, authInstance as auth, storageInstance as storage }; // Export renamed instances

