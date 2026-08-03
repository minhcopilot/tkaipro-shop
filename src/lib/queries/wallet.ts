import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import {
  type WalletCurrency,
  type WalletRefType,
  type WalletTopup,
  type WalletTopupInsert,
  type WalletTopupMethod,
  type WalletTopupStatus,
  type WalletTransaction,
  type WalletTransactionInsert,
  type WalletTxType,
  WALLET_CURRENCY,
  WALLET_REF_TYPE,
  WALLET_TOPUP_METHOD,
  WALLET_TOPUP_STATUS,
  WALLET_TX_TYPE,
  userTable,
  walletTopupTable,
  walletTransactionTable,
} from "~/db/schema";
import {
  extractPaymentTokens,
  generatePaymentMemo,
} from "~/lib/payment/transfer-memos";
import {
  assignBankAccountForPayment,
  NoActiveBankAccountError,
  toBankSnapshot,
} from "~/lib/queries/bank-accounts";

export { NoActiveBankAccountError };

// VND tối thiểu/tối đa cho 1 lần nạp (chống abuse + tránh fee bank vô nghĩa)
export const TOPUP_VND_MIN = 50_000; // 50K VND
export const TOPUP_VND_MAX = 50_000_000; // 50M VND
// USD cents
export const TOPUP_USD_MIN_CENTS = 500; // $5
export const TOPUP_USD_MAX_CENTS = 500_000; // $5000

export const TOPUP_PENDING_TTL_MS = 30 * 60 * 1000; // 30 phút

function isUniqueViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("duplicate key") || msg.includes("unique constraint");
}

/**
 * @deprecated Legacy TOP format — giữ cho test/backfill. Topup mới dùng generatePaymentMemo().
 */
export function generateTopupTransferContent(
  currency: WalletCurrency,
  amount: number,
): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  if (currency === WALLET_CURRENCY.VND) {
    const amountK = Math.round(amount / 1000);
    return `TOP${random}_${amountK}K`;
  }
  return `TOP${random}_USD${amount}`;
}

/**
 * Tạo topup pending. Retry nếu transferContent clash UNIQUE (rất hiếm).
 */
export async function createWalletTopup(input: {
  userId: string;
  currency: WalletCurrency;
  amount: number;
  method: WalletTopupMethod;
  cryptoMethodId?: string;
  clientIp?: string;
  userAgent?: string;
}): Promise<WalletTopup | null> {
  const { userId, currency, amount, method, cryptoMethodId, clientIp, userAgent } =
    input;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOPUP_PENDING_TTL_MS);

  // Chỉ gắn TK khi nạp VND qua SePay (crypto không cần)
  let bankSnap: ReturnType<typeof toBankSnapshot> | null = null;
  if (method === WALLET_TOPUP_METHOD.SEPAY) {
    const bank = await assignBankAccountForPayment();
    bankSnap = toBankSnapshot(bank);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const { memo: transferContent } = generatePaymentMemo();
    const data: WalletTopupInsert = {
      id: nanoid(),
      userId,
      currency,
      amount,
      method,
      cryptoMethodId: cryptoMethodId ?? null,
      status: WALLET_TOPUP_STATUS.PENDING,
      transferContent,
      bankAccountId: bankSnap?.bankAccountId ?? null,
      bankName: bankSnap?.bankName ?? null,
      bankCode: bankSnap?.bankCode ?? null,
      bankAccountNumber: bankSnap?.bankAccountNumber ?? null,
      bankAccountName: bankSnap?.bankAccountName ?? null,
      clientIp: clientIp ?? null,
      userAgent: userAgent ?? null,
      createdAt: now,
      expiresAt,
    };

    try {
      const inserted = await db.insert(walletTopupTable).values(data).returning();
      return inserted[0] ?? null;
    } catch (err) {
      if (err instanceof NoActiveBankAccountError) throw err;
      if (isUniqueViolation(err) && attempt < 4) continue;
      console.error("createWalletTopup failed:", err);
      return null;
    }
  }

  return null;
}

