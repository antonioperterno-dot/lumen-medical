"use client";

import GlassCard from "@/components/GlassCard";
import { RefreshIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * EmptyState / ErrorState — the two end-states every data screen needs.
 * A medical app must never show a blank white screen: if something failed, the
 * student gets an explanation and a way out.
 */

export function EmptyState({
  title,
  message,
  icon,
  action,
  className,
}: {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn("text-center", className)} padded={false}>
      <div className="flex flex-col items-center gap-3 px-6 py-10">
        <span className="glass-nested flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-lumen">
          {icon ?? <SearchIcon className="h-5 w-5" />}
        </span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="max-w-[280px] text-[13px] leading-relaxed text-dim">{message}</p>
        {action}
      </div>
    </GlassCard>
  );
}

export function ErrorState({
  message = "We couldn't load this section. Check your connection and try again.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <GlassCard className={cn("text-center", className)} padded={false}>
      <div className="flex flex-col items-center gap-3 px-6 py-10">
        <h2 className="text-base font-semibold text-white">Something went wrong</h2>
        <p className="max-w-[280px] text-[13px] leading-relaxed text-dim">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-lumen/40 bg-lumen/10 px-4 py-2 text-[13px] font-semibold text-lumen active:scale-[0.97]"
          >
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    </GlassCard>
  );
}
