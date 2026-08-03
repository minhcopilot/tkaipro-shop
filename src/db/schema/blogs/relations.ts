import { relations } from "drizzle-orm";

import { blogPosts } from "./tables";
import { userTable } from "../users/tables";

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(userTable, {
    fields: [blogPosts.authorId],
    references: [userTable.id],
  }),
}));

