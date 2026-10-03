import { NextResponse } from "next/server";
import { hasActiveMembership, isAdminConfigured, uidFromRequest } from "@/lib/firebase/admin";
import {
  emptySummary,
  getProgressSummary,
  parseProgressBody,
  saveProgressBatch,
  saveQuizAttempts,
  updateProfile,
} from "@/lib/firebase/progress";

/**
 * ===========================================================================
 * MICROSERVICE 2 — /api/progress   (Firebase Auth + Firestore)
 * ===========================================================================
 * GET returns the signed-in student's progress summary (profile, records, totals).
 * POST accepts a batch of offline-queued writes: progress records, quiz
 *        attempts and an optional profile edit.
 *
 * Two rules drive the whole design:
 *
 *  1. NEVER 401. A student who is offline, or who never signed in, still gets a
 *     valid (if empty) summary with `meta.origin: "local"`. The client merges it
 *     with its own local mirror, so the UI is always correct.
 *  2. NEVER lose a write. If Firestore cannot be reached, we answer 202 Accepted
 *     with `meta.stored: false` and the client keeps the item in its queue.
 *
 * Response caching is always `no-store`: progress is per-user state, and a
 * shared ward iPad must never serve one student's progress to the next.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function GET(request: Request) {
  const uid = await uidFromRequest(request);

  if (!uid || !isAdminConfigured) {
    return NextResponse.json(
      {
        data: emptySummary(uid ?? "local-demo-user"),
        meta: {
          origin: "local",
          servedAt: new Date().toISOString(),
          stored: false,
          message: isAdminConfigured
            ? "No verified Firebase session. Progress is device-local."
            : "Firebase Admin is not configured. Progress is device-local.",
        },
      },
      { headers: NO_STORE },
    );
  }

  if (process.env.NEXT_PUBLIC_REQUIRE_INVITE === "true") {
    try {
      if (!(await hasActiveMembership(uid))) {
        return NextResponse.json({ error: "invite_required" }, { status: 403, headers: NO_STORE });
      }
    } catch {
      return NextResponse.json({ error: "access_check_unavailable" }, { status: 503, headers: NO_STORE });
    }
  }

  try {
    const summary = await getProgressSummary(uid);
    return NextResponse.json(
      {
        data: summary,
        meta: { origin: "firestore", servedAt: new Date().toISOString(), stored: true },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    // Firestore hiccup: hand back a local-mode summary rather than a 500, so a
    // student mid-ward-round never loses their place.
    return NextResponse.json(
      {
        data: emptySummary(uid),
        meta: {
          origin: "local",
          servedAt: new Date().toISOString(),
          stored: false,
          message: error instanceof Error ? error.message : "Progress store unavailable",
        },
      },
      { status: 202, headers: NO_STORE },
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
  const { records, attempts } = parseProgressBody(body);
  const profilePatch = (body as { profile?: unknown })?.profile;
  const servedAt = new Date().toISOString();

  // Nothing to attribute the write to: tell the client to keep it queued.
  if (!uid || !isAdminConfigured) {
    return NextResponse.json(
      {
        data: emptySummary(uid ?? "local-demo-user"),
        meta: {
          origin: "local",
          servedAt,
          stored: false,
          message: "Queued on the device. Sign in with Firebase to sync.",
        },
      },
      { status: 202, headers: NO_STORE },
    );
  }

  if (process.env.NEXT_PUBLIC_REQUIRE_INVITE === "true") {
    try {
      if (!(await hasActiveMembership(uid))) {
        return NextResponse.json({ data: null, meta: { error: "invite_required" } }, { status: 403, headers: NO_STORE });
      }
    } catch {
      return NextResponse.json({ data: null, meta: { error: "access_check_unavailable" } }, { status: 503, headers: NO_STORE });
    }
  }

  try {
    const [progressWritten, attemptsWritten] = await Promise.all([
      saveProgressBatch(uid, records),
      saveQuizAttempts(uid, attempts),
    ]);

    if (profilePatch) await updateProfile(uid, profilePatch);

    const summary = await getProgressSummary(uid);

    return NextResponse.json(
      {
        data: summary,
        meta: {
          origin: "firestore",
          servedAt,
          stored: true,
          written: { progress: progressWritten, quiz: attemptsWritten },
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return NextResponse.json(
      {
        data: emptySummary(uid),
        meta: {
          origin: "local",
          servedAt,
          stored: false,
          message:
            error instanceof Error ? error.message : "Could not reach Firestore",
        },
      },
      { status: 202, headers: NO_STORE },
    );
  }
}
