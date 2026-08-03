import { relations } from "drizzle-orm";

import { socialProofs } from "./tables";
import { userTable } from "../users/tables";

export const socialProofsRelations = relations(socialProofs, ({ one }) => ({
  creator: one(userTable, {
    fields: [socialProofs.createdBy],
    references: [userTable.id],
  }),
}));

