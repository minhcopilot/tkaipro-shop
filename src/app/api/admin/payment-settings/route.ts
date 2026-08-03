import { NextResponse } from "next/server";

import {
  BANK_SELECTION_MODE,
  type BankSelectionMode,
} from "~/db/schema";
import { getCurrentAdmin } from "~/lib/auth";
import {
  getOrCreatePaymentSettings,
  updatePaymentSettings,
} from "~/lib/queries/bank-accounts";

function isValidMode(value: unknown): value is BankSelectionMode {
  return (
    value === BANK_SELECTION_MODE.DEFAULT ||
    value === BANK_SELECTION_MODE.ROUND_ROBIN
  );
}

/** GET /api/admin/payment-settings */
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getOrCreatePaymentSettings();
    return NextResponse.json({
      bankSelectionMode: settings.bankSelectionMode,
      rrCursorBankId: settings.rrCursorBankId,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment settings" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/payment-settings — { bankSelectionMode } */
export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!isValidMode(body.bankSelectionMode)) {
      return NextResponse.json(
        {
          error: "INVALID_BANK_SELECTION_MODE",
          message: "bankSelectionMode must be 'default' or 'round_robin'",
        },
        { status: 400 },
      );
    }

    const settings = await updatePaymentSettings({
      bankSelectionMode: body.bankSelectionMode,
    });

    return NextResponse.json({
      bankSelectionMode: settings.bankSelectionMode,
      rrCursorBankId: settings.rrCursorBankId,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 },
    );
  }
}
