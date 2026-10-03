"use client";

import { useEffect, useRef, useState } from "react";
import { OfflineIcon } from "@/components/icons";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 * OfflineBanner — honest, small, non-blocking
 * ===========================================================================
 * A student in a basement needs to know two things and nothing more:
 *   1. you are offline, and the content on screen is the saved copy;
 *   2. you are back online, and your progress is on its way up.
 *
 * On reconnect we say "Progress synced" only once the queue is actually empty,
 * so the message can never lie about data being safe.
 */
export default function OfflineBanner() {
  const { online, syncing, summary } = useProgress();
  const [wasOffline, setWasOffline] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setJustSynced(false);
      return;
    }

    if (wasOffline && !syncing && summary.pending === 0) {
      setJustSynced(true);
      setWasOffline(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustSynced(false), 2600);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [online, syncing, summary.pending, wasOffline]);

  if (online && !justSynced) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "glass-strong flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium shadow-card",
          online ? "text-lumen" : "text-white",
        )}
      >
        {online ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-lumen" />
            Back online. Progress synced.
          </>
        ) : (
          <>
            <OfflineIcon className="h-3.5 w-3.5 text-lumen" />
            Offline. Showing your saved copy.
            {summary.pending > 0 && (
              <span className="text-faint">
                · {summary.pending} change{summary.pending === 1 ? "" : "s"} queued
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
