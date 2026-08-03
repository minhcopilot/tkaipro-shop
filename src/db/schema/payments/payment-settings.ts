import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const BANK_SELECTION_MODE = {
  DEFAULT: "default",
  ROUND_ROBIN: "round_robin",
} as const;

export type BankSelectionMode =
  (typeof BANK_SELECTION_MODE)[keyof typeof BANK_SELECTION_MODE];

/**
 * Cấu hình thanh toán chuyển khoản (1 row id='default').
 * - bank_selection_mode: 'default' | 'round_robin'
 * - rr_cursor_bank_id: TK vừa gán gần nhất khi mode = round_robin
 */
export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey().default("default"),
  bankSelectionMode: text("bank_selection_mode").notNull().default("default"),
  rrCursorBankId: uuid("rr_cursor_bank_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type NewPaymentSettings = typeof paymentSettings.$inferInsert;
