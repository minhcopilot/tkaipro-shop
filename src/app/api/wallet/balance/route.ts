import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { getUserBalances } from "~/lib/queries/wallet";

/**
 * GET /api/wallet/balance — trả balance VND + USD của user hiện tại.
 * Dùng từ checkout để hiển thị "Số dư hiện tại" + disable wallet option nếu
 * thiếu.
 */
export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const balances = await getUserBalances(user.id);
  if (!balances) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    vnd: balances.vnd,
    usd: balances.usd,
  });
}
