"use client";

import CategoryTile from "@/components/CategoryTile";
import { CategoryGridSkeleton } from "@/components/Skeleton";
import { apiUrl, type ResourcePayload } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/useApiResource";
import type { Category, ResourceMeta } from "@/lib/types";

/**
 * CategoryGrid — the seven subject tiles.
 * One request carries both the categories and their counts (`include=all`), so
 * the home screen costs exactly two API calls in total (this + the rail).
 */

type Payload = {
  data: ResourcePayload["data"];
  meta: ResourceMeta & { categories?: Category[]; counts?: Record<string, number> };
};

export default function CategoryGrid({ limit = 24 }: { limit?: number }) {
  const url = apiUrl("/api/resources", { include: "all", limit });
  const { data, loading } = useApiResource<Payload>(url, {
    cacheKey: `resources:index:${limit}`,
  });

  const categories = data?.meta?.categories ?? [];
  const counts = data?.meta?.counts ?? {};
  const resources = data?.data ?? [];

  if (loading && categories.length === 0) return <CategoryGridSkeleton count={6} />;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-white">Browse by subject</h2>
        <p className="text-[11px] text-faint">
          Eight course units · progress shown per subject
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <CategoryTile
            key={category.id}
            category={category}
            counts={counts}
            resources={resources}
          />
        ))}
      </div>
    </section>
  );
}
