"use client";

import Link from "next/link";
import ResourceCard from "@/components/ResourceCard";
import { RailSkeleton } from "@/components/Skeleton";
import { apiUrl, type ResourcePayload } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";

/**
 * UpdatedRail — this week's short notes and new study material.
 * Horizontally scrollable with momentum on iOS, snapping card to card. Shows
 * the built-in seed catalogue (or the mirror) while the request is in flight,
 * so the rail is never empty.
 */
export default function UpdatedRail() {
  const url = apiUrl("/api/resources", { sort: "recent", limit: 25 });
  const { data, loading } = useApiResource<ResourcePayload>(url, {
    cacheKey: "resources:recent:25",
  });

  const courseUnits = new Set(["pharmacology", "psychology", "physiology", "anatomy", "first-aid", "nursing", "microbiology", "medical-journals"]);
  const resources = (data?.data ?? []).filter((resource) => courseUnits.has(resource.category_slug)).slice(0, 6);
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Notes of the week</h2>
          <p className="text-[11px] text-faint">Short reads by course unit</p>
        </div>
        <Link
          href="/categories"
          className="glass inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-lumen"
        >
          Updates
        </Link>
      </div>

      {loading && resources.length === 0 ? (
        <RailSkeleton />
      ) : (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              compact
              className="w-[248px] shrink-0 snap-start"
            />
          ))}
        </div>
      )}
    </section>
  );
}
