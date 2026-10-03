"use client";

import { useState } from "react";
import { BookmarkIcon, CheckIcon, DownloadIcon } from "@/components/icons";
import { cacheWrite } from "@/lib/offline/cache";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 * SaveOfflineButton — "keep this on my phone"
 * ===========================================================================
 * Saving does two things:
 *   1. records the id in the saved-offline set (badge on the Saved tab);
 *   2. fetches the full resource and writes it to the localStorage mirror under
 *      the SAME cache key the reader uses, so the next open works with no
 *      network at all — not even the service worker needs to answer.
 *
 * The service worker caches the HTTP response; this guarantees the data is
 * there even if Safari has evicted the SW cache (which it does after ~7 idle
 * days on iOS).
 */

export default function SaveOfflineButton({
  resourceId,
  className,
  compact = false,
}: {
  resourceId: string;
  className?: string;
  compact?: boolean;
}) {
  const { isSaved, toggleSave } = useProgress();
  const [busy, setBusy] = useState(false);
  const saved = isSaved(resourceId);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);

    const nowSaved = toggleSave(resourceId);

    if (nowSaved) {
      try {
        // Warm the mirror with the full body so the reader is offline-proof.
        const res = await fetch(`/api/resources/${encodeURIComponent(resourceId)}`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const payload = await res.json();
          cacheWrite(`/api/resources/${resourceId}`, payload);
        }
      } catch {
        // Offline right now: the id is saved, and the body will be fetched on
        // the next read. Nothing to apologise for.
      }
    }

    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors",
        saved
          ? "border-lumen/50 bg-lumen/12 text-lumen"
          : "border-white/15 bg-white/5 text-white/80",
        compact && "px-3 py-1.5 text-[11px]",
        className,
      )}
    >
      {saved ? (
        <>
          <CheckIcon className="h-3.5 w-3.5" />
          Saved offline
        </>
      ) : (
        <>
          {compact ? (
            <BookmarkIcon className="h-3.5 w-3.5" />
          ) : (
            <DownloadIcon className="h-3.5 w-3.5" />
          )}
          Save offline
        </>
      )}
    </button>
  );
}
