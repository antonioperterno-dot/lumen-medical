/**
 * ===========================================================================
 * LUMEN — local progress mirror
 * ===========================================================================
 * Progress lives in Firestore (microservice 2), but reading progress in a
 * hospital with no signal cannot depend on Firestore. So every progress event
 * is written locally FIRST and synced up when there is a connection.
 *
 * Conflict rule: `percent` is monotonic — the highest value wins. A student who
 * read 70% of "Acute Coronary Syndrome" offline must not be knocked back to
 * 25% because another device synced a stale value.
 *
 * This module imports no Firebase code, so it can never drag the SDK into a
 * render path that has to work offline.
 */

import type { ProgressRecord, UserProfile } from "@/lib/types";
import { todayKey } from "@/lib/utils";

const STATE_KEY = "lumen:v1:progress";
export const PROGRESS_CHANGED_EVENT = "lumen:progress-changed";

export type PendingWrite =
  | { kind: "progress"; at: number; payload: ProgressRecord }
  | {
      kind: "quiz";
      at: number;
      payload: {
        questionId: string;
        chosenIndex: number;
        correct: boolean;
        answeredAt: string;
      };
    };

export type LocalState = {
  version: 1;
  uid: string | null;
  profile: UserProfile | null;
  records: Record<string, ProgressRecord>;
  quiz: { answered: number; correct: number; byDay: Record<string, number> };
  dailySeconds: Record<string, number>;
  /** Writes not yet acknowledged by /api/progress. */
  pending: PendingWrite[];
  lastSyncedAt: number | null;
};

const EMPTY: LocalState = {
  version: 1,
  uid: null,
  profile: null,
  records: {},
  quiz: { answered: 0, correct: 0, byDay: {} },
  dailySeconds: {},
  pending: [],
  lastSyncedAt: null,
};

