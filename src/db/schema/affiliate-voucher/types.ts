import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type {
  affiliateVoucherAuditLogTable,
  affiliateVoucherRedemptionTable,
  affiliateVoucherTable,
} from "./tables";

export type AffiliateVoucher = InferSelectModel<typeof affiliateVoucherTable>;
export type AffiliateVoucherInsert = InferInsertModel<
  typeof affiliateVoucherTable
>;
export type AffiliateVoucherUpdate = Partial<AffiliateVoucherInsert>;

export type AffiliateVoucherRedemption = InferSelectModel<
  typeof affiliateVoucherRedemptionTable
>;
export type AffiliateVoucherRedemptionInsert = InferInsertModel<
  typeof affiliateVoucherRedemptionTable
>;

export type AffiliateVoucherAuditLog = InferSelectModel<
  typeof affiliateVoucherAuditLogTable
>;
export type AffiliateVoucherAuditLogInsert = InferInsertModel<
  typeof affiliateVoucherAuditLogTable
>;
