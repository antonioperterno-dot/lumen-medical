"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cacheRead, cacheWrite } from "@/lib/offline/cache";

/**
 * ===========================================================================
 * useApiResource — fetch, skeleton, data and offline fallback
 * ===========================================================================
 * Every network read in LUMEN goes through this hook so that the loading,
 * caching and degraded-state behaviour is identical everywhere:
 *
 *   1. Read the localStorage mirror synchronously. If it hits, render it
 *      immediately and mark `fromCache: true` (the UI shows "offline copy").
 *      No shimmer: the student sees content, not placeholders.
 *   2. Fetch in the background, refreshing the mirror on success.
 *   3. If the fetch fails and we have nothing cached, surface `error` and the
 *      page renders a retry state instead of an empty screen.
 *   4. `loading` is only true while we have nothing to show — which is exactly
 *      when the skeleton belongs on screen.
 */

export type AsyncState<T> = {
  data: T | null;
  /** True only when there is nothing on screen yet. */
  loading: boolean;
  /** True while a background revalidation is in flight. */
  refreshing: boolean;
  error: string | null;
  /** Data came from the localStorage mirror. */
  fromCache: boolean;
  /** When the mirror was written. */
  savedAt: number | null;
  refresh: () => void;
};

export function useApiResource<T>(
  url: string | null,
  opts: { cacheKey?: string; enabled?: boolean } = {},
): AsyncState<T> {
  const { enabled = true } = opts;
  const cacheKey = opts.cacheKey ?? url ?? "";
  const [state, setState] = useState<Omit<AsyncState<T>, "refresh">>(() => ({
    data: null,
    loading: Boolean(url) && enabled,
    refreshing: false,
    error: null,
    fromCache: false,
    savedAt: null,
  }));

  // Guards against setState after unmount and against out-of-order responses
  // when the user taps quickly between categories.
  const alive = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!url || !enabled) return;
      const ticket = ++seq.current;

      if (mode === "initial") {
        const cached = cacheRead<T>(cacheKey);
        if (cached) {
          setState({
            data: cached.data,
            loading: false,
            refreshing: true,
            error: null,
            fromCache: true,
            savedAt: cached.savedAt,
          });
        } else {
          setState((prev) => ({
            ...prev,
            loading: true,
            refreshing: false,
            error: null,
          }));
        }
      } else {
        setState((prev) => ({ ...prev, refreshing: true, error: null }));
      }

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
        if (!alive.current || ticket !== seq.current) return;

        cacheWrite(cacheKey, json);
        setState({
          data: json,
          loading: false,
          refreshing: false,
          error: null,
          fromCache: false,
          savedAt: Date.now(),
        });
      } catch (err) {
        if (!alive.current || ticket !== seq.current) return;
        const message =
          err instanceof Error ? err.message : "Could not reach the server";
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          // A failed refresh with cached content is not an error the student
          // needs to see — the offline banner already tells that story.
          error: prev.data ? null : message,
          fromCache: Boolean(prev.data),
        }));
      }
    },
    [url, enabled, cacheKey],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  const refresh = useCallback(() => {
    void load("refresh");
  }, [load]);

  return { ...state, refresh };
}
