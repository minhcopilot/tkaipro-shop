import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import {
  getDailySuspects,
  getIpDetail,
  getSuspiciousSharedFingerprints,
  getSuspiciousSharedIps,
  getUserIpHistory,
} from "~/lib/security/ip-log";
import { getBanStats, listBans } from "~/lib/security/ban-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/admin/ip-monitor?view=shared|user|ip&q=&limit=
 *
 *  - view=shared (default): IPs used by >= minAccounts distinct accounts.
 *  - view=user&q=<email|userId>: full IP history for one account.
 *  - view=ip&q=<ip>: every event recorded from one IP.
 */
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "shared";
  const q = (searchParams.get("q") ?? "").trim();
  const limitRaw = Number(searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;

  try {
    if (view === "user") {
      if (!q) {
        return NextResponse.json(
          { error: "MISSING_QUERY", message: "Cần email hoặc userId" },
          { status: 400 },
        );
      }
      // Treat input as email when it looks like one, otherwise as userId.
      const isEmail = EMAIL_RE.test(q);
      const rows = await getUserIpHistory({
        email: isEmail ? q : undefined,
        userId: isEmail ? undefined : q,
        limit,
      });
      return NextResponse.json({ view, query: q, rows });
    }

    if (view === "ip") {
      if (!q) {
        return NextResponse.json(
          { error: "MISSING_QUERY", message: "Cần địa chỉ IP" },
          { status: 400 },
        );
      }
      const rows = await getIpDetail(q, limit);
      return NextResponse.json({ view, query: q, rows });
    }

    // Báo cáo nghi ngờ theo ngày (IP/thiết bị nhiều tài khoản trong ngày).
    if (view === "suspects") {
      const date = (searchParams.get("date") ?? "").trim();
      const report = await getDailySuspects(date);
      return NextResponse.json({ view: "suspects", report });
    }

    // Báo cáo thống kê ban (cho tab "Báo cáo").
    if (view === "stats") {
      const stats = await getBanStats();
      return NextResponse.json({ view: "stats", stats });
    }

    // Lịch sử ban (cho tab "Lịch sử ban").
    if (view === "banlog") {
      const kind = q === "ip" || q === "email" || q === "fingerprint" ? q : undefined;
      const result = await listBans({ kind: kind as any, limit });
      return NextResponse.json({ view: "banlog", ...result });
    }

    const minAccountsRaw = Number(searchParams.get("minAccounts") ?? 2);
    const minAccounts = Number.isFinite(minAccountsRaw) ? minAccountsRaw : 2;

    // Thiết bị (fingerprint) dùng chung nhiều account — tín hiệu chống VPN.
    if (view === "shared-fp") {
      const rows = await getSuspiciousSharedFingerprints({ minAccounts, limit });
      return NextResponse.json({ view: "shared-fp", rows });
    }

    // Default: shared IPs (multi-account bypass signal).
    const rows = await getSuspiciousSharedIps({ minAccounts, limit });
    return NextResponse.json({ view: "shared", rows });
  } catch (err) {
    console.error("[admin/ip-monitor GET] error:", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
