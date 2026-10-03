"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InstallPrompt from "@/components/InstallPrompt";
import ProgressRing from "@/components/ProgressRing";
import ScreenHeader from "@/components/ScreenHeader";
import { GreetingSkeleton } from "@/components/Skeleton";
import { OfflineIcon, RefreshIcon } from "@/components/icons";
import { useAuth } from "@/lib/firebase/AuthContext";
import { useProgress, useProfileWriter } from "@/lib/progress/ProgressProvider";
import { formatBytes } from "@/lib/utils";

/**
 * ===========================================================================
 * /profile — identity, progress and sync state
 * ===========================================================================
 * Shows the account as "Alex - PRO badge", everything the student has studied,
 * and — critically — whether their progress has actually reached the server.
 * A student who studied offline all day should be able to confirm their work is
 * safe before they put the phone away.
 */
export default function ProfilePage() {
  const { profile, summary, loading, syncing, online, savedCount, storageBytes, refresh } =
    useProgress();
  const { firebaseEnabled, signOut } = useAuth();
  const writeProfile = useProfileWriter();

  const [name, setName] = useState(profile?.displayName ?? "");
  const [institution, setInstitution] = useState(profile?.institution ?? "");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.displayName);
    setInstitution(profile.institution ?? "");
    setDirty(false);
  }, [profile]);

  if (loading || !profile) {
    return (
      <div className="space-y-6 px-5 pt-safe">
        <GreetingSkeleton />
      </div>
    );
  }

  const save = () => {
    writeProfile({ displayName: name.trim() || "Alex", institution: institution.trim() });
    setDirty(false);
  };

  const stats = [
    { label: "Started", value: `${summary.resourcesStarted}` },
    { label: "Finished", value: `${summary.resourcesCompleted}` },
    { label: "Quiz accuracy", value: `${summary.quizAccuracy}%` },
    { label: "Answered", value: `${summary.quizAnswered}` },
    { label: "Saved offline", value: `${savedCount}` },
    { label: "On device", value: formatBytes(storageBytes) },
  ];
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return { label: date.toLocaleDateString("en-GB", { weekday: "short" }), minutes: Math.round((summary.dailySeconds[key] ?? 0) / 60) };
  });

  return (
    <div className="px-5">
      <ScreenHeader
        title="Profile"
        subtitle={`${profile.badge} member`}
        back="/"
        right={<Link href="/settings" className="text-[12px] font-semibold text-lumen">Settings</Link>}
      />

      <div className="space-y-5 pt-1">
        {/* Identity -------------------------------------------------- */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-lumen/30 bg-lumen/10 text-lg font-bold text-lumen">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold leading-tight text-white">
                {profile.displayName}
              </h1>
              <p className="text-[12px] text-dim">
                {profile.displayName} - {profile.badge} badge
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {profile.yearOfStudy && (
                  <span className="pill-muted">Year {profile.yearOfStudy}</span>
                )}
                {profile.faculty && <span className="pill-muted">{profile.faculty}</span>}
              </div>
            </div>
            <ProgressRing
              percent={summary.overallPercent}
              size={56}
              label="overall"
            />
          </div>
        </section>

        {/* Editable details ------------------------------------------ */}
        <section className="glass space-y-3 rounded-2xl p-4">
          <h2 className="text-[14px] font-semibold text-white">Your details</h2>

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wide text-faint">
              Display name
            </span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setDirty(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[14px] text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
              placeholder="Alex"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wide text-faint">
              Institution
            </span>
            <input
              value={institution}
              onChange={(event) => {
                setInstitution(event.target.value);
                setDirty(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[14px] text-white placeholder:text-faint focus:border-lumen/40 focus:outline-none"
              placeholder="Makerere University"
            />
          </label>

          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={
              dirty
                ? "w-full rounded-xl bg-lumen py-2.5 text-[13px] font-semibold text-canvas"
                : "w-full cursor-not-allowed rounded-xl bg-white/10 py-2.5 text-[13px] font-semibold text-faint"
            }
          >
            {dirty ? "Save details" : "Saved"}
          </button>
        </section>

        {/* Stats ------------------------------------------------------ */}
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold text-white">Your progress</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-3.5">
                <p className="text-[18px] font-bold leading-none text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-faint">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-end justify-between"><h2 className="text-[14px] font-semibold text-white">Study time</h2><span className="text-[11px] text-faint">Last 7 days</span></div>
          <div className="grid grid-cols-7 items-end gap-2">
            {week.map((day) => <div key={day.label} className="space-y-1 text-center"><div className="mx-auto flex h-16 items-end"><span className="w-full rounded-t bg-lumen/70" style={{ height: `${Math.max(8, Math.min(100, day.minutes * 2))}%` }} /></div><p className="text-[9px] text-faint">{day.label}</p><p className="text-[9px] text-dim">{day.minutes}m</p></div>)}
          </div>
        </section>

        {/* Sync state ------------------------------------------------- */}
        <section className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-white">Sync</h2>
            <span
              className={
                online && summary.pending === 0
                  ? "pill-trending"
                  : "pill-muted"
              }
            >
              {!online ? (
                <>
                  <OfflineIcon className="h-3 w-3" />
                  Offline
                </>
              ) : syncing ? (
                "Syncing…"
              ) : summary.pending > 0 ? (
                `${summary.pending} queued`
              ) : (
                "Up to date"
              )}
            </span>
          </div>

          <p className="text-[12px] leading-relaxed text-dim">
            Your progress is stored in your own Firestore document. Offline study is queued on this device and pushed the moment you have signal.
          </p>

          <button
            type="button"
            onClick={refresh}
            disabled={syncing || !online}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[12px] font-semibold text-white/80 active:text-white disabled:opacity-50"
          >
            <RefreshIcon className="h-4 w-4" />
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </section>

        <InstallPrompt />

        {/* Danger zone ------------------------------------------------ */}
        <section className="glass space-y-3 rounded-2xl p-4">
          <h2 className="text-[14px] font-semibold text-white">This device</h2>
          <p className="text-[12px] leading-relaxed text-dim">
            LUMEN keeps no saved resources and your reading progress on this phone. Signing out keeps the offline copies but stops syncing to your account.
          </p>
          {firebaseEnabled && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-[12px] font-semibold text-white/80 active:text-white"
            >
              Sign out
            </button>
          )}
        </section>

        <p className="pb-2 text-center text-[11px] text-faint">LUMEN · your study, your progress</p>
      </div>
    </div>
  );
}
