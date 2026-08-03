import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import {
  createBankAccount,
  listBankAccounts,
} from "~/lib/queries/bank-accounts";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await listBankAccounts();
    return NextResponse.json({ bankAccounts: accounts });
  } catch (error) {
    console.error("Error listing bank accounts:", error);
    return NextResponse.json(
      { error: "Failed to list bank accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountName, accountNumber, bankCode, bankName, isActive, isDefault, sortOrder } = body;

    if (!bankName?.trim() || !bankCode?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
      return NextResponse.json(
        { error: "Tên ngân hàng, mã BIN, số TK và tên chủ TK là bắt buộc" },
        { status: 400 },
      );
    }

    const created = await createBankAccount({
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      bankCode: bankCode.trim(),
      bankName: bankName.trim(),
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      sortOrder: sortOrder ?? 0,
    });

    return NextResponse.json({ bankAccount: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Failed to create bank account" },
      { status: 500 },
    );
  }
}
