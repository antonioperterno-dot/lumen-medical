"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * ScreenHeader — the sticky title bar used on every inner screen.
 * Blurs as you scroll so the content slides under it, like an iOS nav bar.
 */
export default function ScreenHeader({
  title,
  subtitle,
  back,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Explicit href; pass `true` to just go back. Defaults to no back button. */
  back?: string | boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 -mx-5 mb-2 border-b border-white/5 px-5 pb-3 pt-safe",
        className,
      )}
      style={{
        background: "rgba(10,10,10,0.72)",
        WebkitBackdropFilter: "blur(18px) saturate(170%)",
        backdropFilter: "blur(18px) saturate(170%)",
      }}
    >
      <div className="flex items-center gap-3 pt-2">
        {back && (
          <div className="-ml-1 shrink-0">
            {typeof back === "string" ? (
              <Link
                href={back}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors active:text-lumen"
                aria-label="Back"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors active:text-lumen"
                aria-label="Back"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold leading-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[12px] leading-tight text-faint">{subtitle}</p>
          )}
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
