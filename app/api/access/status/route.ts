import { NextResponse } from "next/server";
import { getAdminDb, isAdminConfigured, uidFromRequest } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const uid = await uidFromRequest(request);
  if (!uid || !isAdminConfigured) {
    return NextResponse.json({ allowed: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const member = await getAdminDb().collection("members").doc(uid).get();
    const allowed = member.exists && member.get("active") === true;
    return NextResponse.json({ allowed }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ allowed: false, error: "access_check_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
