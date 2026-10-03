"use client";

import { DailyQuizCard } from "@/components/DailyQuiz";
import Greeting from "@/components/Greeting";
import InstallPrompt from "@/components/InstallPrompt";
import UpdatedRail from "@/components/UpdatedRail";
import { OfflineIcon } from "@/components/icons";
import UnattemptedQuizList from "@/components/UnattemptedQuizList";
import { useProgress } from "@/lib/progress/ProgressProvider";

/**
 * ===========================================================================
 * / — Home
 * ===========================================================================
 * The screen a student opens 20 times a day, so it is deliberately short:
 *
 *   Greeting        who you are, how far along you are, your streak
 *   Daily Quiz      one tap into the same five questions as everyone else
 *   Updated today   what the editors touched most recently
 *   Subjects        the seven collections, each with its own progress ring
 *
 * Each block owns its own fetch and its own skeleton, so the screen paints
 * progressively instead of waiting on the slowest request. On a cold offline
 * start every block reads from the local mirror, and the shimmer never appears
 * at all.
 */
export default function HomePage() {
  const { online, summary } = useProgress();

  return (
    <div className="space-y-7 px-5 pt-safe">
      <Greeting />

      <div>
        <DailyQuizCard />
      </div>

      {!online && summary.records.length > 0 && (
        <div className="glass flex items-start gap-3 rounded-2xl p-3.5">
          <OfflineIcon className="mt-0.5 h-4 w-4 shrink-0 text-lumen" />
          <p className="text-[12px] leading-relaxed text-dim">
            You&apos;re offline. Everything you have already opened is available. Open{" "}
            <span className="text-white">Saved</span> to see what&apos;s guaranteed to work
            without signal.
          </p>
        </div>
      )}

      <UnattemptedQuizList />

      <UpdatedRail />

      <InstallPrompt />

      <p className="pb-2 text-center text-[11px] text-faint">
        LUMEN works offline · Built for medical students in Uganda
      </p>
    </div>
  );
}
