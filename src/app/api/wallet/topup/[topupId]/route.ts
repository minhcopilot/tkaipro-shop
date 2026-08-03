import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { getWalletTopupById } from "~/lib/queries/wallet";

/**
 * GET /api/wallet/topup/[topupId] — chi tiết 1 topup (cho trang topup detail
 * + polling). Owner-only — admin xem qua /api/admin/wallet/topups.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topupId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topupId } = await params;
  const topup = await getWalletTopupById(topupId);
  if (!topup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (topup.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ topup });
}
