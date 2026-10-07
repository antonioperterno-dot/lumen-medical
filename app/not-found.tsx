import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-lumen">404</p>
      <h1 className="text-[20px] font-bold text-white">Page not found</h1>
      <p className="max-w-[36ch] text-[13px] leading-relaxed text-dim">
        That link is stale or mistyped. Your saved offline library is one tap away.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-lumen px-5 py-2.5 text-[13px] font-semibold text-canvas"
        >
          Go home
        </Link>
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
