import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Wallet topup request — yêu cầu nạp tiền của user.
 *
 * Một user có 2 ví: VND (nạp qua MB Bank QR auto-confirm bằng SePay
 * webhook) và USD (nạp qua crypto, admin xác nhận thủ công sau khi user
 * upload biên lai).
 *
 * Lifecycle:
 *   pending → paid                    (VND auto qua SePay)
 *   pending → pending_review → paid   (USD: user upload proof, admin approve)
 *   pending → expired                 (cron daily quét quá expiresAt)
 *   pending → rejected                (admin từ chối topup crypto)
 *
 * `transferContent` (natural memo + 8-char token, vd `Bao ban bua nay m7k2p9x4`)
 * là khóa SePay match → topup. Phải UNIQUE để webhook tránh credit 2 lần.
 */
export const walletTopupTable = pgTable(
  "wallet_topup",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),

    // 'vnd' | 'usd'
    currency: text("currency").notNull(),
    // VND: lưu nguyên (vd 500000 = 500k VND)
    // USD: lưu cents (vd 1000 = $10.00)
    amount: integer("amount").notNull(),

    // 'sepay' (chỉ VND) | 'crypto' (chỉ USD)
    method: text("method").notNull(),
    // chỉ điền khi method='crypto', vd binance|bybit|usdt-bep20|usdt-trc20|btc|eth|ltc
    cryptoMethodId: text("crypto_method_id"),

    // 'pending' | 'pending_review' | 'paid' | 'expired' | 'rejected'
    status: text("status").notNull().default("pending"),

    // Nội dung CK unique (generatePaymentMemo) — SePay webhook match token để
    // credit vnd_balance. Legacy TOP... format chỉ còn fallback webhook.
    transferContent: text("transfer_content").notNull(),

    // TK ngân hàng gắn cứng lúc tạo topup VND (QR ổn định)
    bankAccountId: text("bank_account_id"),
    bankName: text("bank_name"),
    bankCode: text("bank_code"),
    bankAccountNumber: text("bank_account_number"),
    bankAccountName: text("bank_account_name"),

    // Crypto: link ảnh biên lai user upload sau khi chuyển
    proofImageUrl: text("proof_image_url"),

    // Khi paid via SePay: id của sepay_transaction (FK lỏng — không hard ref vì
    // khác schema namespace)
    sepayTransactionId: text("sepay_transaction_id"),

    // Khi crypto approve/reject: admin user.id thực hiện
    confirmedByUserId: text("confirmed_by_user_id"),
    rejectedReason: text("rejected_reason"),

    // forensics
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
    // Pending topup timeout (default now + 30 min). Cron mark expired.
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => ({
    transferContentUniq: uniqueIndex("wallet_topup_transfer_content_uniq").on(
      t.transferContent,
    ),
    userCreatedIdx: index("wallet_topup_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    statusIdx: index("wallet_topup_status_idx").on(t.status, t.createdAt),
  }),
);

/**
 * Wallet transaction — audit log mọi thay đổi balance.
 *
 * `amount` là số có dấu: dương = cộng vào balance, âm = trừ. Sau mỗi
 * transaction lưu `balanceAfter` để admin/UI dễ trace mà không phải sum
 * lại từ đầu.
 *
 * Mỗi transaction LUÔN gắn với 1 ví duy nhất qua cột `currency`. User có 2
 * ví độc lập => sẽ có 2 stream transaction tách biệt khi filter.
 *
 * `refType`+`refId` link ngược về nguồn gốc:
 *   - 'topup'  → wallet_topup.id
 *   - 'order'  → order.id (debit khi user pay-with-wallet)
 *   - 'admin'  → null (admin adjust manual, ghi rõ ở `note`)
 *   - 'refund' → order.id (refund đơn đã debit)
 */
export const walletTransactionTable = pgTable(
  "wallet_transaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),

    // 'vnd' | 'usd'
    currency: text("currency").notNull(),

    // 'topup' | 'debit' | 'refund' | 'admin_adjust'
    type: text("type").notNull(),

    // signed: + cộng, - trừ. VND nguyên, USD cents.
    amount: integer("amount").notNull(),
    // Snapshot balance sau khi apply transaction này
    balanceAfter: integer("balance_after").notNull(),

    // 'topup' | 'order' | 'admin' | 'refund'
    refType: text("ref_type"),
    refId: text("ref_id"),

    note: text("note"),
    createdByUserId: text("created_by_user_id"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index("wallet_transaction_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    refIdx: index("wallet_transaction_ref_idx").on(t.refType, t.refId),
    typeIdx: index("wallet_transaction_type_idx").on(t.type, t.createdAt),
  }),
);
