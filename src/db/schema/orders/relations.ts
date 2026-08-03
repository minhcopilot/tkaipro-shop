import { relations } from "drizzle-orm";
import { userTable } from "../users/tables";
import { orderTable, sepayTransactionTable } from "./tables";

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [orderTable.userId],
    references: [userTable.id],
  }),
  transactions: many(sepayTransactionTable),
}));

export const sepayTransactionRelations = relations(sepayTransactionTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [sepayTransactionTable.orderId],
    references: [orderTable.id],
  }),
})); 