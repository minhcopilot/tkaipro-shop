import {
  pgTable,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

import { orderTable } from "../orders/tables";
import { productTable } from "../products/tables";

export const subscriptionTable = pgTable("subscription", {
  id: text("id").primaryKey(),
  
  // liên kết với order và product
  orderId: text("order_id").notNull().references(() => orderTable.id),
  productId: text("product_id").notNull().references(() => productTable.id),
  
  // thông tin tài khoản (account: password rỗng — Cursor pass ở manager vault; license: ciphertext key)
  username: text("username").notNull(),
  password: text("password").notNull(),
  
  // thông tin thời hạn
  assignedAt: timestamp("assigned_at").notNull(), // ngày cấp tài khoản
  expiresAt: timestamp("expires_at").notNull(), // ngày hết hạn
  
  // trạng thái
  isActive: boolean("is_active").default(true), // tài khoản có còn hoạt động không
  isExpired: boolean("is_expired").default(false), // đã hết hạn chưa
  
  // metadata
  customerEmail: text("customer_email").notNull(), // email khách hàng để thông báo
  productName: text("product_name").notNull(), // tên sản phẩm
  
  // reminder email tracking
  reminder3DaySentAt: timestamp("reminder_3day_sent_at"), // đã gửi email nhắc 3 ngày chưa
  reminder1DaySentAt: timestamp("reminder_1day_sent_at"), // đã gửi email nhắc 1 ngày chưa
  
  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}); 