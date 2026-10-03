/**
 * Dependency-free UI helpers used by both server and client components.
 * Nothing here imports a microservice, so it is always safe to bundle.
 */

/** Joins class names, dropping falsy values. Tailwind's standard escape hatch. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Clamps a number into `[min, max]`, rounding to an integer.
 * A non-finite input (NaN or Infinity — e.g. a missing or junk query param)
 * falls back to `min`, so a malformed URL can never widen a LIMIT.
 */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Clamps a percentage into 0–100 and rounds it. */
export function clampPercent(value: number): number {
  return clampInt(value, 0, 100);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days between two dates, calendar-wise (not 24h blocks). */
export function daysBetween(iso: string, reference = new Date()): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return Math.round(
    (startOfDay(reference) - startOfDay(then)) / (1000 * 60 * 60 * 24),
  );
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return daysBetween(iso) === 0;
}

/**
 * "Updated today" / "Updated yesterday" / "Updated 4 days ago".
 * Deliberately vague past a week — a med student cares that it is fresh,
 * not the exact timestamp.
 */
export function updatedLabel(iso: string | null | undefined): string {
  if (!iso) return "Recently updated";
  const days = daysBetween(iso);
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days > 1 && days < 7) return `Updated ${days} days ago`;
  return `Updated ${formatDate(iso)}`;
}

export function postedLabel(iso: string | null | undefined): string {
  if (!iso) return "Posted recently";
  const days = daysBetween(iso);
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  return `Posted ${formatDate(iso)}`;
}

/** Truthy when the record changed today — drives the green "today" dot. */
export function isFresh(iso: string | null | undefined): boolean {
  return isToday(iso);
}

export function readingLabel(minutes: number): string {
  const m = Math.max(1, Math.round(minutes || 0));
  return `${m} min read`;
}

/** e.g. "12 Mar" — short enough for a card subtitle. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** e.g. "12 March 2025" — used on guidelines and journal entries. */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Today as YYYY-MM-DD in the student's own timezone (not UTC). */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "Alex" from "Alex - PRO badge" style display names. */
export function firstName(displayName: string): string {
  return displayName.split(/[\s-]+/)[0] || displayName;
}
