import { NextResponse } from "next/server";
import { getPaper } from "@/lib/papers";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const paper = await getPaper(params.id);
  if (!paper) return NextResponse.json({ error: "paper_not_found" }, { status: 404 });
  return NextResponse.json({ data: paper }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
