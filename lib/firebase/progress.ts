import type {
  ProgressRecord,
  ProgressSummary,
  QuizAttempt,
  UserProfile,
} from "@/lib/types";
import { todayKey } from "@/lib/utils";
import { getAdminDb, isAdminConfigured } from "./admin";

/**
 * ===========================================================================
 * MICROSERVICE 2 — progress store (Firestore, server side)
 * ===========================================================================
 * Firestore layout:
 *   users/{uid}: UserProfile
 *   users/{uid}/progress/{resourceId}: ProgressRecord
 *   users/{uid}/quizAttempts/{autoId}: QuizAttempt
 *
 * Keeping progress in a subcollection (rather than an array field on the user
 * document) means a student with 400 finished articles never hits the 1 MiB
 * document limit, and a single write only rewrites one small document.
 */

const DEFAULT_BADGE: UserProfile["badge"] = "PRO";

/** The summary returned when Firebase is unavailable or the student is signed out. */
export function emptySummary(uid: string): ProgressSummary {
  return {
    uid,
    profile: {
      uid,
      displayName: "Alex",
      preferredName: "Alex",
      email: null,
      photoUrl: null,
      badge: DEFAULT_BADGE,
      institution: null,
      school: null,
      faculty: null,
      yearOfStudy: null,
      createdAt: new Date(0).toISOString(),
      streakDays: 0,
      lastActiveOn: todayKey(),
    },
    records: [],
    overallPercent: 0,
    resourcesStarted: 0,
    resourcesCompleted: 0,
    quizAccuracy: 0,
    quizAnswered: 0,
    savedOffline: 0,
    origin: "local",
  };
}

/**
 * Fetches the profile, creating it on first sight.
 * The badge is granted as PRO for now — a paid/institutional flag will land
 * here later without the UI having to change.
 */
export async function ensureProfile(
  uid: string,
  fallbackName = "Alex",
): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data() as Partial<UserProfile>;
    const lastActiveOn = todayKey();
    if (data.lastActiveOn !== lastActiveOn) {
      // Cheap streak: consecutive calendar days, which is what students count.
      const yesterday = todayKey(new Date(Date.now() - 86_400_000));
      const streakDays =
        data.lastActiveOn === yesterday ? (data.streakDays ?? 0) + 1 : 1;
      await ref.set({ lastActiveOn, streakDays }, { merge: true });
      return { ...(data as UserProfile), lastActiveOn, streakDays };
    }
    return data as UserProfile;
  }

  const profile: UserProfile = {
    uid,
    displayName: fallbackName,
    badge: DEFAULT_BADGE,
    institution: null,
    yearOfStudy: null,
    createdAt: new Date().toISOString(),
    streakDays: 1,
    lastActiveOn: todayKey(),
  };
  await ref.set(profile);
  return profile;
}

/** Reads every progress record plus the derived totals. */
export async function getProgressSummary(uid: string): Promise<ProgressSummary> {
  if (!isAdminConfigured) return emptySummary(uid);

  const db = getAdminDb();
  const [profile, recordsSnap, quizSnap] = await Promise.all([
    ensureProfile(uid),
    db.collection("users").doc(uid).collection("progress").limit(500).get(),
    db.collection("users").doc(uid).collection("quizAttempts").limit(1000).get(),
  ]);

  const records: ProgressRecord[] = recordsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      resourceId: data.resourceId ?? doc.id,
      categorySlug: data.categorySlug ?? "",
      percent: Number(data.percent ?? 0),
      completed: Boolean(data.completed),
      lastOpenedAt: data.lastOpenedAt ?? new Date(0).toISOString(),
      secondsSpent: Number(data.secondsSpent ?? 0),
    };
  });

  const answered = quizSnap.size;
  const correct = quizSnap.docs.filter((doc) => doc.data().correct).length;
  const started = records.length;
  const completed = records.filter((record) => record.completed).length;
  const overall = started
    ? Math.round(records.reduce((sum, record) => sum + record.percent, 0) / started)
    : 0;

  return {
    uid,
    profile,
    records,
    overallPercent: overall,
    resourcesStarted: started,
    resourcesCompleted: completed,
    quizAnswered: answered,
    quizAccuracy: answered ? Math.round((correct / answered) * 100) : 0,
    savedOffline: 0, // device-local fact; the client fills this in
    origin: "firestore",
  };
}

/**
 * Writes progress records in one atomic batch.
 * Percent is monotonic: an offline read of 70% must never be overwritten by a
 * stale 25% pushed from another device.
 */
