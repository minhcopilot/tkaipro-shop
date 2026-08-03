import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { getUserIpHistory } from "~/lib/security/ip-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/forensics?userId=...&email=...
 * Trả lịch sử IP/thiết bị/hành động của 1 user + tóm tắt định danh (IP,
 * fingerprint, did, quốc gia) để admin review nhanh trước khi ban.
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = (searchParams.get("userId") ?? "").trim() || undefined;
  const email = (searchParams.get("email") ?? "").trim().toLowerCase() || undefined;
  if (!userId && !email) {
    return NextResponse.json({ error: "Thiếu userId/email" }, { status: 400 });
  }

  const rows = await getUserIpHistory({ userId, email, limit: 300 });

  const ips = new Set<string>();
  const fingerprints = new Set<string>();
  const dids = new Set<string>();
  const countries = new Set<string>();
  for (const r of rows) {
    if (r.ip && r.ip !== "unknown") ips.add(r.ip);
    if (r.fingerprint) fingerprints.add(r.fingerprint);
    if (r.did) dids.add(r.did);
    if (r.country) countries.add(r.country);
  }

  return NextResponse.json({
    summary: {
      ips: [...ips],
      fingerprints: [...fingerprints],
      dids: [...dids],
      countries: [...countries],
    },
    rows,
  });
}
