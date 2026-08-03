import { relations } from "drizzle-orm";
import { reviewTable } from "./tables";
import { userTable } from "../users/tables";
import { productTable } from "../products/tables";

export const reviewRelations = relations(reviewTable, ({ one }) => ({
  user: one(userTable, {
    fields: [reviewTable.userId],
    references: [userTable.id],
  }),
  product: one(productTable, {
    fields: [reviewTable.productId],
    references: [productTable.id],
  }),
}));