function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(): LocalState {
  const s = store();
  if (!s) return { ...EMPTY };
  try {
    const raw = s.getItem(STATE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    return {
      ...EMPTY,
      ...parsed,
      records: parsed.records ?? {},
      quiz: {
        answered: parsed.quiz?.answered ?? 0,
        correct: parsed.quiz?.correct ?? 0,
        byDay: parsed.quiz?.byDay ?? {},
      },
      dailySeconds: parsed.dailySeconds ?? {},
      pending: parsed.pending ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveState(next: LocalState): LocalState {
  const s = store();
  if (s) {
    try {
      s.setItem(STATE_KEY, JSON.stringify(next));
    } catch {
      // Out of quota: keep only the most recent queued writes and retry once.
      // Losing a queued sync beats losing all local progress.
      try {
        s.setItem(
          STATE_KEY,
          JSON.stringify({ ...next, pending: next.pending.slice(-50) }),
        );
      } catch {
        /* give up silently — the in-memory copy still drives the UI */
      }
    }
  }
  notify();
  return next;
}

/** Broadcasts a change so every mounted component re-reads. */
function notify(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
}

/** Subscribes to local changes; returns the unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(PROGRESS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, listener);
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

export function recordProgress(input: {
  resourceId: string;
  categorySlug: string;
  percent: number;
  secondsSpent?: number;
}): LocalState {
  const state = loadState();
  const previous = state.records[input.resourceId];
  const percent = Math.max(
    previous?.percent ?? 0,
    Math.max(0, Math.min(100, Math.round(input.percent))),
  );

  const record: ProgressRecord = {
    resourceId: input.resourceId,
    categorySlug: input.categorySlug,
    percent,
    // 92% counts as complete: chasing the last 8% of an article that ends in
    // references is not a good use of a student's attention.
    completed: percent >= 92,
    lastOpenedAt: new Date().toISOString(),
    secondsSpent: Math.round(
      (previous?.secondsSpent ?? 0) + (input.secondsSpent ?? 0),
    ),
  };

  const day = todayKey();
  state.dailySeconds = {
    ...state.dailySeconds,
    [day]: (state.dailySeconds[day] ?? 0) + Math.max(0, Math.round(input.secondsSpent ?? 0)),
  };

  state.records[input.resourceId] = record;
  state.pending = [
    ...state.pending.filter(
      (p) =>
        !(p.kind === "progress" && p.payload.resourceId === record.resourceId),
    ),
    { kind: "progress", at: Date.now(), payload: record } as PendingWrite,
  ].slice(-200);

  return saveState(state);
}

export function recordQuizAnswer(input: {
  questionId: string;
  chosenIndex: number;
  correct: boolean;
  onDay: string;
}): LocalState {
  const state = loadState();
  const answeredAt = new Date().toISOString();

  state.quiz = {
    answered: state.quiz.answered + 1,
    correct: state.quiz.correct + (input.correct ? 1 : 0),
    byDay: {
      ...state.quiz.byDay,
      [input.onDay]: (state.quiz.byDay[input.onDay] ?? 0) + 1,
    },
  };

  state.pending = [
    ...state.pending,
    {
      kind: "quiz",
      at: Date.now(),
      payload: {
        questionId: input.questionId,
        chosenIndex: input.chosenIndex,
        correct: input.correct,
        answeredAt,
      },
    } as PendingWrite,
  ].slice(-200);

  return saveState(state);
}

export function setProfile(
  profile: UserProfile | null,
  uid: string | null,
): LocalState {
  return saveState({ ...loadState(), profile, uid });
}

/** Clears the queue after the server confirmed the write. */
export function markSynced(uid?: string | null): LocalState {
  const state = loadState();
  return saveState({
    ...state,
    uid: uid ?? state.uid,
    pending: [],
    lastSyncedAt: Date.now(),
  });
}

/* -------------------------------------------------------------------------- */
/* Derived read models                                                         */
/* -------------------------------------------------------------------------- */

export function pendingCount(): number {
  return loadState().pending.length;
}

export function percentFor(resourceId: string): number {
  return loadState().records[resourceId]?.percent ?? 0;
}

export function recordsForCategory(slug: string): ProgressRecord[] {
  return Object.values(loadState().records).filter(
    (record) => record.categorySlug === slug,
  );
}

/** Average percent across a set of resource ids — the category tile ring. */
export function averagePercent(resourceIds: string[]): number {
  if (resourceIds.length === 0) return 0;
  const state = loadState();
  const total = resourceIds.reduce(
    (sum, id) => sum + (state.records[id]?.percent ?? 0),
    0,
  );
  return Math.round(total / resourceIds.length);
}

/** Everything the profile screen and home header need, computed locally. */
export function localSummary(input?: {
  savedOffline?: number;
}): {
  records: ProgressRecord[];
  resourcesStarted: number;
  resourcesCompleted: number;
  overallPercent: number;
  quizAnswered: number;
  quizAccuracy: number;
  dailySeconds: Record<string, number>;
  savedOffline: number;
  pending: number;
  lastSyncedAt: number | null;
} {
  const state = loadState();
  const records = Object.values(state.records);
  const started = records.length;
  const completed = records.filter((record) => record.completed).length;
  const overall = started
    ? Math.round(records.reduce((sum, record) => sum + record.percent, 0) / started)
    : 0;

  return {
    records,
    resourcesStarted: started,
    resourcesCompleted: completed,
    overallPercent: overall,
    quizAnswered: state.quiz.answered,
    quizAccuracy: state.quiz.answered
      ? Math.round((state.quiz.correct / state.quiz.answered) * 100)
      : 0,
    savedOffline: input?.savedOffline ?? 0,
    pending: state.pending.length,
    lastSyncedAt: state.lastSyncedAt,
    dailySeconds: state.dailySeconds,
  };
}

/**
 * Folds a server summary into the local mirror.
 * Called by ProgressProvider after every successful /api/progress round trip.
 */
export function applyServerSummary(input: {
  records: ProgressRecord[];
  profile: UserProfile | null;
  uid: string | null;
}): LocalState {
  const state = loadState();
  const merged = mergeSummaries(input.records, state.records);
  const byId: Record<string, ProgressRecord> = {};
  for (const record of merged) byId[record.resourceId] = record;

  return saveState({
    ...state,
    uid: input.uid ?? state.uid,
    profile: input.profile ?? state.profile,
    records: byId,
  });
}

export function mergeSummaries(
  server: ProgressRecord[],
  local: Record<string, ProgressRecord>,
): ProgressRecord[] {
  const byId = new Map<string, ProgressRecord>();
  for (const record of server) byId.set(record.resourceId, record);

  for (const [id, localRecord] of Object.entries(local)) {
    const serverRecord = byId.get(id);
    if (!serverRecord) {
      byId.set(id, localRecord);
      continue;
    }
    byId.set(id, {
      ...serverRecord,
      percent: Math.max(serverRecord.percent, localRecord.percent),
      completed: serverRecord.completed || localRecord.completed,
      secondsSpent: Math.max(serverRecord.secondsSpent, localRecord.secondsSpent),
      lastOpenedAt:
        serverRecord.lastOpenedAt > localRecord.lastOpenedAt
          ? serverRecord.lastOpenedAt
          : localRecord.lastOpenedAt,
    });
  }

  return [...byId.values()].sort((a, b) =>
    b.lastOpenedAt.localeCompare(a.lastOpenedAt),
  );
}


