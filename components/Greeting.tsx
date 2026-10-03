"use client";

import { GreetingSkeleton } from "@/components/Skeleton";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { firstName } from "@/lib/utils";

/**
 * Greeting — the home-screen header: "Good morning, Alex" + the badge.
 * The badge renders exactly as "Alex - PRO badge", per the product brief.
 */
export default function Greeting() {
  const { profile, summary, loading } = useProgress();

  if (loading || !profile) return <GreetingSkeleton />;

  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <div className="min-w-0">
        <p className="text-[12px] font-medium uppercase tracking-wide text-faint">
          {partOfDay}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <h1 className="truncate text-[22px] font-bold leading-tight text-white">
            {firstName(profile.preferredName || profile.displayName)}
          </h1>
          <span className="pill-trending shrink-0">{profile.badge}</span>
        </div>
        <p className="mt-1 text-[12px] text-dim">
          {summary.resourcesStarted > 0
            ? `${summary.overallPercent}% through your library · ${summary.resourcesCompleted} finished`
            : profile.institution ?? "Your library is ready. Start anywhere."}
        </p>
      </div>

    </div>
  );
}
