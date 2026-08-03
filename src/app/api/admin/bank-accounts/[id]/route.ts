import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import {
  countActiveBankAccounts,
  deleteBankAccount,
  getBankAccountById,
  setDefaultBankAccount,
  updateBankAccount,
} from "~/lib/queries/bank-accounts";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await getBankAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }

    // Chặn xóa nếu là default duy nhất
    if (existing.isDefault) {
      return NextResponse.json(
        { error: "CANNOT_DELETE_DEFAULT_ACCOUNT" },
        { status: 400 },
      );
    }

    const deleted = await deleteBankAccount(id);
    return NextResponse.json({ bankAccount: deleted, success: true });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Failed to delete bank account" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await getBankAccountById(id);
    if (!existing) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }

    // Shortcut: đặt làm mặc định
    if (body.setDefault === true) {
      const updated = await setDefaultBankAccount(id);
      return NextResponse.json({ bankAccount: updated });
    }

    // Không cho tắt hết mọi TK active trong pool
    if (body.isActive === false && existing.isActive) {
      const activeCount = await countActiveBankAccounts();
      if (activeCount <= 1) {
        return NextResponse.json(
          {
            error: "CANNOT_DEACTIVATE_LAST_ACTIVE",
            message: "Không thể tắt tài khoản active cuối cùng",
          },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (body.bankName !== undefined) updateData.bankName = String(body.bankName).trim();
    if (body.bankCode !== undefined) updateData.bankCode = String(body.bankCode).trim();
    if (body.accountNumber !== undefined) updateData.accountNumber = String(body.accountNumber).trim();
    if (body.accountName !== undefined) updateData.accountName = String(body.accountName).trim();
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.isDefault !== undefined) updateData.isDefault = Boolean(body.isDefault);
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

    const updated = await updateBankAccount(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }

    return NextResponse.json({ bankAccount: updated });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Failed to update bank account" },
      { status: 500 },
    );
  }
}
