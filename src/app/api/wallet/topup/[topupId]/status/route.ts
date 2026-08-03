import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "~/lib/auth";
import { getWalletTopupById } from "~/lib/queries/wallet";

/**
 * GET /api/wallet/topup/[topupId]/status — lightweight polling endpoint.
 * Trả ít field hơn endpoint chi tiết để giảm overhead khi client poll mỗi
 * 5-10s.
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
  if (!topup || topup.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: topup.id,
    status: topup.status,
    paidAt: topup.paidAt,
    expiresAt: topup.expiresAt,
    rejectedReason: topup.rejectedReason,
  });
}
