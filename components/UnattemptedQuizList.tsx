"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { ChevronRightIcon } from "@/components/icons";
import {
  PAPER_ATTEMPTS_CHANGED,
  readPaperAttempts,
  type PaperAttempt,
} from "@/lib/paper-attempts";
import type { PaperSummary } from "@/lib/papers";

type Payload = { data: PaperSummary[] };

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export default function UnattemptedQuizList() {
  const url = apiUrl("/api/papers", { all: true });
  const { data, loading } = useApiResource<Payload>(url, { cacheKey: "papers:all-published" });
  const [attempts, setAttempts] = useState<Record<string, PaperAttempt>>({});
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [randomizedIds, setRandomizedIds] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      setAttempts(readPaperAttempts());
      setAttemptsLoaded(true);
    };
    load();
    window.addEventListener(PAPER_ATTEMPTS_CHANGED, load);
    return () => window.removeEventListener(PAPER_ATTEMPTS_CHANGED, load);
  }, []);

  const unattempted = useMemo(
    () => (data?.data ?? []).filter((paper) => !attempts[paper.id]),
    [data?.data, attempts],
  );
  useEffect(() => {
    setRandomizedIds(shuffle(unattempted.map((paper) => paper.id)));
  }, [unattempted]);

  const papersById = new Map(unattempted.map((paper) => [paper.id, paper]));
  const randomized = randomizedIds
    .map((id) => papersById.get(id))
    .filter((paper): paper is PaperSummary => Boolean(paper));

  return (
    <section className="glass space-y-3 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-white">Course Quizzes</h2>
          <p className="mt-0.5 text-[11px] text-dim">Unattempted quizzes · shuffled</p>
        </div>
        <Link href="/papers" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-lumen">
          Browse all <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading || !attemptsLoaded ? (
        <div className="glass h-16 animate-pulse rounded-xl" />
      ) : randomized.length > 0 ? (
        <div className="space-y-2">
          {randomized.map((paper, index) => (
            <div key={paper.id} className="glass-nested flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-white">Quiz {index + 1}</span>
                <span className="text-[11px] text-faint">Level {paper.level} · {paper.durationMinutes} min</span>
              </span>
              <Link
                href={`/papers/${paper.id}`}
                aria-label={`Start quiz ${index + 1}`}
                className="shrink-0 text-[11px] font-semibold text-lumen"
              >
                Start
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-faint">You have attempted every published quiz on this device.</p>
      )}
    </section>
  );
}
