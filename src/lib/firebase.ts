
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCzLEbzyEIRJZdEtshKVS0X7JvfKh42F3c",
  authDomain: "perfectpos.firebaseapp.com",
  projectId: "perfectpos",
  storageBucket: "perfectpos.firebasestorage.app",
  messagingSenderId: "1024884215374",
  appId: "1:1024884215374:web:5b057c33113af58db5bd1f"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
