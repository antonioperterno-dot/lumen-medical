import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * ===========================================================================
 * MICROSERVICE 2 — Firebase Admin (server side only)
 * ===========================================================================
 * Only /api/progress, /api/quiz and server components may import this file.
 * It holds the service-account credentials, so it must never reach the
 * browser bundle: the client talks to Firebase Auth with the public config in
 * ./client.ts and to Firestore *only* through the API routes.
 *
 * Everything here is lazily initialised, so a fresh clone with an empty
 * .env.local still builds and still serves the UI (in local mode).
 */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

/** True when the service account is present. */
export const isAdminConfigured = Boolean(
  projectId && clientEmail && privateKey,
);

declare global {
  // eslint-disable-next-line no-var
  var __lumenAdmin: App | undefined;
  // eslint-disable-next-line no-var
  var __lumenAdminDb: Firestore | undefined;
  // eslint-disable-next-line no-var
  var __lumenAdminAuth: Auth | undefined;
}

export function getAdminApp(): App {
  if (!isAdminConfigured) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local",
    );
  }
  if (!global.__lumenAdmin) {
    global.__lumenAdmin = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
  }
  return global.__lumenAdmin;
}

/** Cached on globalThis so dev hot-reloads don't re-open gRPC channels. */
export function getAdminDb(): Firestore {
  if (!global.__lumenAdminDb) {
    global.__lumenAdminDb = getFirestore(getAdminApp());
    // `ignoreUndefinedProperties` keeps a half-filled onboarding form from
    // throwing on write, which would lose a student's progress record.
    global.__lumenAdminDb.settings({ ignoreUndefinedProperties: true });
  }
  return global.__lumenAdminDb;
}

/** Returns true only for accounts that have redeemed an active invitation. */
export async function hasActiveMembership(uid: string): Promise<boolean> {
  const member = await getAdminDb().collection("members").doc(uid).get();
  return member.exists && member.get("active") === true;
}

export function getAdminAuth(): Auth {
  if (!global.__lumenAdminAuth) {
    global.__lumenAdminAuth = getAuth(getAdminApp());
  }
  return global.__lumenAdminAuth;
}

/**
 * Reads the `Authorization: Bearer <idToken>` header and verifies it.
 * Returns null when the header is missing or the token is invalid/expired —
 * callers must treat that as "anonymous student", never as a hard failure.
 */
export async function uidFromRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  if (!isAdminConfigured) return null;

  try {
    const decoded: DecodedIdToken = await getAdminAuth().verifyIdToken(
      header.slice("Bearer ".length).trim(),
      // Allow a minute of clock skew; ward phones are often badly out of sync.
      true,
    );
    return decoded.uid;
  } catch {
    return null;
  }
}
