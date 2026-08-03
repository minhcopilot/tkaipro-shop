import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { listAuditLogs } from "~/lib/queries/vouchers";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const logs = await listAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("GET /api/admin/vouchers/audit-log error:", err);
    return NextResponse.json(
      { error: "Failed to list audit logs" },
      { status: 500 },
    );
  }
}
