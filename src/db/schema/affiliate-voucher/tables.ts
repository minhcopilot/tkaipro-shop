import {
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { orderTable } from "../orders/tables";
import { userTable } from "../users/tables";

// VOUCHER_STATUS hằng dùng chéo các layer (validator + admin UI).
export const VOUCHER_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
  EXPIRED: "expired",
  USED_UP: "used_up",
} as const;

export type VoucherStatus = (typeof VOUCHER_STATUS)[keyof typeof VOUCHER_STATUS];

export const VOUCHER_DISCOUNT_TYPE = {
  PERCENT: "percent",
  FIXED: "fixed",
} as const;

export type VoucherDiscountType =
  (typeof VOUCHER_DISCOUNT_TYPE)[keyof typeof VOUCHER_DISCOUNT_TYPE];

export const affiliateVoucherTable = pgTable("affiliate_voucher", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),

  // CTV sở hữu (có thể null nếu admin tạo mã chung). Không cascade
  // vì xoá CTV nhưng voucher vẫn còn trong audit/redemption history.
  ownerUserId: text("owner_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  issuedByAdminId: text("issued_by_admin_id")
    .notNull()
    .references(() => userTable.id),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  note: text("note"),

  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxDiscountAmount: integer("max_discount_amount"),

  minOrderSubtotal: integer("min_order_subtotal").default(0),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),

  // Khi set thì chỉ user/email này redeem được. boundEmail dùng cho
  // guest checkout (chưa có account). bound* không cascade để giữ history.
  boundUserId: text("bound_user_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  boundEmail: text("bound_email"),

  allowedProductIds: json("allowed_product_ids")
    .$type<string[]>()
    .default([]),
  allowedCategoryIds: json("allowed_category_ids")
    .$type<string[]>()
    .default([]),

  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),

  status: text("status").notNull().default("active"),
  disabledReason: text("disabled_reason"),
  disabledAt: timestamp("disabled_at"),
  disabledByAdminId: text("disabled_by_admin_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const affiliateVoucherRedemptionTable = pgTable(
  "affiliate_voucher_redemption",
  {
    id: text("id").primaryKey(),
    voucherId: text("voucher_id")
      .notNull()
      .references(() => affiliateVoucherTable.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orderTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    customerEmail: text("customer_email").notNull(),
    subtotalAtRedemption: integer("subtotal_at_redemption").notNull(),
    discountApplied: integer("discount_applied").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
  },
  (t) => ({
    // CRITICAL: 1 voucher chỉ apply được 1 lần / order — chống double-spend
    // khi client retry / user click submit 2 lần nhanh.
    uniqVoucherOrder: uniqueIndex("uniq_voucher_order").on(
      t.voucherId,
      t.orderId,
    ),
  }),
);

export const affiliateVoucherAuditLogTable = pgTable(
  "affiliate_voucher_audit_log",
  {
    id: text("id").primaryKey(),
    voucherId: text("voucher_id").references(() => affiliateVoucherTable.id, {
      onDelete: "set null",
    }),
    adminId: text("admin_id")
      .notNull()
      .references(() => userTable.id),
    action: text("action").notNull(),
    diff: json("diff").$type<Record<string, { from: unknown; to: unknown }>>(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);
