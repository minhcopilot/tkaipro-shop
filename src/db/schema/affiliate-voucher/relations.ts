import { relations } from "drizzle-orm";

import { orderTable } from "../orders/tables";
import { userTable } from "../users/tables";
import {
  affiliateVoucherAuditLogTable,
  affiliateVoucherRedemptionTable,
  affiliateVoucherTable,
} from "./tables";

export const affiliateVoucherRelations = relations(
  affiliateVoucherTable,
  ({ one, many }) => ({
    owner: one(userTable, {
      fields: [affiliateVoucherTable.ownerUserId],
      references: [userTable.id],
      relationName: "voucher_owner",
    }),
    issuedByAdmin: one(userTable, {
      fields: [affiliateVoucherTable.issuedByAdminId],
      references: [userTable.id],
      relationName: "voucher_issued_by",
    }),
    redemptions: many(affiliateVoucherRedemptionTable),
    auditLogs: many(affiliateVoucherAuditLogTable),
  }),
);

export const affiliateVoucherRedemptionRelations = relations(
  affiliateVoucherRedemptionTable,
  ({ one }) => ({
    voucher: one(affiliateVoucherTable, {
      fields: [affiliateVoucherRedemptionTable.voucherId],
      references: [affiliateVoucherTable.id],
    }),
    order: one(orderTable, {
      fields: [affiliateVoucherRedemptionTable.orderId],
      references: [orderTable.id],
    }),
    user: one(userTable, {
      fields: [affiliateVoucherRedemptionTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const affiliateVoucherAuditLogRelations = relations(
  affiliateVoucherAuditLogTable,
  ({ one }) => ({
    voucher: one(affiliateVoucherTable, {
      fields: [affiliateVoucherAuditLogTable.voucherId],
      references: [affiliateVoucherTable.id],
    }),
    admin: one(userTable, {
      fields: [affiliateVoucherAuditLogTable.adminId],
      references: [userTable.id],
    }),
  }),
);
