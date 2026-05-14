import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCc7HtqOaPhTCrdNT8ME1u8x0nnYrmHsBs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "skyflow-dash.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "skyflow-dash",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "skyflow-dash.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "30415908592",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:30415908592:web:d1e952e894bd55735a1c35",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0K1LXP9YNG",
};

function validateFirebaseEnv(): boolean {
  const requiredEntries: Array<[string, string | undefined]> = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
  ];

  const missing = requiredEntries.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) return false;
  return true;
}

const isFirebaseConfigured = validateFirebaseEnv();

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
  } catch (e) {
    console.warn("[Firebase] Initialization failed:", e);
  }
}

export const app = _app;
export const auth = _auth;
export const db = _db;
export const storage = _storage;

export function getDb(): Firestore {
  if (!_db) throw new Error("Firestore not initialized. Ensure Firebase environment variables are set.")
  return _db
}

export function getAuthHelper(): Auth {
  if (!_auth) throw new Error("Firebase Auth not initialized. Ensure Firebase environment variables are set.")
  return _auth
}
