import { NextResponse } from "next/server";
import { SEED_RESOURCES, getResourceById, isTursoConfigured } from "@/lib/turso";
import type { ResourceMeta } from "@/lib/types";

/**
 * ===========================================================================
 * MICROSERVICE 1 — GET /api/resources/[id]
 * ===========================================================================
 * One resource, including `body_md` (the reader). Cached hard, because once a
 * student has opened a lecture it should be readable forever — including on a
 * ward round with no signal.
 */

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const id = decodeURIComponent(params.id);

  try {
    const resource = await getResourceById(id);

    if (!resource) {
      return NextResponse.json(
        { data: null, meta: { error: "not_found", id } },
        { status: 404 },
      );
    }

    const meta: ResourceMeta = {
      source: isTursoConfigured ? "turso" : "seed",
      servedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { data: resource, meta },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    const seeded = SEED_RESOURCES.find((resource) => resource.id === id) ?? null;

    if (!seeded) {
      return NextResponse.json(
        { data: null, meta: { error: "unavailable", id } },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        data: seeded,
        meta: {
          source: "fallback",
          degraded: true,
          servedAt: new Date().toISOString(),
        } satisfies ResourceMeta,
      },
      { headers: { "Cache-Control": "no-store", "X-Lumen-Degraded": "1" } },
    );
  }
}
