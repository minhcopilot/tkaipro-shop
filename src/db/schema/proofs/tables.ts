import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

import { userTable } from "../users/tables";

export const socialProofs = pgTable("social_proofs", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // thông tin minh chứng
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // 'website', 'telegram', 'facebook'
  productType: varchar("product_type", { length: 100 }).notNull(), // 'cursor-pro', 'github-copilot', 'figma-pro', 'jetbrains-edu'
  
  // thông tin đơn hàng (optional)
  orderNumber: varchar("order_number", { length: 100 }),
  customerName: varchar("customer_name", { length: 255 }),
  amount: varchar("amount", { length: 100 }),
  orderDate: timestamp("order_date", { withTimezone: true }),
  
  // trạng thái
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // nổi bật
  
  // metadata
  displayOrder: varchar("display_order", { length: 10 }).default("0"), // thứ tự hiển thị
  
  // timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  
  // tạo bởi admin nào
  createdBy: text("created_by").references(() => userTable.id),
});

export type SocialProof = typeof socialProofs.$inferSelect;
export type NewSocialProof = typeof socialProofs.$inferInsert;

