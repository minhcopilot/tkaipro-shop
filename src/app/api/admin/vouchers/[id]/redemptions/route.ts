import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { listVoucherRedemptions } from "~/lib/queries/vouchers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const redemptions = await listVoucherRedemptions(id);
    return NextResponse.json({ redemptions });
  } catch (err) {
    console.error("GET /api/admin/vouchers/[id]/redemptions error:", err);
    return NextResponse.json(
      { error: "Failed to list redemptions" },
      { status: 500 },
    );
  }
}
