/**
 * ===========================================================================
 * LUMEN — offline cache (client-side mirror of the Turso catalogue)
 * ===========================================================================
 * The service worker caches HTTP responses. This module caches *data* so the
 * UI can paint instantly on a cold offline start and render without waiting
 * for a network round trip to fail.
 *
 * Why both? Workbox serves the request; this serves the render. On a Ugandan
 * 3G connection, the difference between "shimmer for 8s" and "content now,
 * refreshed in the background" is the entire user experience.
 *
 * Backed by localStorage because:
 *  - it is synchronous, so the first paint after hydration already has data;
 *  - the payloads are text (no images), so we stay inside the 5MB budget.
 * `prune()` therefore matters: it keeps us honest about that budget.
 */

const NAMESPACE = "lumen:v1";
const CACHE_PREFIX = `${NAMESPACE}:cache:`;
const SAVED_KEY = `${NAMESPACE}:saved`;
const META_KEY = `${NAMESPACE}:meta`;

/** Fired whenever the saved-offline set changes. */
export const SAVED_CHANGED_EVENT = "lumen:saved-changed";

export type CachedEntry<T> = {
  data: T;
  savedAt: number;
  /** Stable key the entry was stored under (usually the request URL). */
  key: string;
};

/** Safari private mode throws on access, so every call is guarded. */
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const probe = `${NAMESPACE}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export const isCacheAvailable = (): boolean => storage() !== null;

/* -------------------------------------------------------------------------- */
/* Read / write                                                                */
/* -------------------------------------------------------------------------- */

export function cacheRead<T>(key: string): CachedEntry<T> | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    return parsed;
  } catch {
    // Corrupted entry (e.g. Safari ran out of quota mid-write): drop it.
    cacheRemove(key);
    return null;
  }
}

export function cacheWrite<T>(key: string, data: T): boolean {
  const store = storage();
  if (!store) return false;
  const entry: CachedEntry<T> = { data, savedAt: Date.now(), key };
  try {
    store.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    touchMeta();
    return true;
  } catch {
    // Quota exceeded — evict the oldest third and try once more.
    if (prune({ keepFraction: 0.34 }) === 0) return false;
    try {
      store.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      return true;
    } catch {
      return false;
    }
  }
}

export function cacheRemove(key: string): void {
  storage()?.removeItem(CACHE_PREFIX + key);
}

/** Every cache key currently held, newest first. */
export function cacheIndex(): Array<{
  key: string;
  savedAt: number;
  bytes: number;
}> {
  const store = storage();
  if (!store) return [];
  const out: Array<{ key: string; savedAt: number; bytes: number }> = [];

  for (let i = 0; i < store.length; i += 1) {
    const fullKey = store.key(i);
    if (!fullKey || !fullKey.startsWith(CACHE_PREFIX)) continue;
    const raw = store.getItem(fullKey) ?? "";
    let savedAt = 0;
    try {
      savedAt = (JSON.parse(raw) as CachedEntry<unknown>).savedAt ?? 0;
    } catch {
      savedAt = 0;
    }
    out.push({ key: fullKey.slice(CACHE_PREFIX.length), savedAt, bytes: raw.length });
  }

  return out.sort((a, b) => b.savedAt - a.savedAt);
}

/** Rough size of everything LUMEN keeps on the device. */
export function cacheSizeBytes(): number {
  return (
    cacheIndex().reduce((total, entry) => total + entry.bytes, 0) +
    (storage()?.getItem(SAVED_KEY)?.length ?? 0)
  );
}

/** Drop entries older than `maxAgeMs`. Returns how many were evicted. */
export function prune(
  opts: { maxAgeMs?: number; keepFraction?: number } = {},
): number {
  const { maxAgeMs = 1000 * 60 * 60 * 24 * 45, keepFraction } = opts;
  const store = storage();
  if (!store) return 0;

  const index = cacheIndex();
  const cutoff = Date.now() - maxAgeMs;
  const stale = index.filter((entry) => entry.savedAt < cutoff);
  const tail = keepFraction
    ? index.slice(Math.ceil(index.length * keepFraction))
    : [];

  const doomed = new Set([...stale, ...tail].map((entry) => entry.key));
  // Never evict something the student explicitly saved for offline reading.
  const protectedKeys = new Set(
    savedIds().map((id) => `/api/resources/${id}`),
  );

  let evicted = 0;
  for (const key of doomed) {
    if (protectedKeys.has(key)) continue;
    cacheRemove(key);
    evicted += 1;
  }
  return evicted;
}

/* -------------------------------------------------------------------------- */
/* Explicit "Saved offline" set                                                */
/* -------------------------------------------------------------------------- */

type SavedMap = Record<string, { savedAt: number }>;

function readSaved(): SavedMap {
  const store = storage();
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(SAVED_KEY) ?? "{}") as SavedMap;
  } catch {
    return {};
  }
}

function writeSaved(map: SavedMap): void {
  storage()?.setItem(SAVED_KEY, JSON.stringify(map));
  if (typeof window !== "undefined") {
    // The Saved tab badge and the reader's bookmark icon listen for this.
    window.dispatchEvent(new Event(SAVED_CHANGED_EVENT));
  }
}

export function savedIds(): string[] {
  return Object.entries(readSaved())
    .sort((a, b) => b[1].savedAt - a[1].savedAt)
    .map(([id]) => id);
}

export function isSavedOffline(id: string): boolean {
  return Boolean(readSaved()[id]);
}

export function savedCount(): number {
  return Object.keys(readSaved()).length;
}

/** Adds/removes a resource from the offline library. Returns the new state. */
export function toggleSaved(id: string): boolean {
  const map = readSaved();
  if (map[id]) {
    delete map[id];
    cacheRemove(`/api/resources/${id}`);
    writeSaved(map);
    return false;
  }
  map[id] = { savedAt: Date.now() };
  writeSaved(map);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                                */
/* -------------------------------------------------------------------------- */

function touchMeta(): void {
  storage()?.setItem(
    META_KEY,
    JSON.stringify({ lastWriteAt: Date.now(), version: NAMESPACE }),
  );
}

export function lastCachedAt(): number | null {
  const raw = storage()?.getItem(META_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { lastWriteAt: number }).lastWriteAt ?? null;
  } catch {
    return null;
  }
}

/** Backs the "Clear offline data" button in /profile. Keeps nothing. */
export function clearAll(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && key.startsWith(NAMESPACE)) keys.push(key);
  }
  keys.forEach((key) => store.removeItem(key));
}

