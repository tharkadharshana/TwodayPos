
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// Your web app's Firebase configuration
// These variables are expected to be in your .env.local file
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
// This replaces the separate getFirestore() and enableIndexedDbPersistence() calls
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
  });
  console.log("Firestore offline persistence configured via initializeFirestore.");
} catch (err: any) {
  // This catch block is more of a fallback, specific errors related to persistence
  // are often better caught where persistence is explicitly enabled if not using initializeFirestore,
  // or by checking capabilities beforehand. However, initializeFirestore itself might throw if options are invalid.
  console.error("Firestore initialization with persistence failed: ", err);
  // Fallback to default firestore instance if custom initialization fails, though this might not have desired persistence.
  // db = getFirestore(app); // Re-evaluate if this fallback is desired or if it should fail hard.
  // For now, if initializeFirestore fails, db will be undefined, which will cause issues downstream.
  // This indicates a more fundamental problem with the Firebase setup or environment.
  // In a production app, you might want more robust error handling or reporting here.
  throw new Error("Failed to initialize Firestore with persistence: " + err.message);
}


export { app, auth, db };
