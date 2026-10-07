"use client";

import Link from "next/link";

/**
 * Route-level error boundary. A failed Turso/Firestore fetch must never blank
 * the app — offer retry + a way back to cached content.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lumen">
        Something went wrong
      </p>
      <h1 className="text-[20px] font-bold text-white">Couldn&apos;t load this screen</h1>
      <p className="max-w-[36ch] text-[13px] leading-relaxed text-dim">
        {error?.message || "The network dropped or the server had a bad minute."} Your
        saved offline copies are still on this device.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-lumen px-5 py-2.5 text-[13px] font-semibold text-canvas"
        >
          Try again
        </button>
        <Link
          href="/saved"
          className="glass-nested rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white/80"
        >
          Saved offline
        </Link>
      </div>
    </div>
  );
}