export async function getWalletTopupById(id: string): Promise<WalletTopup | null> {
  const rows = await db
    .select()
    .from(walletTopupTable)
    .where(eq(walletTopupTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRecentTopupsByUser(
  userId: string,
  limit = 20,
): Promise<WalletTopup[]> {
  return db
    .select()
    .from(walletTopupTable)
    .where(eq(walletTopupTable.userId, userId))
    .orderBy(desc(walletTopupTable.createdAt))
    .limit(limit);
}

export async function getRecentTransactionsByUser(
  userId: string,
  limit = 20,
): Promise<WalletTransaction[]> {
  return db
    .select()
    .from(walletTransactionTable)
    .where(eq(walletTransactionTable.userId, userId))
    .orderBy(desc(walletTransactionTable.createdAt))
    .limit(limit);
}

export async function getUserBalances(
  userId: string,
): Promise<{ vnd: number; usd: number } | null> {
  const rows = await db
    .select({ vnd: userTable.vndBalance, usd: userTable.usdBalance })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Match topup pending theo mã ẩn 8 ký tự trong nội dung webhook.
 */
export async function findTopupByPaymentToken(
  content: string,
): Promise<WalletTopup | null> {
  const tokens = extractPaymentTokens(content);
  if (tokens.length === 0) return null;

  for (const token of tokens) {
    const rows = await db
      .select()
      .from(walletTopupTable)
      .where(
        and(
          sql`position(${token} in lower(${walletTopupTable.transferContent})) > 0`,
          eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING),
        ),
      )
      .limit(1);
    if (rows[0]) {
      console.log(
        "Topup found (payment token):",
        rows[0].id,
        "token:",
        token,
      );
      return rows[0];
    }
  }
  return null;
}

/**
 * Match topup pending theo nội dung chuyển khoản từ SePay. Mirror pattern của
 * `findOrderByTransactionContent` nhưng hẹp hơn vì topup luôn có prefix `TOP`.
 * Legacy fallback cho topup cũ trước khi chuyển sang natural memo.
 */
export async function findTopupByTransactionContent(
  content: string,
): Promise<WalletTopup | null> {
  const upper = content.toUpperCase();
  const candidates = new Set<string>();

  // 1) match nguyên ký hiệu TOP[...]K hoặc TOP[...]_USD[...]
  const matches = [...upper.matchAll(/TOP[A-Z0-9_]{4,}/g)];
  for (const m of matches) {
    candidates.add(m[0]);
    // bank đôi khi strip `_` → thử phiên bản không có `_`
    const stripped = m[0].replace(/_/g, "");
    if (stripped !== m[0]) candidates.add(stripped);
  }

  for (const candidate of candidates) {
    const rows = await db
      .select()
      .from(walletTopupTable)
      .where(
        and(
          eq(walletTopupTable.transferContent, candidate),
          eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING),
        ),
      )
      .limit(1);
    if (rows[0]) return rows[0];
  }

  // 2) fallback: bank strip `_` → query bằng LIKE chuẩn hoá. Topup pending mới
  //    nhất khớp prefix sẽ được dùng.
  if (matches.length > 0) {
    const noUnderscore = upper.replace(/_/g, "");
    const baseMatch = noUnderscore.match(/TOP[A-Z0-9]{6,}/);
    if (baseMatch) {
      const base = baseMatch[0];
      const rows = await db
        .select()
        .from(walletTopupTable)
        .where(
          and(
            sql`replace(${walletTopupTable.transferContent}, '_', '') = ${base}`,
            eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING),
          ),
        )
        .limit(1);
      if (rows[0]) return rows[0];
    }
  }

  return null;
}

/**
 * Credit balance cho 1 topup PENDING. Toàn bộ trong 1 transaction:
 *   1. Lock user row + verify topup vẫn pending.
 *   2. Update userTable.{vndBalance|usdBalance} += amount.
 *   3. Insert wallet_transaction (type=topup, +amount, balanceAfter).
 *   4. Update wallet_topup → paid + sepayTransactionId/confirmedByUserId.
 *
 * Trả về walletTransaction đã tạo nếu thành công, null nếu topup đã không
 * còn pending (race với cron expire / approve khác).
 */
export async function creditTopupBalance(input: {
  topupId: string;
  sepayTransactionId?: string;
  confirmedByUserId?: string;
  note?: string;
}): Promise<{
  topup: WalletTopup;
  transaction: WalletTransaction;
} | null> {
  const { topupId, sepayTransactionId, confirmedByUserId, note } = input;

  try {
    return await db.transaction(async (tx) => {
      // lock topup row
      const topupRows = await tx
        .select()
        .from(walletTopupTable)
        .where(eq(walletTopupTable.id, topupId))
        .for("update")
        .limit(1);
      const topup = topupRows[0];
      if (!topup) {
        console.warn(`creditTopupBalance: topup ${topupId} not found`);
        return null;
      }
      if (
        topup.status !== WALLET_TOPUP_STATUS.PENDING &&
        topup.status !== WALLET_TOPUP_STATUS.PENDING_REVIEW
      ) {
        console.warn(
          `creditTopupBalance: topup ${topupId} status=${topup.status}, skip`,
        );
        return null;
      }

      // lock user row
      const userRows = await tx
        .select({
          id: userTable.id,
          vndBalance: userTable.vndBalance,
          usdBalance: userTable.usdBalance,
        })
        .from(userTable)
        .where(eq(userTable.id, topup.userId))
        .for("update")
        .limit(1);
      const user = userRows[0];
      if (!user) {
        throw new Error(`User ${topup.userId} not found`);
      }

      const isVnd = topup.currency === WALLET_CURRENCY.VND;
      const newBalance =
        (isVnd ? user.vndBalance : user.usdBalance) + topup.amount;

      // update user balance
      await tx
        .update(userTable)
        .set(
          isVnd
            ? { vndBalance: newBalance, updatedAt: new Date() }
            : { usdBalance: newBalance, updatedAt: new Date() },
        )
        .where(eq(userTable.id, topup.userId));

      // insert audit transaction
      const txData: WalletTransactionInsert = {
        id: nanoid(),
        userId: topup.userId,
        currency: topup.currency,
        type: WALLET_TX_TYPE.TOPUP,
        amount: topup.amount,
        balanceAfter: newBalance,
        refType: WALLET_REF_TYPE.TOPUP,
        refId: topup.id,
        note: note ?? null,
        createdByUserId: confirmedByUserId ?? null,
      };
      const txInserted = await tx
        .insert(walletTransactionTable)
        .values(txData)
        .returning();

      // mark topup paid
      const topupUpdated = await tx
        .update(walletTopupTable)
        .set({
          status: WALLET_TOPUP_STATUS.PAID,
          paidAt: new Date(),
          sepayTransactionId: sepayTransactionId ?? topup.sepayTransactionId,
          confirmedByUserId: confirmedByUserId ?? topup.confirmedByUserId,
        })
        .where(eq(walletTopupTable.id, topup.id))
        .returning();

      return {
        topup: topupUpdated[0]!,
        transaction: txInserted[0]!,
      };
    });
  } catch (err) {
    console.error("creditTopupBalance failed:", err);
    return null;
  }
}

/**
 * Debit balance để pay 1 order. Trong tx: lock user + verify balance >= amount,
 * trừ balance, insert audit tx, return new balance.
 *
 * Caller phải gọi trong tx ngoài (vd /api/orders POST) — function này nhận
 * `tx` để compose. Throw error nếu thiếu balance.
 */
export async function debitForOrderInTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    userId: string;
    currency: WalletCurrency;
    amount: number;
    orderId: string;
    note?: string;
  },
): Promise<{ balanceAfter: number; transactionId: string }> {
  const { userId, currency, amount, orderId, note } = input;
  if (amount <= 0) {
    throw new Error("WALLET_DEBIT_INVALID_AMOUNT");
  }

  const userRows = await tx
    .select({
      vndBalance: userTable.vndBalance,
      usdBalance: userTable.usdBalance,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .for("update")
    .limit(1);
  const user = userRows[0];
  if (!user) throw new Error("WALLET_USER_NOT_FOUND");

  const isVnd = currency === WALLET_CURRENCY.VND;
  const current = isVnd ? user.vndBalance : user.usdBalance;
  if (current < amount) {
    throw new Error("WALLET_INSUFFICIENT_BALANCE");
  }

  const newBalance = current - amount;
  await tx
    .update(userTable)
    .set(
      isVnd
        ? { vndBalance: newBalance, updatedAt: new Date() }
        : { usdBalance: newBalance, updatedAt: new Date() },
    )
    .where(eq(userTable.id, userId));

  const txId = nanoid();
  await tx.insert(walletTransactionTable).values({
    id: txId,
    userId,
    currency,
    type: WALLET_TX_TYPE.DEBIT,
    amount: -amount, // âm để dễ sum lại
    balanceAfter: newBalance,
    refType: WALLET_REF_TYPE.ORDER,
    refId: orderId,
    note: note ?? null,
    createdByUserId: null,
  });

  return { balanceAfter: newBalance, transactionId: txId };
}

/**
 * Mark topups quá hạn (cron daily gọi). Trả về số row affected.
 */
export async function expireOldPendingTopups(): Promise<number> {
  const result = await db
    .update(walletTopupTable)
    .set({ status: WALLET_TOPUP_STATUS.EXPIRED })
    .where(
      and(
        eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING),
        sql`${walletTopupTable.expiresAt} < now()`,
      ),
    )
    .returning({ id: walletTopupTable.id });
  return result.length;
}

/**
 * Admin reject topup crypto (status=pending_review → rejected). Không touch
 * balance.
 */
export async function rejectWalletTopup(input: {
  topupId: string;
  adminUserId: string;
  reason: string;
}): Promise<WalletTopup | null> {
  const { topupId, adminUserId, reason } = input;
  const updated = await db
    .update(walletTopupTable)
    .set({
      status: WALLET_TOPUP_STATUS.REJECTED,
      rejectedReason: reason,
      confirmedByUserId: adminUserId,
    })
    .where(
      and(
        eq(walletTopupTable.id, topupId),
        eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING_REVIEW),
      ),
    )
    .returning();
  return updated[0] ?? null;
}

