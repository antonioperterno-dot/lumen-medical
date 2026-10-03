"use client";

import Link from "next/link";
import { BookmarkIcon, OfflineIcon, RefreshIcon } from "@/components/icons";

/**
 * ===========================================================================
 * /offline — the service worker's document fallback
 * ===========================================================================
 * Shown when a navigation misses every cache (a screen the student has never
 * opened, on a dead network). It is deliberately useful rather than apologetic:
 * the two things that DO work offline are one tap away.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-5 px-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lumen/30 bg-lumen/10 text-lumen">
        <OfflineIcon className="h-7 w-7" />
      </span>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white">No connection</h1>
        <p className="text-[13px] leading-relaxed text-dim">
          This screen hasn&apos;t been opened on this device yet, so there is nothing
          saved to show. Your saved library and today&apos;s quiz still work.
        </p>
      </div>

      <div className="w-full max-w-[320px] space-y-3">
        <Link
          href="/saved"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-lumen py-3 text-[14px] font-semibold text-canvas"
        >
          <BookmarkIcon className="h-4 w-4" />
          Open my saved library
        </Link>

        <Link
          href="/"
          className="glass glass-pressable flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white"
        >
          Back to home
        </Link>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-[13px] font-medium text-faint active:text-white"
        >
          <RefreshIcon className="h-4 w-4" />
          Try again
        </button>
      </div>

      <p className="text-[11px] text-faint">
        Tip: tap Save offline on any resource to guarantee it works with no signal.
      </p>
    </div>
  );
}
