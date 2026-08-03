import { relations } from "drizzle-orm";
import { licenseTable } from "./tables";
import { userTable } from "../users/tables";

export const licenseRelations = relations(licenseTable, ({ one }) => ({
  user: one(userTable, {
    fields: [licenseTable.userId],
    references: [userTable.id],
  }),
})); 