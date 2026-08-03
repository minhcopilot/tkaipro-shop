import { relations } from "drizzle-orm";

import { userTable } from "../users/tables";
import { walletTopupTable, walletTransactionTable } from "./tables";

export const walletTopupRelations = relations(walletTopupTable, ({ one }) => ({
  user: one(userTable, {
    fields: [walletTopupTable.userId],
    references: [userTable.id],
  }),
  confirmedBy: one(userTable, {
    fields: [walletTopupTable.confirmedByUserId],
    references: [userTable.id],
    relationName: "wallet_topup_confirmed_by",
  }),
}));

export const walletTransactionRelations = relations(
  walletTransactionTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [walletTransactionTable.userId],
      references: [userTable.id],
    }),
    createdBy: one(userTable, {
      fields: [walletTransactionTable.createdByUserId],
      references: [userTable.id],
      relationName: "wallet_transaction_created_by",
    }),
  }),
);
