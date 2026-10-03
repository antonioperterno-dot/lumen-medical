import { NextResponse } from "next/server";
import { getPapers } from "@/lib/papers";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const courseUnit = params.get("courseUnit")?.trim() || undefined;
  const includeAll = params.get("all") === "true";
  const papers = await getPapers(courseUnit, includeAll);
  return NextResponse.json({ data: papers }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
