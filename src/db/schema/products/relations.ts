import { relations } from "drizzle-orm";

import { productTable, productCategoryTable, productRestockAlertTable } from "./tables";
import { reviewTable } from "../reviews/tables";

export const productRelations = relations(productTable, ({ one, many }) => ({
  categoryInfo: one(productCategoryTable, {
    fields: [productTable.category],
    references: [productCategoryTable.id], // join bằng ID, không phải slug
  }),
  reviews: many(reviewTable),
  restockAlerts: many(productRestockAlertTable),
}));

export const productRestockAlertRelations = relations(
  productRestockAlertTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productRestockAlertTable.productId],
      references: [productTable.id],
    }),
  }),
);

export const productCategoryRelations = relations(productCategoryTable, ({ one, many }) => ({
  parent: one(productCategoryTable, {
    fields: [productCategoryTable.parentId],
    references: [productCategoryTable.id],
  }),
  children: many(productCategoryTable),
  products: many(productTable),
})); 