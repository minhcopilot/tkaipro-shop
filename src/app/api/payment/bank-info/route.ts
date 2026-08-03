import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { orderTable, walletTopupTable } from "~/db/schema";
import {
  getDefaultBankAccount,
  getFirstActiveBankAccount,
  toBankSnapshot,
} from "~/lib/queries/bank-accounts";

type BankInfoResponse = {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  bankAccountId?: string;
  source: "snapshot" | "fallback";
};

function fromSnapshot(row: {
  bankAccountId: string | null;
  bankName: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}): BankInfoResponse | null {
  if (
    !row.bankAccountNumber ||
    !row.bankAccountName ||
    !row.bankCode ||
    !row.bankName
  ) {
    return null;
  }
  return {
    accountName: row.bankAccountName,
    accountNumber: row.bankAccountNumber,
    bankCode: row.bankCode,
    bankName: row.bankName,
    bankAccountId: row.bankAccountId ?? undefined,
    source: "snapshot",
  };
}

async function fallbackBankInfo(): Promise<BankInfoResponse | null> {
  const account =
    (await getDefaultBankAccount()) ?? (await getFirstActiveBankAccount());
  if (!account) return null;
  const snap = toBankSnapshot(account);
  return {
    accountName: snap.bankAccountName,
    accountNumber: snap.bankAccountNumber,
    bankCode: snap.bankCode,
    bankName: snap.bankName,
    bankAccountId: snap.bankAccountId,
    source: "fallback",
  };
}

/**
 * Public — trả TK ngân hàng đã gắn vào đơn/topup (snapshot).
 * Query bắt buộc: ?orderNumber=... hoặc ?topupId=...
 * Đơn/topup cũ chưa có snapshot → fallback default/first active.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const topupId = searchParams.get("topupId")?.trim();

    if (!orderNumber && !topupId) {
      return NextResponse.json(
        { error: "MISSING_ORDER_OR_TOPUP", message: "Require orderNumber or topupId" },
        { status: 400 },
      );
    }

    if (orderNumber && topupId) {
      return NextResponse.json(
        { error: "AMBIGUOUS_QUERY", message: "Provide only one of orderNumber or topupId" },
        { status: 400 },
      );
    }

    if (orderNumber) {
      const order = await db.query.orderTable.findFirst({
        columns: {
          bankAccountId: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankCode: true,
          bankName: true,
          orderNumber: true,
        },
        where: eq(orderTable.orderNumber, orderNumber),
      });

      if (!order) {
        return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
      }

      const fromOrder = fromSnapshot(order);
      if (fromOrder) {
        return NextResponse.json(fromOrder);
      }

      // Optional light backfill for legacy orders
      const fallback = await fallbackBankInfo();
      if (!fallback) {
        return NextResponse.json(
          { error: "NO_BANK_ACCOUNT_CONFIGURED" },
          { status: 404 },
        );
      }

      if (fallback.bankAccountId) {
        await db
          .update(orderTable)
          .set({
            bankAccountId: fallback.bankAccountId,
            bankAccountName: fallback.accountName,
            bankAccountNumber: fallback.accountNumber,
            bankCode: fallback.bankCode,
            bankName: fallback.bankName,
            updatedAt: new Date(),
          })
          .where(eq(orderTable.orderNumber, orderNumber));
      }

      return NextResponse.json(fallback);
    }

    // topupId path
    const topup = await db.query.walletTopupTable.findFirst({
      columns: {
        bankAccountId: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankCode: true,
        bankName: true,
        id: true,
      },
      where: eq(walletTopupTable.id, topupId!),
    });

    if (!topup) {
      return NextResponse.json({ error: "TOPUP_NOT_FOUND" }, { status: 404 });
    }

    const fromTopup = fromSnapshot(topup);
    if (fromTopup) {
      return NextResponse.json(fromTopup);
    }

    const fallback = await fallbackBankInfo();
    if (!fallback) {
      return NextResponse.json(
        { error: "NO_BANK_ACCOUNT_CONFIGURED" },
        { status: 404 },
      );
    }

    if (fallback.bankAccountId) {
      await db
        .update(walletTopupTable)
        .set({
          bankAccountId: fallback.bankAccountId,
          bankAccountName: fallback.accountName,
          bankAccountNumber: fallback.accountNumber,
          bankCode: fallback.bankCode,
          bankName: fallback.bankName,
        })
        .where(eq(walletTopupTable.id, topupId!));
    }

    return NextResponse.json(fallback);
  } catch (error) {
    console.error("Error fetching bank info:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank info" },
      { status: 500 },
    );
  }
}
