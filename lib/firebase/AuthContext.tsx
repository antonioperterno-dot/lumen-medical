"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/lib/types";
import { setProfile } from "@/lib/offline/progress";
import { DEMO_PROFILE } from "./demo-profile";
import { getFirebaseAuth, isFirebaseConfigured } from "./client";

/**
 * ===========================================================================
 * Auth context (microservice 2, client half)
 * ===========================================================================
 * LUMEN never puts a login wall in front of study material. Instead:
 *   1. If Firebase is configured, the device signs in ANONYMOUSLY on first
 *      launch. The student can study immediately; their progress is tied to
 *      the device identity until they attach an email in /profile.
 *   2. If Firebase is not configured (fresh clone, no .env.local), the app runs
 *      in "local mode" with the demo profile — still fully functional offline.
 *
 * The context also owns the ID token: API routes call it to attribute writes.
 */

export type AuthMode = "firebase" | "local";
const REQUIRE_INVITE = process.env.NEXT_PUBLIC_REQUIRE_INVITE === "true";

type AuthContextValue = {
  user: User | null;
  /** Profile from Firestore/microservice 2 once loaded, else the local demo one. */
  profile: UserProfile | null;
  /** Auth is still resolving (splash skeleton). */
  loading: boolean;
  mode: AuthMode;
  /** True when the Firebase public config exists. */
  firebaseEnabled: boolean;
  /** The current ID token, or null in local mode. */
  getIdToken: () => Promise<string | null>;
  /** Creates the device's anonymous Firebase identity only after code entry. */
  signInForInvite: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setLocalProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const mode: AuthMode = isFirebaseConfigured ? "firebase" : "local";
  const signInAttempted = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Local mode: no network, no account, still a working app.
      setLocalProfile(DEMO_PROFILE);
      setProfile(DEMO_PROFILE, DEMO_PROFILE.uid);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const { onAuthStateChanged, signInAnonymously } = await import(
          "firebase/auth"
        );
        const auth = getFirebaseAuth();

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          if (cancelled) return;
          setUser(nextUser);
          setLoading(false);
        });

        // Give the SDK a moment to restore a persisted session before we
        // create a brand-new anonymous account on every cold start.
        if (!REQUIRE_INVITE && !auth.currentUser && !signInAttempted.current) {
          signInAttempted.current = true;
          try {
            await signInAnonymously(auth);
          } catch {
            // Anonymous auth disabled in the console, or offline. The student
            // still gets the app; progress just stays device-local.
            setLocalProfile(DEMO_PROFILE);
            setProfile(DEMO_PROFILE, DEMO_PROFILE.uid);
            setLoading(false);
          }
        }
      } catch {
        setLocalProfile(DEMO_PROFILE);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!isFirebaseConfigured) return null;
    try {
      const auth = getFirebaseAuth();
      return (await auth.currentUser?.getIdToken()) ?? null;
    } catch {
      // Offline: the cached-token path failed. Local mirror keeps the app whole.
      return null;
    }
  }, []);

  const signInForInvite = useCallback(async (): Promise<User | null> => {
    if (!isFirebaseConfigured) return null;
    const auth = getFirebaseAuth();
    if (auth.currentUser) return auth.currentUser;
    try {
      const { signInAnonymously } = await import("firebase/auth");
      const credential = await signInAnonymously(auth);
      return credential.user;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    try {
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(getFirebaseAuth());
      // A new anonymous identity is created on the next launch by the effect
      // above; local progress stays on the device either way.
      setUser(null);
    } catch {
      /* ignore — nothing useful to tell the user here */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile: profile ?? (user ? null : DEMO_PROFILE),
      loading,
      mode,
      firebaseEnabled: isFirebaseConfigured,
      getIdToken,
      signInForInvite,
      signOut,
    }),
    [user, profile, loading, mode, getIdToken, signInForInvite, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
