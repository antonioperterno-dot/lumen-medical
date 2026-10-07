import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { category?: string; answers?: string[] };

/* -------------------------------------------------------------------------- */
/* Per-IP throttling                                                           */
/* In-memory: each serverless instance has its own window, which is fine for a */
/* cost guard (the goal is stopping runaway loops, not perfect fairness).      */
/* -------------------------------------------------------------------------- */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) {
      // Cheap sweep so a flood of unique IPs can't grow the map forever.
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.length !== 2 || answers.some((answer) => typeof answer !== "string" || !answer.trim())) {
    return NextResponse.json({ error: "two_answers_required" }, { status: 400 });
  }

  const endpoint = process.env.AI_MARKING_URL;
  const apiKey = process.env.AI_MARKING_API_KEY;
  if (!endpoint || !apiKey) {
    return NextResponse.json(
      { score: 0, feedback: "AI marking is not configured yet. Reconnect after the marking service is enabled." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ category: body.category ?? "mixed", answers }),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error("marking_failed");
    const result = (await response.json()) as { score?: number; feedback?: string };
    return NextResponse.json({ score: Math.max(0, Math.min(20, Number(result.score ?? 0))), feedback: result.feedback ?? "Marked." });
  } catch {
    return NextResponse.json({ score: 0, feedback: "Marking took too long. Your answers are still available to submit again." }, { status: 504 });
  }
}