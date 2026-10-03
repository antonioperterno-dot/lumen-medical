import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured, uidFromRequest } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function codeHash(value: string): string {
  const normalized = value.toUpperCase().replace(/[^A-Z2-9]/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function POST(request: Request) {
  const uid = await uidFromRequest(request);
  if (!uid || !isAdminConfigured) {
    return NextResponse.json({ error: "firebase_session_required" }, { status: 401 });
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code === "string") code = body.code;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const normalized = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  if (!/^[A-HJ-NP-Z2-9]{12}$/.test(normalized)) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const inviteRef = db.collection("accessInvites").doc(codeHash(normalized));
    const memberRef = db.collection("members").doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const member = await transaction.get(memberRef);
      if (member.exists && member.get("active") === true) return "already_active";

      const invite = await transaction.get(inviteRef);
      const expiresAt = invite.get("expiresAt") as Timestamp | undefined;
      if (!invite.exists || invite.get("redeemedAt") || !expiresAt || expiresAt.toMillis() <= Date.now()) {
        return "invalid";
      }

      transaction.update(inviteRef, {
        redeemedAt: FieldValue.serverTimestamp(),
        redeemedBy: uid,
      });
      transaction.set(memberRef, {
        active: true,
        inviteId: inviteRef.id,
        activatedAt: FieldValue.serverTimestamp(),
      });
      return "activated";
    });

    if (result === "invalid") return NextResponse.json({ error: "invalid_invite" }, { status: 400 });
    return NextResponse.json({ allowed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "invite_service_unavailable" }, { status: 503 });
  }
}