export async function saveProgressBatch(
  uid: string,
  records: ProgressRecord[],
): Promise<number> {
  if (!isAdminConfigured || records.length === 0) return 0;

  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  await ensureProfile(uid);

  const existing = await userRef.collection("progress").get();
  const current = new Map(
    existing.docs.map((doc) => [doc.id, doc.data() as Partial<ProgressRecord>]),
  );

  const batch = db.batch();
  let written = 0;

  for (const record of records.slice(0, 400)) {
    if (!record?.resourceId) continue;
    const previous = current.get(record.resourceId);
    const percent = Math.max(
      Number(previous?.percent ?? 0),
      Math.max(0, Math.min(100, Math.round(Number(record.percent ?? 0)))),
    );

    batch.set(
      userRef.collection("progress").doc(record.resourceId),
      {
        resourceId: record.resourceId,
        categorySlug: record.categorySlug ?? previous?.categorySlug ?? "",
        percent,
        completed: percent >= 92 || Boolean(previous?.completed),
        lastOpenedAt:
          String(record.lastOpenedAt ?? "") >
          String(previous?.lastOpenedAt ?? "")
            ? record.lastOpenedAt
            : (previous?.lastOpenedAt ?? new Date().toISOString()),
        secondsSpent: Math.max(
          Number(previous?.secondsSpent ?? 0),
          Number(record.secondsSpent ?? 0),
        ),
      },
      { merge: true },
    );
    written += 1;
  }

  batch.set(
    userRef,
    { lastActiveOn: todayKey(), updatedAt: new Date().toISOString() },
    { merge: true },
  );

  await batch.commit();
  return written;
}

/** Appends quiz attempts. Answers are already graded on the device. */
export async function saveQuizAttempts(
  uid: string,
  attempts: QuizAttempt[],
): Promise<number> {
  if (!isAdminConfigured || attempts.length === 0) return 0;

  const db = getAdminDb();
  const collection = db.collection("users").doc(uid).collection("quizAttempts");
  const batch = db.batch();

  for (const attempt of attempts.slice(0, 400)) {
    if (!attempt?.questionId) continue;
    const ref = collection.doc(
      `${attempt.questionId}_${attempt.answeredAt ?? Date.now()}`.replace(
        /[^A-Za-z0-9_-]/g,
        "-",
      ),
    );
    batch.set(
      ref,
      {
        questionId: attempt.questionId,
        chosenIndex: Number(attempt.chosenIndex ?? -1),
        correct: Boolean(attempt.correct),
        answeredAt: attempt.answeredAt ?? new Date().toISOString(),
      },
      { merge: true },
    );
  }

  batch.set(
    db.collection("users").doc(uid),
    { lastActiveOn: todayKey() },
    { merge: true },
  );

  await batch.commit();
  return attempts.length;
}

/**
 * Applies a profile edit coming from /profile (name, institution, year).
 * Only whitelisted fields are written: a client must never be able to grant
 * itself a badge or reset its own streak.
 */
export async function updateProfile(
  uid: string,
  patch: unknown,
): Promise<UserProfile | null> {
  if (!isAdminConfigured) return null;

  const source = (patch ?? {}) as Record<string, unknown>;
  const allowed: Partial<UserProfile> = {};

  if (typeof source.displayName === "string" && source.displayName.trim()) {
    allowed.displayName = source.displayName.trim().slice(0, 60);
  }
  if (typeof source.institution === "string") {
    allowed.institution = source.institution.trim().slice(0, 80) || null;
  }
  if (typeof source.yearOfStudy === "number" && Number.isFinite(source.yearOfStudy)) {
    const year = Math.round(source.yearOfStudy);
    allowed.yearOfStudy = year >= 1 && year <= 7 ? year : null;
  }

  if (Object.keys(allowed).length === 0) return null;

  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  await ref.set(allowed, { merge: true });

  const snap = await ref.get();
  return (snap.data() as UserProfile) ?? null;
}

/** Marks the student as active today and advances the streak if appropriate. */
export async function touchStreak(uid: string): Promise<void> {
  if (!isAdminConfigured) return;
  try {
    await ensureProfile(uid);
  } catch {
    /* a missing streak is not worth failing a request over */
  }
}

/** Shared validator: only accepts the shapes the client is documented to send. */
export function parseProgressBody(body: unknown): {
  records: ProgressRecord[];
  attempts: QuizAttempt[];
} {
  const source = (body ?? {}) as {
    progress?: unknown;
    records?: unknown;
    quiz?: unknown;
    attempts?: unknown;
  };

  const rawRecords = Array.isArray(source.progress)
    ? source.progress
    : Array.isArray(source.records)
      ? source.records
      : [];

  const rawAttempts = Array.isArray(source.quiz)
    ? source.quiz
    : Array.isArray(source.attempts)
      ? source.attempts
      : [];

  const records: ProgressRecord[] = rawRecords
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      resourceId: String(item.resourceId ?? ""),
      categorySlug: String(item.categorySlug ?? ""),
      percent: Number(item.percent ?? 0),
      completed: Boolean(item.completed),
      lastOpenedAt: String(item.lastOpenedAt ?? new Date().toISOString()),
      secondsSpent: Number(item.secondsSpent ?? 0),
    }))
    .filter((record) => record.resourceId.length > 0);

  const attempts: QuizAttempt[] = rawAttempts
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      id: String(item.id ?? `attempt_${index}`),
      questionId: String(item.questionId ?? ""),
      chosenIndex: Number(item.chosenIndex ?? -1),
      correct: Boolean(item.correct),
      answeredAt: String(item.answeredAt ?? new Date().toISOString()),
    }))
    .filter((attempt) => attempt.questionId.length > 0);

  return { records, attempts };
}
