import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "~/db";
import {
  type BankAccount,
  BANK_SELECTION_MODE,
  type BankSelectionMode,
  bankAccounts,
  type NewBankAccount,
  orderTable,
  type PaymentSettings,
  paymentSettings,
  walletTopupTable,
} from "~/db/schema";

export class NoActiveBankAccountError extends Error {
  constructor(message = "NO_ACTIVE_BANK_ACCOUNT") {
    super(message);
    this.name = "NoActiveBankAccountError";
  }
}

export type BankSnapshot = {
  bankAccountId: string;
  bankName: string;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

export function toBankSnapshot(account: BankAccount): BankSnapshot {
  return {
    bankAccountId: account.id,
    bankName: account.bankName,
    bankCode: account.bankCode,
    bankAccountNumber: account.accountNumber,
    bankAccountName: account.accountName,
  };
}

/** Đếm số TK default (để chặn xóa default duy nhất) */
export async function countDefaultBankAccounts(): Promise<number> {
  const rows = await db.query.bankAccounts.findMany({
    columns: { id: true },
    where: eq(bankAccounts.isDefault, true),
  });
  return rows.length;
}

export async function countActiveBankAccounts(): Promise<number> {
  const rows = await db.query.bankAccounts.findMany({
    columns: { id: true },
    where: eq(bankAccounts.isActive, true),
  });
  return rows.length;
}

export async function createBankAccount(
  data: Omit<NewBankAccount, "createdAt" | "id" | "updatedAt">,
): Promise<BankAccount> {
  const now = new Date();

  return db.transaction(async (tx) => {
    if (data.isDefault) {
      await tx
        .update(bankAccounts)
        .set({ isDefault: false, updatedAt: now })
        .where(eq(bankAccounts.isDefault, true));
    }

    const [created] = await tx
      .insert(bankAccounts)
      .values({
        ...data,
        updatedAt: now,
      })
      .returning();

    return created!;
  });
}

export async function deleteBankAccount(id: string): Promise<BankAccount | null> {
  const [deleted] = await db
    .delete(bankAccounts)
    .where(eq(bankAccounts.id, id))
    .returning();
  return deleted ?? null;
}

export async function getBankAccountById(id: string): Promise<BankAccount | null> {
  const row = await db.query.bankAccounts.findFirst({
    where: eq(bankAccounts.id, id),
  });
  return row ?? null;
}

/** Lấy tài khoản mặc định đang active — dùng cho trang thanh toán / nạp ví */
export async function getDefaultBankAccount(): Promise<BankAccount | null> {
  const row = await db.query.bankAccounts.findFirst({
    where: and(eq(bankAccounts.isDefault, true), eq(bankAccounts.isActive, true)),
  });
  return row ?? null;
}

/** First active bank by sortOrder (fallback khi không có default) */
export async function getFirstActiveBankAccount(): Promise<BankAccount | null> {
  const row = await db.query.bankAccounts.findFirst({
    orderBy: [asc(bankAccounts.sortOrder), asc(bankAccounts.createdAt)],
    where: eq(bankAccounts.isActive, true),
  });
  return row ?? null;
}

export async function listActiveBankAccounts(): Promise<BankAccount[]> {
  return db.query.bankAccounts.findMany({
    orderBy: [asc(bankAccounts.sortOrder), asc(bankAccounts.createdAt)],
    where: eq(bankAccounts.isActive, true),
  });
}

/** Danh sách TK (admin) — default trước, rồi sortOrder */
export async function listBankAccounts(): Promise<BankAccount[]> {
  return db.query.bankAccounts.findMany({
    orderBy: [desc(bankAccounts.isDefault), asc(bankAccounts.sortOrder), desc(bankAccounts.createdAt)],
  });
}

/** Đặt TK làm mặc định — bỏ default các TK khác */
export async function setDefaultBankAccount(id: string): Promise<BankAccount | null> {
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx
      .update(bankAccounts)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(bankAccounts.isDefault, true));

    const [updated] = await tx
      .update(bankAccounts)
      .set({ isActive: true, isDefault: true, updatedAt: now })
      .where(eq(bankAccounts.id, id))
      .returning();

    return updated ?? null;
  });
}

export async function updateBankAccount(
  id: string,
  data: Partial<Omit<NewBankAccount, "createdAt" | "id">>,
): Promise<BankAccount | null> {
  const now = new Date();

  return db.transaction(async (tx) => {
    if (data.isDefault === true) {
      await tx
        .update(bankAccounts)
        .set({ isDefault: false, updatedAt: now })
        .where(and(eq(bankAccounts.isDefault, true), ne(bankAccounts.id, id)));
    }

    const [updated] = await tx
      .update(bankAccounts)
      .set({ ...data, updatedAt: now })
      .where(eq(bankAccounts.id, id))
      .returning();

    return updated ?? null;
  });
}