/**
 * User submit proof image cho topup crypto → status đổi pending → pending_review.
 */
export async function attachTopupProof(input: {
  topupId: string;
  userId: string;
  // Null = user marked transferred but did not attach a proof image
  proofImageUrl: string | null;
}): Promise<WalletTopup | null> {
  const { topupId, userId, proofImageUrl } = input;
  const updated = await db
    .update(walletTopupTable)
    .set({
      status: WALLET_TOPUP_STATUS.PENDING_REVIEW,
      proofImageUrl,
    })
    .where(
      and(
        eq(walletTopupTable.id, topupId),
        eq(walletTopupTable.userId, userId),
        eq(walletTopupTable.status, WALLET_TOPUP_STATUS.PENDING),
      ),
    )
    .returning();
  return updated[0] ?? null;
}

/**
 * Admin manual adjust balance (vd refund out-of-band). Insert wallet_transaction
 * + update user balance. Trong 1 tx atomic.
 */
export async function adminAdjustBalance(input: {
  userId: string;
  currency: WalletCurrency;
  delta: number; // có thể âm hoặc dương
  adminUserId: string;
  note: string;
}): Promise<WalletTransaction | null> {
  const { userId, currency, delta, adminUserId, note } = input;
  if (delta === 0) return null;

  try {
    return await db.transaction(async (tx) => {
      const userRows = await tx
        .select({
          vndBalance: userTable.vndBalance,
          usdBalance: userTable.usdBalance,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .for("update")
        .limit(1);
      const user = userRows[0];
      if (!user) throw new Error("USER_NOT_FOUND");

      const isVnd = currency === WALLET_CURRENCY.VND;
      const current = isVnd ? user.vndBalance : user.usdBalance;
      const newBalance = current + delta;
      if (newBalance < 0) throw new Error("BALANCE_GO_NEGATIVE");

      await tx
        .update(userTable)
        .set(
          isVnd
            ? { vndBalance: newBalance, updatedAt: new Date() }
            : { usdBalance: newBalance, updatedAt: new Date() },
        )
        .where(eq(userTable.id, userId));

      const txData: WalletTransactionInsert = {
        id: nanoid(),
        userId,
        currency,
        type: WALLET_TX_TYPE.ADMIN_ADJUST,
        amount: delta,
        balanceAfter: newBalance,
        refType: WALLET_REF_TYPE.ADMIN,
        refId: null,
        note,
        createdByUserId: adminUserId,
      };
      const inserted = await tx
        .insert(walletTransactionTable)
        .values(txData)
        .returning();
      return inserted[0]!;
    });
  } catch (err) {
    console.error("adminAdjustBalance failed:", err);
    return null;
  }
}

/**
 * Validate amount theo currency. Trả message lỗi i18n key (không dịch sẵn).
 */
export function validateTopupAmount(
  currency: WalletCurrency,
  amount: number,
): { ok: true } | { ok: false; reason: string } {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }
  if (currency === WALLET_CURRENCY.VND) {
    if (amount < TOPUP_VND_MIN) return { ok: false, reason: "AMOUNT_TOO_SMALL" };
    if (amount > TOPUP_VND_MAX) return { ok: false, reason: "AMOUNT_TOO_LARGE" };
    // Phải chia hết cho 1000 để bank không bị thiếu lẻ (tránh user nạp 50,123 VND)
    if (amount % 1000 !== 0) return { ok: false, reason: "AMOUNT_NOT_ROUND" };
  } else {
    if (amount < TOPUP_USD_MIN_CENTS)
      return { ok: false, reason: "AMOUNT_TOO_SMALL" };
    if (amount > TOPUP_USD_MAX_CENTS)
      return { ok: false, reason: "AMOUNT_TOO_LARGE" };
  }
  return { ok: true };
}

// Re-export constants để callers (UI/route) khỏi import schema/wallet/types riêng
export {
  WALLET_CURRENCY,
  WALLET_REF_TYPE,
  WALLET_TOPUP_METHOD,
  WALLET_TOPUP_STATUS,
  WALLET_TX_TYPE,
};
export type {
  WalletCurrency,
  WalletRefType,
  WalletTopup,
  WalletTopupMethod,
  WalletTopupStatus,
  WalletTransaction,
  WalletTxType,
};
