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
import { fetchProgress, pushProgress } from "@/lib/api";
import { useAuth } from "@/lib/firebase/AuthContext";
import {
  SAVED_CHANGED_EVENT,
  cacheSizeBytes,
  clearAll as clearOfflineStorage,
  isSavedOffline,
  savedIds as readSavedIds,
  toggleSaved,
} from "@/lib/offline/cache";
import {
  applyServerSummary,
  loadState,
  localSummary,
  markSynced,
  recordProgress,
  recordQuizAnswer,
  setProfile as persistProfile,
  subscribe,
  type LocalState,
} from "@/lib/offline/progress";
import { todayKey } from "@/lib/utils";
import type { ProgressRecord, UserProfile } from "@/lib/types";

/**
 * ===========================================================================
 * ProgressProvider — the one place where offline study meets Firestore
 * ===========================================================================
 * Read path  (must never block): localStorage mirror, then instant render.
 * Write path (must never lose data): memory, then localStorage, queued, synced.
 *
 * Sync runs when the app boots, when the device comes back online, or shortly
 * after a local write settles. Failures are swallowed on purpose: a student
 * mid-ward-round should never see a red toast because a backend had a bad
 * minute — the offline banner already tells that story.
 */

type Summary = ReturnType<typeof localSummary>;

type ProgressContextValue = {
  /** Per-resource percent, already merged with the server copy. */
  records: Record<string, ProgressRecord>;
  percentFor: (resourceId: string) => number;
  profile: UserProfile | null;
  summary: Summary;
  loading: boolean;
  syncing: boolean;
  online: boolean;
  savedIds: string[];
  savedCount: number;
  storageBytes: number;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => boolean;
  recordRead: (input: {
    resourceId: string;
    categorySlug: string;
    percent: number;
    secondsSpent?: number;
  }) => void;
  recordQuiz: (input: {
    questionId: string;
    chosenIndex: number;
    correct: boolean;
  }) => void;
  refresh: () => void;
  clearOfflineData: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { getIdToken, profile: authProfile, loading: authLoading } = useAuth();

  const [state, setState] = useState<LocalState | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const [bytes, setBytes] = useState(0);

  const syncingRef = useRef(false);
  const pendingSync = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Hydrate from the mirror after mount, so SSR and client agree. */
  useEffect(() => {
    setState(loadState());
    setSaved(readSavedIds());
    setBytes(cacheSizeBytes());
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);

    const unsubscribeProgress = subscribe(() => {
      setState(loadState());
      setBytes(cacheSizeBytes());
    });

    const onSavedChanged = () => {
      setSaved(readSavedIds());
      setBytes(cacheSizeBytes());
    };
    const onConnectivity = () => setOnline(navigator.onLine);

    window.addEventListener(SAVED_CHANGED_EVENT, onSavedChanged);
    window.addEventListener("online", onConnectivity);
    window.addEventListener("offline", onConnectivity);

    return () => {
      unsubscribeProgress();
      window.removeEventListener(SAVED_CHANGED_EVENT, onSavedChanged);
      window.removeEventListener("online", onConnectivity);
      window.removeEventListener("offline", onConnectivity);
    };
  }, []);

  /* Sync: push the queue up, pull the merged truth down. */
  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      const token = await getIdToken();
      const local = loadState();

      if (local.pending.length > 0) {
        const progress = local.pending
          .filter((item) => item.kind === "progress")
          .map((item) => item.payload);
        const quiz = local.pending
          .filter((item) => item.kind === "quiz")
          .map((item) => item.payload);

        try {
          const pushed = await pushProgress({ progress, quiz }, token);
          // meta.stored === false means the API accepted the write but could
          // not persist it (Firebase Admin unconfigured). Keep the queue so
          // nothing is silently dropped.
          if (pushed?.meta?.stored !== false) markSynced(local.uid);
        } catch {
          /* still offline or the service is down — the queue survives */
        }
      }

      const response = await fetchProgress(token);
      if (response?.data) {
        applyServerSummary({
          records: response.data.records ?? [],
          // In local mode the server profile is a blank placeholder — never let
          // it overwrite the student's real one.
          profile:
            response.data.origin === "firestore" ? response.data.profile : null,
          uid: response.data.uid,
        });
      }
    } catch {
      /* silent by design */
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (authLoading) return;
    void sync();
  }, [authLoading, sync]);

  useEffect(() => {
    if (online) void sync();
  }, [online, sync]);

  /* Local writes settle, then we try the network once. */
  const scheduleSync = useCallback(() => {
    if (pendingSync.current) clearTimeout(pendingSync.current);
    pendingSync.current = setTimeout(() => void sync(), 4000);
  }, [sync]);

  useEffect(
    () => () => {
      if (pendingSync.current) clearTimeout(pendingSync.current);
    },
    [],
  );

  const recordRead = useCallback<ProgressContextValue["recordRead"]>(
    (input) => {
      setState(
        recordProgress({
          resourceId: input.resourceId,
          categorySlug: input.categorySlug,
          percent: input.percent,
          secondsSpent: input.secondsSpent,
        }),
      );
      scheduleSync();
    },
    [scheduleSync],
  );

  const recordQuiz = useCallback<ProgressContextValue["recordQuiz"]>(
    (input) => {
      setState(recordQuizAnswer({ ...input, onDay: todayKey() }));
      scheduleSync();
    },
    [scheduleSync],
  );

  const toggleSave = useCallback((id: string) => {
    const next = toggleSaved(id);
    setSaved(readSavedIds());
    setBytes(cacheSizeBytes());
    return next;
  }, []);

  const clearOfflineData = useCallback(() => {
    clearOfflineStorage();
    setState(loadState());
    setSaved([]);
    setBytes(0);
  }, []);

  // Memoized so the value useMemo below doesn't recompute every render just
  // because `?? {}` produced a fresh object.
  const records = useMemo(() => state?.records ?? {}, [state]);
  const summary = useMemo(
    () => localSummary({ savedOffline: saved.length }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, saved.length],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      records,
      percentFor: (resourceId: string) => records[resourceId]?.percent ?? 0,
      profile: state?.profile ?? authProfile,
      summary,
      loading: state === null,
      syncing,
      online,
      savedIds: saved,
      savedCount: saved.length,
      storageBytes: bytes,
      isSaved: (id: string) => saved.includes(id) || isSavedOffline(id),
      toggleSave,
      recordRead,
      recordQuiz,
      refresh: () => void sync(),
      clearOfflineData,
    }),
    [
      records,
      state,
      authProfile,
      summary,
      syncing,
      online,
      saved,
      bytes,
      toggleSave,
      recordRead,
      recordQuiz,
      sync,
      clearOfflineData,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return context;
}

/** Convenience for cards: just the ring value. Re-renders on any local write. */
export function useResourcePercent(resourceId: string): number {
  return useProgress().percentFor(resourceId);
}

/**
 * Saves profile edits made in /profile.
 * Local first, because a student may edit their details while offline.
 */
export function useProfileWriter() {
  const { profile } = useProgress();
  const { getIdToken } = useAuth();
  return useCallback(
    (patch: Partial<UserProfile>) => {
      if (!profile) return;
      const next = { ...profile, ...patch };
      persistProfile(next, next.uid);
      // Authenticate when possible: without the token /api/progress answers
      // 202 stored:false and the edit would stay device-local forever.
      void getIdToken()
        .then((token) => pushProgress({ profile: next }, token))
        .catch(() => undefined);
    },
    [profile, getIdToken],
  );
}