function normalizeBankSelectionMode(raw: string | null | undefined): BankSelectionMode {
  if (raw === BANK_SELECTION_MODE.ROUND_ROBIN) {
    return BANK_SELECTION_MODE.ROUND_ROBIN;
  }
  return BANK_SELECTION_MODE.DEFAULT;
}

/** Đảm bảo có 1 row payment_settings (seed nếu thiếu) */
export async function getOrCreatePaymentSettings(): Promise<PaymentSettings> {
  const existing = await db.query.paymentSettings.findFirst({
    where: eq(paymentSettings.id, "default"),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(paymentSettings)
    .values({
      id: "default",
      bankSelectionMode: BANK_SELECTION_MODE.DEFAULT,
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const again = await db.query.paymentSettings.findFirst({
    where: eq(paymentSettings.id, "default"),
  });
  if (!again) {
    throw new Error("PAYMENT_SETTINGS_MISSING");
  }
  return again;
}

export async function updatePaymentSettings(input: {
  bankSelectionMode?: BankSelectionMode;
}): Promise<PaymentSettings> {
  await getOrCreatePaymentSettings();
  const now = new Date();
  const patch: Partial<PaymentSettings> = { updatedAt: now };

  if (input.bankSelectionMode !== undefined) {
    patch.bankSelectionMode = normalizeBankSelectionMode(input.bankSelectionMode);
  }

  const [updated] = await db
    .update(paymentSettings)
    .set(patch)
    .where(eq(paymentSettings.id, "default"))
    .returning();

  if (!updated) {
    throw new Error("PAYMENT_SETTINGS_UPDATE_FAILED");
  }
  return updated;
}

/**
 * Chọn TK cho đơn/topup mới theo payment_settings.
 * - default: TK isDefault+active, fallback first active
 * - round_robin: TK active kế tiếp theo sortOrder (cursor)
 */
export async function assignBankAccountForPayment(): Promise<BankAccount> {
  const settings = await getOrCreatePaymentSettings();
  const mode = normalizeBankSelectionMode(settings.bankSelectionMode);

  if (mode === BANK_SELECTION_MODE.DEFAULT) {
    const account =
      (await getDefaultBankAccount()) ?? (await getFirstActiveBankAccount());
    if (!account) {
      throw new NoActiveBankAccountError();
    }
    return account;
  }

  return db.transaction(async (tx) => {
    // Lock settings row để cursor RR không race giữa 2 đơn song song
    const lockedSettings = await tx
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.id, "default"))
      .for("update");

    let settingsRow = lockedSettings[0];
    if (!settingsRow) {
      const [inserted] = await tx
        .insert(paymentSettings)
        .values({
          id: "default",
          bankSelectionMode: BANK_SELECTION_MODE.ROUND_ROBIN,
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();
      settingsRow = inserted!;
      if (!settingsRow) {
        const again = await tx
          .select()
          .from(paymentSettings)
          .where(eq(paymentSettings.id, "default"))
          .for("update");
        settingsRow = again[0]!;
      }
    }

    const active = await tx
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.isActive, true))
      .orderBy(asc(bankAccounts.sortOrder), asc(bankAccounts.createdAt))
      .for("update");

    if (active.length === 0) {
      throw new NoActiveBankAccountError();
    }

    const cursorId = settingsRow.rrCursorBankId;
    let nextIndex = 0;
    if (cursorId) {
      const cursorIdx = active.findIndex((b) => b.id === cursorId);
      if (cursorIdx >= 0) {
        nextIndex = (cursorIdx + 1) % active.length;
      }
    }

    const selected = active[nextIndex]!;
    const now = new Date();
    await tx
      .update(paymentSettings)
      .set({ rrCursorBankId: selected.id, updatedAt: now })
      .where(eq(paymentSettings.id, "default"));

    return selected;
  });
}

/** Normalize STK để so khớp webhook (bỏ khoảng trắng) */
export function normalizeAccountNumber(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, "").trim();
}

/**
 * Kiểm tra STK webhook có thuộc pool TK active không.
 * SePay/KienLongBank thường gửi STK thật ở `subAccount`, còn `accountNumber`
 * là mã ảo/VA — phải check cả hai (và mọi candidate truyền vào).
 * Không có TK active → skip check (matched=true).
 */
export async function isActiveBankAccountNumber(
  ...candidates: Array<string | null | undefined>
): Promise<{ hasActiveBanks: boolean; matched: boolean; matchedNumber: string | null }> {
  const active = await listActiveBankAccounts();
  if (active.length === 0) {
    return { hasActiveBanks: false, matched: true, matchedNumber: null };
  }

  const activeSet = new Set(
    active.map((b) => normalizeAccountNumber(b.accountNumber)).filter(Boolean),
  );

  for (const candidate of candidates) {
    const normalized = normalizeAccountNumber(candidate);
    if (normalized && activeSet.has(normalized)) {
      return {
        hasActiveBanks: true,
        matched: true,
        matchedNumber: normalized,
      };
    }
  }

  return { hasActiveBanks: true, matched: false, matchedNumber: null };
}

export type BankAccountStatsRow = {
  bankAccountId: string;
  pendingOrders: number;
  paidOrders: number;
  paidOrdersAmount7d: number;
  paidOrdersAmount30d: number;
  pendingTopups: number;
  paidTopups: number;
  paidTopupsAmount7d: number;
  paidTopupsAmount30d: number;
};

/** Thống kê nhẹ theo bank_account_id (đơn + topup) */
export async function getBankAccountStats(): Promise<BankAccountStatsRow[]> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const orderRows = await db
    .select({
      bankAccountId: orderTable.bankAccountId,
      pendingOrders: sql<number>`count(*) filter (where ${orderTable.paymentStatus} = 'pending')::int`,
      paidOrders: sql<number>`count(*) filter (where ${orderTable.paymentStatus} = 'paid')::int`,
      paidOrdersAmount7d: sql<number>`coalesce(sum(${orderTable.total}) filter (where ${orderTable.paymentStatus} = 'paid' and ${orderTable.paidAt} >= ${d7}), 0)::int`,
      paidOrdersAmount30d: sql<number>`coalesce(sum(${orderTable.total}) filter (where ${orderTable.paymentStatus} = 'paid' and ${orderTable.paidAt} >= ${d30}), 0)::int`,
    })
    .from(orderTable)
    .where(sql`${orderTable.bankAccountId} is not null`)
    .groupBy(orderTable.bankAccountId);

  const topupRows = await db
    .select({
      bankAccountId: walletTopupTable.bankAccountId,
      pendingTopups: sql<number>`count(*) filter (where ${walletTopupTable.status} = 'pending')::int`,
      paidTopups: sql<number>`count(*) filter (where ${walletTopupTable.status} = 'paid')::int`,
      paidTopupsAmount7d: sql<number>`coalesce(sum(${walletTopupTable.amount}) filter (where ${walletTopupTable.status} = 'paid' and ${walletTopupTable.paidAt} >= ${d7}), 0)::int`,
      paidTopupsAmount30d: sql<number>`coalesce(sum(${walletTopupTable.amount}) filter (where ${walletTopupTable.status} = 'paid' and ${walletTopupTable.paidAt} >= ${d30}), 0)::int`,
    })
    .from(walletTopupTable)
    .where(sql`${walletTopupTable.bankAccountId} is not null`)
    .groupBy(walletTopupTable.bankAccountId);

  const map = new Map<string, BankAccountStatsRow>();

  for (const row of orderRows) {
    if (!row.bankAccountId) continue;
    map.set(row.bankAccountId, {
      bankAccountId: row.bankAccountId,
      pendingOrders: Number(row.pendingOrders) || 0,
      paidOrders: Number(row.paidOrders) || 0,
      paidOrdersAmount7d: Number(row.paidOrdersAmount7d) || 0,
      paidOrdersAmount30d: Number(row.paidOrdersAmount30d) || 0,
      pendingTopups: 0,
      paidTopups: 0,
      paidTopupsAmount7d: 0,
      paidTopupsAmount30d: 0,
    });
  }

  for (const row of topupRows) {
    if (!row.bankAccountId) continue;
    const existing = map.get(row.bankAccountId);
    if (existing) {
      existing.pendingTopups = Number(row.pendingTopups) || 0;
      existing.paidTopups = Number(row.paidTopups) || 0;
      existing.paidTopupsAmount7d = Number(row.paidTopupsAmount7d) || 0;
      existing.paidTopupsAmount30d = Number(row.paidTopupsAmount30d) || 0;
    } else {
      map.set(row.bankAccountId, {
        bankAccountId: row.bankAccountId,
        pendingOrders: 0,
        paidOrders: 0,
        paidOrdersAmount7d: 0,
        paidOrdersAmount30d: 0,
        pendingTopups: Number(row.pendingTopups) || 0,
        paidTopups: Number(row.paidTopups) || 0,
        paidTopupsAmount7d: Number(row.paidTopupsAmount7d) || 0,
        paidTopupsAmount30d: Number(row.paidTopupsAmount30d) || 0,
      });
    }
  }

  return Array.from(map.values());
}
