"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { PAPER_ATTEMPTS_CHANGED, currentWeekKey, readPaperAttempts, type PaperAttempt } from "@/lib/paper-attempts";
import type { PaperSummary } from "@/lib/papers";
import { ChevronRightIcon } from "@/components/icons";

const COURSE_UNITS = [
  ["pharmacology", "Pharmacology"],
  ["psychology", "Psychology"],
  ["physiology", "Physiology"],
  ["anatomy", "Anatomy"],
  ["first-aid", "First Aid"],
  ["nursing", "Nursing"],
  ["microbiology", "Microbiology"],
  ["medical-journals", "Medical Journals"],
];

type Payload = { data: PaperSummary[] };

export default function PaperList({ courseUnit, compact = false }: { courseUnit?: string; compact?: boolean }) {
  const url = apiUrl("/api/papers", { courseUnit });
  const { data, loading } = useApiResource<Payload>(url, { cacheKey: `papers:${courseUnit ?? "all"}` });
  const [attempts, setAttempts] = useState<Record<string, PaperAttempt>>({});

  useEffect(() => {
    const load = () => setAttempts(readPaperAttempts());
    load();
    window.addEventListener(PAPER_ATTEMPTS_CHANGED, load);
    return () => window.removeEventListener(PAPER_ATTEMPTS_CHANGED, load);
  }, []);

  const papers = data?.data ?? [];
  const currentWeek = currentWeekKey();
  const visibleUnits = courseUnit ? COURSE_UNITS.filter(([slug]) => slug === courseUnit) : COURSE_UNITS;

  if (loading && papers.length === 0) return <div className="glass h-20 animate-pulse rounded-2xl" />;

  return (
    <section className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <div>
          <h2 className="text-[16px] font-semibold text-white">Course units</h2>
          <p className="text-[11px] text-faint">Latest quiz for each unit · open a unit to browse its full quiz list</p>
        </div>
      )}
      <div className={compact ? "space-y-3" : "space-y-4"}>
        {visibleUnits.map(([slug, label]) => {
          const unitPapers = papers.filter((paper) => paper.courseUnit === slug);
          const latest = unitPapers[0];
          const attempted = latest ? attempts[latest.id]?.week === currentWeek : false;
          const quizCount = latest?.quizCount ?? (courseUnit ? unitPapers.length : latest ? 1 : 0);
          const archiveHref = `/papers/unit/${slug}`;

          return (
            <article key={slug} className={`glass rounded-2xl ${compact ? "p-3.5" : "p-4"}`}>
              {!compact && (
                <Link href={archiveHref} className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="min-w-0 break-words text-[14px] font-semibold text-white">{label}</h3>
                  <span className="shrink-0 text-[11px] font-semibold text-lumen">{quizCount} {quizCount === 1 ? "quiz" : "quizzes"} · View all</span>
                </Link>
              )}

              {latest ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-lumen/25 bg-lumen/5 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-white">{latest.title}</span>
                    <span className="text-[11px] text-faint">Latest · Level {latest.level} · {latest.durationMinutes} min</span>
                  </span>
                  <Link href={`/papers/${latest.id}`} className="shrink-0 text-[11px] font-semibold text-lumen">
                    {attempted ? "Review" : "Start"}
                  </Link>
                </div>
              ) : (
                <p className="text-[12px] text-faint">No published quizzes yet.</p>
              )}

              {compact && (
                <Link href={archiveHref} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-lumen">
                  Browse all {label} quizzes{quizCount ? ` (${quizCount})` : ""}
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
