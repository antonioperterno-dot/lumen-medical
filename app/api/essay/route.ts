import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { category?: string; answers?: string[] };

export async function POST(request: Request) {
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