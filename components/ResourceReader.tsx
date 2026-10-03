"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import SaveOfflineButton from "@/components/SaveOfflineButton";
import ScreenHeader from "@/components/ScreenHeader";
import { SkeletonBlock, SkeletonLine } from "@/components/Skeleton";
import { ErrorState } from "@/components/States";
import { ClockIcon } from "@/components/icons";
import { apiUrl, type SingleResourcePayload } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { parseInline, parseMarkdown } from "@/lib/markdown";
import { useProgress } from "@/lib/progress/ProgressProvider";
import type { Resource } from "@/lib/types";
import { cn, readingLabel, updatedLabel } from "@/lib/utils";

/**
 * ===========================================================================
 * ResourceReader — the article view
 * ===========================================================================
 * Progress is measured by scroll position, the way a student actually reads:
 * the ring fills as the page moves, and the value is stored locally every time
 * it advances 5%. Ten minutes of scrolling on a dead network still ends with an
 * accurate "72% read" the next time the app opens.
 *
 * `seconds_spent` is accumulated in 15-second slices while the tab is visible,
 * which keeps the "time on task" statistic honest without a heartbeat request.
 */

const SAVE_EVERY_PERCENT = 5;
const TICK_MS = 15_000;

export default function ResourceReader({ id }: { id: string }) {
  const url = `/api/resources/${encodeURIComponent(id)}`;
  const { data, loading, error, fromCache, refresh } = useApiResource<SingleResourcePayload>(
    url,
    // Same key SaveOfflineButton writes to — that is what makes "Saved offline"
    // a real guarantee rather than a bookmark.
    { cacheKey: url },
  );

  const { recordRead, percentFor } = useProgress();
  const [visiblePercent, setVisiblePercent] = useState(0);
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});
  const lastSaved = useRef(0);
  const secondsBuffer = useRef(0);

  const resource = data?.data ?? null;
  const stub = !resource?.body_md;

  /* ------------------------------------------------------------------ */
  /* Reading progress                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!resource) return;

    const readPercent = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 40) return 100; // short article: opening it counts.
      return Math.max(
        0,
        Math.min(100, Math.round((window.scrollY / scrollable) * 100)),
      );
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = readPercent();
        setVisiblePercent(next);

        if (next >= 100 || next - lastSaved.current >= SAVE_EVERY_PERCENT) {
          lastSaved.current = next;
          recordRead({
            resourceId: resource.id,
            categorySlug: resource.category_slug,
            percent: next,
            secondsSpent: secondsBuffer.current,
          });
          secondsBuffer.current = 0;
        }
      });
    };

    // A student who opens an article has started it, even before scrolling.
    setVisiblePercent(readPercent());
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      // Flush whatever is left so closing the app doesn't lose the last slice.
      secondsBuffer.current = 0;
      recordRead({
        resourceId: resource.id,
        categorySlug: resource.category_slug,
        percent: Math.max(lastSaved.current, readPercent()),
        secondsSpent: 0,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.id]);

  /* Time on task, only while the tab is actually visible. */
  useEffect(() => {
    if (!resource) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        secondsBuffer.current += TICK_MS / 1000;
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [resource?.id]);

  const storedPercent = resource ? percentFor(resource.id) : 0;
  const percent = Math.max(storedPercent, visiblePercent);

  const blocks = useMemo(() => parseMarkdown(resource?.body_md), [resource?.body_md]);

  useEffect(() => {
    if (!resource) return;
    try {
      setCheckedMilestones(
        JSON.parse(window.localStorage.getItem(`lumen:v1:milestones:${resource.id}`) ?? "{}") as Record<string, boolean>,
      );
    } catch {
      setCheckedMilestones({});
    }
  }, [resource?.id]);

  const toggleMilestone = (key: string, checked: boolean) => {
    setCheckedMilestones((current) => {
      const next = { ...current, [key]: checked };
      try {
        if (resource) window.localStorage.setItem(`lumen:v1:milestones:${resource.id}`, JSON.stringify(next));
      } catch {
        // Checklist interaction still works for the current screen.
      }
      return next;
    });
  };

  if (loading && !resource) {
    return (
      <div className="px-5">
        <ScreenHeader title="Loading…" back />
        <div className="space-y-4 pt-4">
          <SkeletonBlock className="h-6 w-3/4" />
          <SkeletonLine width="w-1/2" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="px-5 pt-6">
        <ErrorState
          message="This resource could not be loaded, and no offline copy exists on this device."
          onRetry={refresh}
        />
        <div className="pt-4 text-center">
          <Link href="/categories" className="text-[13px] font-medium text-lumen">
            Browse other subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <ScreenHeader
        title={resource.title}
        subtitle={`${resource.subtitle ?? resource.category_slug.replace(/-/g, " ")} · ${readingLabel(resource.reading_time)}`}
        back={`/categories/${resource.category_slug}`}
        right={
          <div className="flex items-center gap-2">
            <ProgressRing percent={percent} size={40} stroke={3.5} />
            <SaveOfflineButton resourceId={resource.id} compact />
          </div>
        }
      />

      <article className="space-y-1 pb-6 pt-2">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {resource.is_trending === 1 && <span className="pill-trending">Trending</span>}
          <span className="pill-muted capitalize">
            {resource.category_slug.replace(/-/g, " ")}
          </span>
          <span className="pill-muted capitalize">{resource.level}</span>
          {fromCache && <span className="pill-muted">offline copy</span>}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {readingLabel(resource.reading_time)}
          </span>
          <span aria-hidden>·</span>
          <span>{updatedLabel(resource.updated_at)}</span>
          {percent > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-lumen">{percent}% read</span>
            </>
          )}
        </div>

        {stub ? (
          <div className="glass mt-4 space-y-3 rounded-2xl p-4">
            <h2 className="text-[15px] font-semibold text-white">{resource.title}</h2>
            {resource.summary && (
              <p className="text-[14px] leading-relaxed text-dim">{resource.summary}</p>
            )}
            <p className="text-[12px] leading-relaxed text-faint">
              The full article lives in Turso and appears here as soon as this device has
              a connection. Run{" "}
              <code className="text-lumen">npm run seed:turso</code> to load the complete
              catalogue, or tap <span className="text-white">Save offline</span> while
              online to keep it permanently.
            </p>
          </div>
        ) : (
          <div className="pt-2">{blocks.map((block, index) => {
              switch (block.type) {
                case "h2":
                  return (
                    <h2
                      key={index}
                      className="mt-6 text-[18px] font-bold leading-snug text-white"
                    >
                      {block.text}
                    </h2>
                  );
                case "h3":
                  return (
                    <h3
                      key={index}
                      className="mt-5 text-[15px] font-semibold leading-snug text-lumen"
                    >
                      {block.text}
                    </h3>
                  );
                case "quote":
                  return (
                    <blockquote
                      key={index}
                      className="mt-3 border-l-2 border-lumen/50 pl-3 text-[14px] italic leading-relaxed text-dim"
                    >
                      {block.text}
                    </blockquote>
                  );
                case "callout":
                  return (
                    <div
                      key={index}
                      className="mt-4 rounded-xl border border-lumen/30 bg-lumen/10 p-3.5 text-[14px] font-medium leading-relaxed text-white"
                    >
                      {block.text}
                    </div>
                  );
                case "checklist":
                  return (
                    <ul key={index} className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3.5">
                      {block.items.map((item, itemIndex) => {
                        const key = `${index}:${itemIndex}`;
                        const checked = checkedMilestones[key] ?? item.checked;
                        return (
                          <li key={key}>
                            <label className="flex items-start gap-2.5 text-[14px] leading-relaxed text-white/85">
                              <input type="checkbox" checked={checked} onChange={(event) => toggleMilestone(key, event.target.checked)} className="mt-1 h-4 w-4 accent-[#39FF88]" />
                              <span className={checked ? "text-dim line-through" : undefined}><Inline text={item.text} /></span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  );
                case "ul":
                case "ol": {
                  const ListTag = (block.type === "ul" ? "ul" : "ol") as "ul" | "ol";
                  return (
                    <ListTag
                      key={index}
                      className={cn(
                        "mt-3 space-y-1.5 pl-5 text-[15px] leading-relaxed text-white/85",
                        block.type === "ul" ? "list-disc" : "list-decimal",
                      )}
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          <Inline text={item} />
                        </li>
                      ))}
                    </ListTag>
                  );
                }
                default:
                  return (
                    <p
                      key={index}
                      className="mt-3 text-[15px] leading-relaxed text-white/85"
                    >
                      <Inline text={block.text} />
                    </p>
                  );
              }
            })}</div>
        )}

        <div className="mt-8 space-y-3">
          <SaveOfflineButton
            resourceId={resource.id}
            className="w-full justify-center py-3"
          />
          <p className="text-center text-[11px] text-faint">
            {percent >= 92
              ? "Marked as finished. Well done."
              : "Your place is saved on this device automatically."}
          </p>
        </div>
      </article>
    </div>
  );
}

/** Renders **bold**, *italic* and `code` inside a line of markdown. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        if (token.code) {
          return (
            <code
              key={index}
              className="rounded bg-white/10 px-1 py-0.5 text-[13px] text-lumen"
            >
              {token.text}
            </code>
          );
        }
        if (token.bold) {
          return (
            <strong key={index} className="font-semibold text-white">
              {token.text}
            </strong>
          );
        }
        if (token.italic) return <em key={index}>{token.text}</em>;
        return <span key={index}>{token.text}</span>;
      })}
    </>
  );
}
