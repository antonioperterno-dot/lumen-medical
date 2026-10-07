"use client";

import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import ResourceCard from "@/components/ResourceCard";
import ScreenHeader from "@/components/ScreenHeader";
import { ResourceListSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/States";
import { BookmarkIcon, DownloadIcon } from "@/components/icons";
import { apiUrl, type ResourcePayload } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { formatBytes } from "@/lib/utils";

/**
 * ===========================================================================
 * /saved — the offline library
 * ===========================================================================
 * The list of resources the student explicitly kept. The metadata comes from
 * the (cached) catalogue endpoint, so this screen works on a dead network: the
 * mirror answers instantly and the cards still render with real titles.
 */
export default function SavedPage() {
  const { savedIds, storageBytes, clearOfflineData, summary } = useProgress();

  const url = apiUrl("/api/resources", { limit: 50 });
  const { data, loading, error } = useApiResource<ResourcePayload>(url, {
    cacheKey: "resources:all:50",
  });

  const savedSet = new Set(savedIds);
  const saved = (data?.data ?? []).filter((resource) => savedSet.has(resource.id));
  // Anything saved but not in the fetched page still counts: it exists on the
  // device even if the catalogue response has not been refreshed yet.
  const missingCount = Math.max(0, savedIds.length - saved.length);

  return (
    <div className="px-5">
      <ScreenHeader
        title="Saved offline"
        subtitle={`${savedIds.length} kept · ${formatBytes(storageBytes)} on this device`}
        back="/"
        right={<ProgressRing percent={summary.overallPercent} size={40} stroke={3.5} />}
      />

      <div className="space-y-5 pt-1">
        {savedIds.length === 0 ? (
          <EmptyState
            icon={<BookmarkIcon className="h-5 w-5" />}
            title="Nothing saved yet"
            message="Open a resource and tap Save offline to keep a copy on this device."
            action={
              <Link
                href="/categories"
                className="mt-1 inline-flex items-center gap-2 rounded-full border border-lumen/40 bg-lumen/10 px-4 py-2 text-[13px] font-semibold text-lumen"
              >
                <DownloadIcon className="h-4 w-4" />
                Browse subjects
              </Link>
            }
          />
        ) : (
          <>
            {loading && saved.length === 0 ? (
              <ResourceListSkeleton count={3} />
            ) : saved.length === 0 ? (
              <div className="glass rounded-2xl p-4">
                <p className="text-[13px] leading-relaxed text-dim">
                  {error
                    ? "You have saved resources on this device, but the catalogue can't be listed while offline."
                    : "Preparing your saved library…"}
                </p>
                {missingCount > 0 && (
                  <p className="mt-1 text-[11px] text-faint">
                    {missingCount} saved item{missingCount === 1 ? "" : "s"} not shown yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {saved.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}

            <div className="glass space-y-3 rounded-2xl p-4">
              <h2 className="text-[14px] font-semibold text-white">Manage storage</h2>
              <p className="text-[12px] leading-relaxed text-dim">
                Saved resources are stored on this device only. Clearing them will not
                delete your progress or your account. It just removes the offline copies.
              </p>
              <button
                type="button"
                onClick={clearOfflineData}
                className="glass-nested w-full rounded-xl border border-white/10 py-2.5 text-[12px] font-semibold text-white/80 active:text-white"
              >
                Clear offline copies
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
