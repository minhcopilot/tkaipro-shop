import { NextRequest, NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import {
  adminAdjustBalance,
  WALLET_CURRENCY,
  type WalletCurrency,
} from "~/lib/queries/wallet";

/**
 * POST /api/admin/wallet/users/[userId]/adjust — admin manual adjust balance.
 *
 * Body: { currency: 'vnd' | 'usd', delta: number, note: string }
 *   - delta dương = cộng, delta âm = trừ. Validation server-side: balance
 *     không được âm sau adjust (trả lỗi BALANCE_GO_NEGATIVE).
 *   - note bắt buộc (audit log).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
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

  const currency = body?.currency as WalletCurrency | undefined;
  const delta = Number(body?.delta);
  const note = String(body?.note ?? "").trim();

  if (currency !== WALLET_CURRENCY.VND && currency !== WALLET_CURRENCY.USD) {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (!Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: "INVALID_DELTA" }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ error: "NOTE_REQUIRED" }, { status: 400 });
  }

  const { userId } = await params;
  try {
    const tx = await adminAdjustBalance({
      userId,
      currency,
      delta,
      adminUserId: admin.id,
      note: `[admin:${admin.email}] ${note}`,
    });
    if (!tx) {
      return NextResponse.json(
        { error: "Adjust failed (no-op or DB error)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ transaction: tx });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "BALANCE_GO_NEGATIVE") {
      return NextResponse.json(
        { error: "BALANCE_GO_NEGATIVE" },
        { status: 400 },
      );
    }
    if (msg === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }
    console.error("admin adjust balance error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
