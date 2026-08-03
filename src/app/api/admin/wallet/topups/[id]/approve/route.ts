import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { creditTopupBalance } from "~/lib/queries/wallet";
import { getUserById } from "~/lib/queries/users";
import { sendWalletTopupSuccessEmail } from "~/lib/email-service";

/**
 * POST /api/admin/wallet/topups/[id]/approve — admin xác nhận topup crypto
 * (status pending_review → paid). Credit usd_balance + insert audit
 * transaction + email user.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const result = await creditTopupBalance({
    topupId: id,
    confirmedByUserId: admin.id,
    note: `Admin approved by ${admin.email}`,
  });
  if (!result) {
    return NextResponse.json(
      {
        error:
          "Cannot approve: topup not found OR already processed (paid/expired/rejected)",
      },
      { status: 400 },
    );
  }

  // Email user — ko block response nếu email fail
  try {
    const owner = await getUserById(result.topup.userId);
    if (owner?.email) {
      await sendWalletTopupSuccessEmail({
        customerEmail: owner.email,
        customerName: owner.name ?? owner.email,
        amount: result.transaction.amount,
        currency: result.transaction.currency as "vnd" | "usd",
        balanceAfter: result.transaction.balanceAfter,
        paidAt: result.topup.paidAt ?? new Date(),
      });
    }
  } catch (e) {
    console.error("Failed to send approval email:", e);
  }

  return NextResponse.json({
    topup: result.topup,
    transaction: result.transaction,
  });
}
