import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * ===========================================================================
 * MICROSERVICE 2 — Firebase, browser half (Auth only)
 * ===========================================================================
 * This module owns identity in the browser and nothing else. It signs the
 * device in anonymously so a student can start studying without ever meeting a
 * login wall, and it mints the ID tokens that /api/progress verifies.
 *
 * Per-user state — progress, quiz attempts, profile — is written exclusively
 * through the Admin SDK inside the API routes. The browser never touches
 * Firestore directly, so this module deliberately does NOT import the Firestore
 * client SDK. Keeping it out buys us three things:
 *
 *   1. ~100 KB less JavaScript to download on a 2G connection in Gulu;
 *   2. no dependency on `firebase/firestore`, whose entry in this install is a
 *      bare `export * from '@firebase/firestore'` whose target ships no
 *      typings — statically unreferenceable, and it breaks `tsc` for no gain;
 *   3. one obvious place to look when asking "who can write a student's data?"
 *      — the answer is the API routes, not the client bundle.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * True when the public Firebase config is present. The UI uses this to fall
 * back to an anonymous local profile rather than throwing on a fresh clone.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

/**
 * Lazily initialise Firebase so importing this module during server rendering
 * (or in a build with no env vars) never throws.
 */
function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables in .env.local",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}
