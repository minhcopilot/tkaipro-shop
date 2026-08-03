import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { productTable } from "../products/tables";
import { userTable } from "../users/tables";

export const reviewTable = pgTable("review", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  
  // Admin reply
  reply: text("reply"),
  replyAt: timestamp("reply_at"),
  
  // Metadata
  isPublished: boolean("is_published").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
