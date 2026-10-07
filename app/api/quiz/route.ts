import { NextResponse } from "next/server";
import { selectDailyQuestions } from "@/lib/daily";
import { isAdminConfigured, uidFromRequest } from "@/lib/firebase/admin";
import { parseProgressBody, saveQuizAttempts } from "@/lib/firebase/progress";
import { SEED_QUIZ, getQuizPool, isTursoConfigured } from "@/lib/turso";
import { clampInt, todayKey } from "@/lib/utils";

/**
 * ===========================================================================
 * MICROSERVICE 3 — /api/quiz   (Turso questions + Firestore attempts)
 * ===========================================================================
 * GET returns the Daily Quiz: five questions that are identical for every student
 *        for a given date (see lib/daily.ts for the seeded shuffle).
 * POST accepts offline-queued quiz attempts and writes them to Firestore.
 *
 * The correct answer travels to the client on purpose. LUMEN grades on the
 * device so a student can finish a quiz in a basement with no signal and sync
 * the score later — exactly like the mobile-first offline apps students expect.
 * The questions are publicly-available medical facts; there is no secret here.
 */

export const runtime = "nodejs";
export const revalidate = 300;

const PUBLIC_CACHE = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
} as const;
const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const category = params.get("category")?.trim() || undefined;
  const count = clampInt(Number(params.get("count") ?? 5), 1, 20);
  const requestedDate = params.get("date")?.trim();
  // Only accept an ISO day; anything else falls back to the device's today.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? "")
    ? (requestedDate as string)
    : todayKey();

  try {
    const pool = await getQuizPool(category, 60);
    const questions = selectDailyQuestions(pool, date, count, category);

    return NextResponse.json(
      {
        data: questions,
        meta: {
          source: isTursoConfigured ? "turso" : "seed",
          date,
          count: questions.length,
          servedAt: new Date().toISOString(),
        },
      },
      { headers: PUBLIC_CACHE },
    );
  } catch {
    // Degraded: the bundled seed questions still give every student a quiz.
    const questions = selectDailyQuestions(SEED_QUIZ, date, count, category);

    return NextResponse.json(
      {
        data: questions,
        meta: {
          source: "fallback",
          degraded: true,
          date,
          count: questions.length,
          servedAt: new Date().toISOString(),
        },
      },
      { status: 200, headers: { ...PUBLIC_CACHE, "X-Lumen-Degraded": "1" } },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, meta: { error: "invalid_json" } },
      { status: 400, headers: NO_STORE },
    );
  }

  const uid = await uidFromRequest(request);
  const { attempts } = parseProgressBody(body);
  const servedAt = new Date().toISOString();

  if (!uid || !isAdminConfigured) {
    return NextResponse.json(
      {
        data: { accepted: attempts.length, written: 0 },
        meta: {
          origin: "local",
          servedAt,
          stored: false,
          message: "Attempt kept on the device. Sign in with Firebase to sync.",
        },
      },
      { status: 202, headers: NO_STORE },
    );
  }

  try {
    const written = await saveQuizAttempts(uid, attempts);
    return NextResponse.json(
      {
        data: { accepted: attempts.length, written },
        meta: { origin: "firestore", servedAt, stored: true },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: { accepted: attempts.length, written: 0 },
        meta: {
          origin: "local",
          servedAt,
          stored: false,
          message: error instanceof Error ? error.message : "Could not reach Firestore",
        },
      },
      { status: 202, headers: NO_STORE },
    );
  }
}
