import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Khóa truy cập trang lấy OTP tài khoản. Mỗi email 1 khóa; `email` luôn lưu
 * lowercase trim. `key_hash` = SHA-256 hex của khóa (không lưu plaintext).
 */
export const accountOtpKeysTable = pgTable(
  "account_otp_keys",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    keyHash: text("key_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    note: text("note"),
    // user.id của admin tạo khóa
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => ({
    emailUniq: uniqueIndex("account_otp_keys_email_uniq").on(t.email),
  }),
);
