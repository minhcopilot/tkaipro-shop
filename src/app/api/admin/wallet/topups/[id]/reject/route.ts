import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { rejectWalletTopup } from "~/lib/queries/wallet";
import { getUserById } from "~/lib/queries/users";
import { sendWalletTopupRejectedEmail } from "~/lib/email-service";

/**
 * POST /api/admin/wallet/topups/[id]/reject — admin từ chối topup crypto.
 * Body: { reason: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reason = String(body?.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json(
      { error: "Reason is required" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const updated = await rejectWalletTopup({
    topupId: id,
    adminUserId: admin.id,
    reason,
  });
  if (!updated) {
    return NextResponse.json(
      {
        error:
          "Cannot reject: topup not found OR not in pending_review status",
      },
      { status: 400 },
    );
  }

  // Email user — không block
  try {
    const owner = await getUserById(updated.userId);
    if (owner?.email) {
      await sendWalletTopupRejectedEmail({
        customerEmail: owner.email,
        customerName: owner.name ?? owner.email,
        amount: updated.amount,
        currency: updated.currency as "vnd" | "usd",
        reason,
      });
    }
  } catch (e) {
    console.error("Failed to send rejected email:", e);
  }

  return NextResponse.json({ topup: updated });
}
