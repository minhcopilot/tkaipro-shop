import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const licenseTable = pgTable("license", {
  id: text("id").primaryKey(),
  
  // thông tin license
  productCode: text("product_code").notNull(), // II,PCWMP,PSI, v.v.
  productName: text("product_name").notNull(), // IntelliJ IDEA, PyCharm, v.v.
  licenseName: text("license_name").notNull(), // tên license
  licenseKey: text("license_key").notNull(), // license key đầy đủ
  
  // thông tin người dùng
  userId: text("user_id"), // id của user tạo license (nếu có)
  assigneeName: text("assignee_name"), // tên người được gán (nếu có)
  
  // thời gian
  expiryDate: timestamp("expiry_date").notNull(), // ngày hết hạn
  duration: integer("duration").notNull(), // số năm
  
  // trạng thái
  status: text("status").notNull().default("active"), // active, expired, revoked
  isUsed: boolean("is_used").default(false), // đã sử dụng chưa
  
  // metadata
  notes: text("notes"), // ghi chú
  
  // timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"), // thời điểm sử dụng
}); 