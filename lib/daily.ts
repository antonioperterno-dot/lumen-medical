import type { QuizQuestion } from "@/lib/types";

/**
 * ===========================================================================
 * LUMEN — "Daily Quiz" selection
 * ===========================================================================
 * The quiz of the day must be *the same quiz for everyone, all day*. Two
 * students on the same ward comparing answers cannot see different questions,
 * and a student who opens the app five times must not burn through 25 random
 * questions.
 *
 * So: no `Math.random()` anywhere. The pool is ordered by id (a stable order in
 * Turso) and shuffled with a PRNG seeded from the date string. The same date
 * same five questions, on any device, online or offline.
 */

/** FNV-1a. Small, fast, and good enough to spread dates across seeds. */
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — 32-bit PRNG with a period large enough for our purposes. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, driven by the seeded PRNG so the order is reproducible. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deterministically picks `count` questions for `date` (YYYY-MM-DD).
 *
 * A category narrows the pool first, so "Cardiology only" still rotates daily
 * without ever repeating the same question twice in one day's set.
 */
export function selectDailyQuestions(
  pool: QuizQuestion[],
  date: string,
  count = 5,
  category?: string,
): QuizQuestion[] {
  const scoped = category
    ? pool.filter((question) => question.category_slug === category)
    : pool;

  // Never ask for more than we have; a short quiz beats an error screen.
  const wanted = Math.min(count, scoped.length);
  if (wanted === 0) return [];

  const ordered = [...scoped].sort((a, b) => a.id.localeCompare(b.id));
  const seed = hashSeed(`${date}:${category ?? "all"}`);
  const shuffled = seededShuffle(ordered, seed);

  // Drop duplicate prompts for the same day: a category pool can contain two
  // questions that test the same point, and seeing both feels like a bug.
  const seen = new Set<string>();
  const picked: QuizQuestion[] = [];
  for (const question of shuffled) {
    const fingerprint = question.prompt.toLowerCase().slice(0, 60);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    picked.push(question);
    if (picked.length === wanted) break;
  }

  return picked;
}
