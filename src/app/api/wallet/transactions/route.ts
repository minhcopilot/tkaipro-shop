import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { getRecentTransactionsByUser } from "~/lib/queries/wallet";

/**
 * GET /api/wallet/transactions — list transactions audit log của user hiện
 * tại (cho trang dashboard wallet history).
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 30);
  const limit = Math.min(Math.max(1, limitRaw || 30), 100);
  const items = await getRecentTransactionsByUser(user.id, limit);
  return NextResponse.json({ items });
}
