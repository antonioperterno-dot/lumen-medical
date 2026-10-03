/**
 * ===========================================================================
 * LUMEN — the wire contract
 * ===========================================================================
 * These are the ONLY types that cross a network boundary, so they are the only
 * ones the browser bundle ever needs. This module has zero imports: importing
 * it never drags @libsql/client or firebase into a client component.
 *
 * Microservice 1 (Turso, /lib/turso) shapes its SQL rows to match these.
 * Microservice 2 (Firebase, /lib/firebase) shapes its documents to match these.
 * If a field changes here, both services must agree — that is the contract.
 */

/* -------------------------------------------------------------------------- */
/* Microservice 1 — content (Turso / libSQL)                                   */
/* -------------------------------------------------------------------------- */

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  accent: string;
  sort_order: number;
  textbook_url?: string | null;
};

export type Resource = {
  id: string;
  category_slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  /** Only returned by GET /api/resources/[id]. */
  body_md?: string | null;
  reading_time: number;
  /** 'essential' | 'core' | 'advanced' */
  level: string;
  /** 0 or 1 — libSQL has no boolean type. */
  is_trending: number;
  updated_at: string;
};

export type QuizQuestion = {
  id: string;
  category_slug: string;
  prompt: string;
  options: string[];
  /**
   * Sent to the client on purpose: LUMEN grades locally so a student can
   * finish a quiz in an air raid shelter with no signal, then sync the score.
   */
  answerIndex: number;
  explanation: string | null;
  /** 'easy' | 'medium' | 'hard' */
  difficulty: string;
};

export type Guideline = {
  id: string;
  title: string;
  issuer: string;
  summary: string | null;
  version: string | null;
  effective_on: string | null;
  is_uganda: number;
  updated_at: string;
};

/* -------------------------------------------------------------------------- */
/* Microservice 2 — identity & progress (Firebase / Firestore)                 */
/* -------------------------------------------------------------------------- */

export type Badge = "PRO" | "STUDENT" | "RESIDENT";

export type UserProfile = {
  uid: string;
  displayName: string;
  preferredName?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  /** Rendered as "Alex - PRO badge". */
  badge: Badge;
  institution: string | null;
  school?: string | null;
  faculty?: string | null;
  yearOfStudy: number | null;
  createdAt: string;
  streakDays: number;
  /** YYYY-MM-DD */
  lastActiveOn: string;
};

export type ProgressRecord = {
  resourceId: string;
  categorySlug: string;
  /** 0–100 */
  percent: number;
  completed: boolean;
  lastOpenedAt: string;
  secondsSpent: number;
};

export type QuizAttempt = {
  id: string;
  questionId: string;
  chosenIndex: number;
  correct: boolean;
  answeredAt: string;
};

export type ProgressSummary = {
  uid: string;
  profile: UserProfile;
  records: ProgressRecord[];
  overallPercent: number;
  resourcesStarted: number;
  resourcesCompleted: number;
  quizAccuracy: number;
  quizAnswered: number;
  savedOffline: number;
  /** Where this summary came from — the UI shows an honest "local only" note. */
  origin: "firestore" | "local";
};

/* -------------------------------------------------------------------------- */
/* Envelopes                                                                   */
/* -------------------------------------------------------------------------- */

/** Which service answered. 'seed' and 'fallback' mean Turso was unavailable. */
export type DataSource = "turso" | "seed" | "fallback";

export type ResourceMeta = {
  source: DataSource;
  /** ISO timestamp the server produced this payload. */
  servedAt: string;
  /** Rows in THIS response — a page, not the catalogue. */
  returned?: number;
  /**
   * Catalogue-wide resource count. Only present when the caller asked for
   * `include=counts|all`, and never narrowed by a `category` filter.
   */
  total?: number;
  categories?: Category[];
  counts?: Record<string, number>;
  /** True when the payload came from the built-in seed instead of Turso. */
  degraded?: boolean;
};

export type ProgressMeta = {
  origin: "firestore" | "local";
  servedAt: string;
  /** False when the write was queued client-side only (Firebase Admin missing). */
  stored?: boolean;
};

export type QuizMeta = {
  source: DataSource;
  date: string;
  count: number;
  servedAt: string;
};

export type ApiEnvelope<T, M> = {
  data: T;
  meta: M;
};
