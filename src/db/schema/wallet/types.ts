import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

import { walletTopupTable, walletTransactionTable } from "./tables";

export type WalletTopup = InferSelectModel<typeof walletTopupTable>;
export type WalletTopupInsert = InferInsertModel<typeof walletTopupTable>;

export type WalletTransaction = InferSelectModel<typeof walletTransactionTable>;
export type WalletTransactionInsert = InferInsertModel<
  typeof walletTransactionTable
>;

// Constants — narrow string literals dùng xuyên codebase
export const WALLET_CURRENCY = {
  VND: "vnd",
  USD: "usd",
} as const;
export type WalletCurrency = (typeof WALLET_CURRENCY)[keyof typeof WALLET_CURRENCY];

export const WALLET_TOPUP_STATUS = {
  PENDING: "pending",
  PENDING_REVIEW: "pending_review",
  PAID: "paid",
  EXPIRED: "expired",
  REJECTED: "rejected",
} as const;
export type WalletTopupStatus =
  (typeof WALLET_TOPUP_STATUS)[keyof typeof WALLET_TOPUP_STATUS];

export const WALLET_TOPUP_METHOD = {
  SEPAY: "sepay",
  CRYPTO: "crypto",
} as const;
export type WalletTopupMethod =
  (typeof WALLET_TOPUP_METHOD)[keyof typeof WALLET_TOPUP_METHOD];

export const WALLET_TX_TYPE = {
  TOPUP: "topup",
  DEBIT: "debit",
  REFUND: "refund",
  ADMIN_ADJUST: "admin_adjust",
} as const;
export type WalletTxType = (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];

export const WALLET_REF_TYPE = {
  TOPUP: "topup",
  ORDER: "order",
  ADMIN: "admin",
  REFUND: "refund",
} as const;
export type WalletRefType =
  (typeof WALLET_REF_TYPE)[keyof typeof WALLET_REF_TYPE];
