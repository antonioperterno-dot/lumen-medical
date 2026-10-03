import { NextResponse } from "next/server";
import {
  SEED_CATEGORIES,
  SEED_RESOURCES,
  filterSeedResources,
  getCategories,
  getCategoryCounts,
  getRecentlyUpdated,
  isTursoConfigured,
  listResources,
} from "@/lib/turso";
import type { Category, ResourceMeta } from "@/lib/types";
import { clampInt } from "@/lib/utils";

/**
 * ===========================================================================
 * MICROSERVICE 1 — GET /api/resources   (Turso / libSQL)
 * ===========================================================================
 * The medical catalogue. This is the only endpoint the browser needs in order
 * to browse everything, and it is the one the service worker caches for 30
 * days — i.e. this response IS the offline library.
 *
 * Query params:
 *   category=cardiology     filter by category slug
 *   q=stemi                 search title/subtitle/summary
 *   trending=true           only the trending resources
 *   sort=recent             the "Updated today" ordering
 *   limit=20  (1–50)        page size
 *   after=<resource id>     keyset pagination cursor
 *   include=all|counts|categories   attach the category index + counts
 *
 * Degraded mode: if Turso is unreachable we answer 200 with the built-in seed
 * catalogue and `meta.degraded: true`. A student on a ward round must never be
 * shown an error page because a database had a bad minute.
 */

export const runtime = "nodejs";
// Cache the response at the edge for a minute; the SW keeps it far longer.
export const revalidate = 60;

const CACHEABLE = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
} as const;

function countByCategory(resources: Array<{ category_slug: string }>) {
  return resources.reduce<Record<string, number>>((acc, resource) => {
    acc[resource.category_slug] = (acc[resource.category_slug] ?? 0) + 1;
    return acc;
  }, {});
}

/** Catalogue-wide total, derived from the per-category counts. */
function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((total, value) => total + value, 0);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const category = params.get("category")?.trim() || undefined;
  const search = params.get("q")?.trim() || undefined;
  const trending = ["1", "true", "yes"].includes(
    (params.get("trending") ?? "").toLowerCase(),
  );
  const sort = params.get("sort") ?? "";
  const after = params.get("after")?.trim() || undefined;
  const limit = clampInt(Number(params.get("limit") ?? 20), 1, 50);
  const include = params.get("include") ?? "";
  const wantsCategories = include === "all" || include === "categories";
  const wantsCounts = wantsCategories || include === "counts";

  try {
    const [resources, categories, counts] = await Promise.all([
      sort === "recent"
        ? getRecentlyUpdated(limit)
        : listResources({ category, trending, search, limit, after }),
      wantsCategories ? getCategories() : Promise.resolve<Category[] | undefined>(undefined),
      wantsCounts
        ? getCategoryCounts()
        : Promise.resolve<Record<string, number> | undefined>(undefined),
    ]);

    const meta: ResourceMeta = {
      source: isTursoConfigured ? "turso" : "seed",
      servedAt: new Date().toISOString(),
      returned: resources.length,
      ...(categories ? { categories } : {}),
      // `total` is the size of the whole catalogue — never narrowed by the
      // `category` filter above, because the subject tiles need the real figure.
      ...(counts ? { counts, total: sumCounts(counts) } : {}),
    };

    return NextResponse.json({ data: resources, meta }, { headers: CACHEABLE });
  } catch (error) {
    // Turso configured but unreachable: serve the seed catalogue instead.
    const seeded = filterSeedResources({
      category,
      trending,
      search,
      limit,
    });

    const meta: ResourceMeta & { message: string } = {
      source: "fallback",
      servedAt: new Date().toISOString(),
      returned: seeded.length,
      degraded: true,
      message:
        error instanceof Error
          ? `Served from the bundled seed catalogue: ${error.message}`
          : "Served from the bundled seed catalogue",
      ...(wantsCategories ? { categories: SEED_CATEGORIES } : {}),
      ...(wantsCounts
        ? {
            counts: countByCategory(SEED_RESOURCES),
            total: SEED_RESOURCES.length,
          }
        : {}),
    };

    return NextResponse.json(
      { data: seeded, meta },
      { status: 200, headers: { ...CACHEABLE, "X-Lumen-Degraded": "1" } },
    );
  }
}
