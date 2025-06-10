
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// Your web app's Firebase configuration
// These variables are expected to be in your .env file
const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if essential Firebase config values are present
if (!firebaseConfigValues.apiKey || !firebaseConfigValues.projectId) {
  console.error(
    "Firebase Configuration Error: Critical environment variables (NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing. " +
    "Please ensure your .env file is correctly set up with the necessary Firebase project credentials. " +
    "This is a likely cause of Firestore connection errors (e.g., 400 Bad Request)."
  );
  // Note: The application might still attempt to initialize Firebase below,
  // which could lead to further errors if the config is indeed incomplete/incorrect.
}

const firebaseConfig: FirebaseOptions = {
  ...firebaseConfigValues,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

// Initialize Firestore with persistent cache settings
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
  });
  console.log("Firestore offline persistence configured via initializeFirestore.");
} catch (err: any) {
  console.error("Firestore initialization with persistence failed: ", err);
  // This error is critical for app functionality.
  // You might want to display a user-friendly message or prevent app rendering.
  throw new Error("Failed to initialize Firestore with persistence: " + err.message);
}

export { app, auth, db };
