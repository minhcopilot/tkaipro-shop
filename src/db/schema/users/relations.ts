import { relations } from "drizzle-orm";

import { uploadsTable } from "../uploads/tables";
import {
  walletTopupTable,
  walletTransactionTable,
} from "../wallet/tables";
import { accountTable, sessionTable, userTable } from "./tables";
import { reviewTable } from "../reviews/tables";

export const userRelations = relations(userTable, ({ many }) => ({
  accounts: many(accountTable),
  sessions: many(sessionTable),
  uploads: many(uploadsTable),
  reviews: many(reviewTable),
  walletTopups: many(walletTopupTable),
  walletTransactions: many(walletTransactionTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));
