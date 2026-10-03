"use client";

import GlassCard from "@/components/GlassCard";
import ProgressRing from "@/components/ProgressRing";
import { ClockIcon, FlameIcon } from "@/components/icons";
import { useResourcePercent } from "@/lib/progress/ProgressProvider";
import type { Resource } from "@/lib/types";
import { cn, postedLabel, readingLabel, updatedLabel } from "@/lib/utils";

/**
 * ===========================================================================
 * ResourceCard — title · trending tag · "Updated today" · progress ring
 * ===========================================================================
 * Consumes the progress ring value straight from the local mirror, so the ring
 * is accurate the moment the card paints, online or not.
 */

export default function ResourceCard({
  resource,
  href,
  className,
  /** Pass a value to override the stored progress (search results, previews). */
  percentOverride,
  compact = false,
}: {
  resource: Resource;
  href?: string;
  className?: string;
  percentOverride?: number;
  compact?: boolean;
}) {
  const stored = useResourcePercent(resource.id);
  const percent = percentOverride ?? stored;
  const unread = percent === 0;

  return (
    <GlassCard
      href={href ?? `/resources/${resource.id}`}
      className={cn("animate-fade-in-up", className)}
      ariaLabel={`${resource.title}. ${postedLabel(resource.updated_at)}. ${percent}% complete.`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {unread ? (
              <span className="pill-trending">New</span>
            ) : resource.is_trending === 1 && (
              <span className="pill-trending">
                <FlameIcon className="h-3 w-3" strokeWidth={2} />
                Trending
              </span>
            )}
            {resource.level === "essential" && (
              <span className="pill-muted">Essential</span>
            )}
            <span className="pill-muted capitalize">{resource.category_slug.replace(/-/g, " ")}</span>
          </div>

          <h3
            className={cn(
              "font-semibold leading-snug text-white",
              compact ? "text-[15px]" : "text-base",
            )}
          >
            {resource.title}
          </h3>

          {resource.subtitle && (
            <p className="mt-0.5 text-[13px] font-medium text-lumen">
              {resource.subtitle}
            </p>
          )}

          {!compact && resource.summary && (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-dim">
              {resource.summary}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {readingLabel(resource.reading_time)}
            </span>
            <span aria-hidden>·</span>
            <span>
              {postedLabel(resource.updated_at)}
            </span>
          </div>
        </div>

        <ProgressRing percent={percent} size={compact ? 46 : 56} />
      </div>
    </GlassCard>
  );
}
