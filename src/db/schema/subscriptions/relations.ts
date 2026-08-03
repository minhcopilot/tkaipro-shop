import { relations } from "drizzle-orm";
import { subscriptionTable } from "./tables";
import { orderTable } from "../orders/tables";
import { productTable } from "../products/tables";

export const subscriptionRelations = relations(subscriptionTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [subscriptionTable.orderId],
    references: [orderTable.id],
  }),
  product: one(productTable, {
    fields: [subscriptionTable.productId],
    references: [productTable.id],
  }),
})); 