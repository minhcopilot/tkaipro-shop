import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Tài khoản ngân hàng nhận chuyển khoản (VietQR / SePay).
 * Chỉ 1 bản ghi isDefault=true tại một thời điểm — enforce ở API.
 */
export const bankAccounts = pgTable("bank_account", {
  accountName: varchar("account_name", { length: 200 }).notNull(),

  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  /** Mã BIN VietQR, vd TP Bank = 970423 */
  bankCode: varchar("bank_code", { length: 20 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  id: uuid("id").defaultRandom().primaryKey(),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
