import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Ban list generic — chặn IP hoặc email truy cập / đặt đơn / active key.
 *
 * Một bảng duy nhất để query/UI giống nhau cho 2 loại. Phân biệt qua cột
 * `kind`. `value` luôn lưu lowercase trim — trùng key sẽ bị unique index
 * `(kind, value)` chặn.
 *
 * `bannedUntil` = NULL nghĩa ban vĩnh viễn. Dù MVP hiện tại chưa có UI cho
 * expiry, vẫn để cột này phòng tương lai (1-click "ban 24h" / "ban 7d").
 */
export const banListTable = pgTable(
  "ban_list",
  {
    id: text("id").primaryKey(),
    // 'ip' | 'email'
    kind: text("kind").notNull(),
    // IP hoặc email (lowercased, trimmed)
    value: text("value").notNull(),
    // Lý do (admin nhập, hoặc auto-fill từ 1-click ban từ audit alert)
    reason: text("reason"),
    // user.id của admin tạo ban (nullable nếu seed/migration auto-add)
    bannedBy: text("banned_by"),
    // Email/handle admin (denormalize để UI khỏi join)
    bannedByLabel: text("banned_by_label"),
    // NULL = vĩnh viễn
    bannedUntil: timestamp("banned_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("ban_list_kind_value_uniq").on(t.kind, t.value),
    kindIdx: index("ban_list_kind_idx").on(t.kind, t.createdAt),
    untilIdx: index("ban_list_until_idx").on(t.bannedUntil),
  }),
);

/**
 * Append-only forensics log của IP theo từng sự kiện nhạy cảm: đăng ký,
 * đăng nhập, tạo đơn. Dùng để admin truy vết user lạm dụng / nhiều account
 * dùng chung 1 IP (dấu hiệu cố tình bypass) và ra quyết định ban.
 *
 * Không hard-FK tới user (nullable text) vì cần log cả guest order và giữ log
 * lại kể cả khi user bị xóa.
 */
export const userIpLogTable = pgTable(
  "user_ip_log",
  {
    id: text("id").primaryKey(),
    // user.id — null cho guest (đặt đơn không đăng nhập)
    userId: text("user_id"),
    // Email denormalize để tra cứu nhanh + cho guest order
    email: text("email"),
    // 'register' | 'login' | 'order' | 'credential_view' | 'visit'
    eventType: text("event_type").notNull(),
    ip: text("ip").notNull(),
    userAgent: text("user_agent"),
    // order.id — chỉ set cho event 'order'
    orderId: text("order_id"),
    // Mã quốc gia 2 ký tự (ISO) lấy từ Cloudflare `cf-ipcountry`. Giúp phát
    // hiện đăng nhập/đặt đơn từ quốc gia lạ + so với lịch sử user.
    country: text("country"),
    // Device fingerprint (FingerprintJS visitorId) — định danh thiết bị/trình
    // duyệt, bền hơn IP khi user đổi mạng/VPN. Dùng để gom nhiều account 1
    // thiết bị + ban theo thiết bị.
    fingerprint: text("fingerprint"),
    // Device-id do SERVER set (cookie httpOnly `did`, UUID) — khó xoá hơn cookie
    // fp (JS) nên là mốc nhận dạng thiết bị thứ 2, chống xoá fingerprint để né.
    did: text("did"),
    // Đường dẫn/hành động (activity log): /vi/checkout, order:ORD..., v.v.
    // Giúp admin xem user/IP/thiết bị đã làm gì trên web.
    path: text("path"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("user_ip_log_user_idx").on(t.userId, t.createdAt),
    ipIdx: index("user_ip_log_ip_idx").on(t.ip, t.createdAt),
    emailIdx: index("user_ip_log_email_idx").on(t.email),
    eventIdx: index("user_ip_log_event_idx").on(t.eventType),
    fpIdx: index("user_ip_log_fp_idx").on(t.fingerprint),
    didIdx: index("user_ip_log_did_idx").on(t.did),
  }),
);

/**
 * OTP đăng ký tài khoản (gmail). Tạo TRƯỚC khi tạo account: khách phải nhập
 * đúng OTP gửi về gmail thì account mới được tạo -> chặn bot tạo hàng loạt.
 * `code_hash` = SHA-256 của OTP (không lưu plaintext). 1 dòng / email mới nhất.
 */
export const registrationOtpTable = pgTable(
  "registration_otp",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    ip: text("ip"),
    fingerprint: text("fingerprint"),
    did: text("did"),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    // Set khi nhập đúng OTP. user.create.before yêu cầu giá trị này gần đây.
    verifiedAt: timestamp("verified_at"),
    // Set khi đã dùng để tạo account (chống tái sử dụng).
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("registration_otp_email_uniq").on(t.email),
    expiresIdx: index("registration_otp_expires_idx").on(t.expiresAt),
  }),
);

/**
 * Danh sách MIỄN auto-ban. Khi admin gỡ ban 1 IP/email/thiết bị, định danh đó
 * được thêm vào đây để hệ thống KHÔNG tự động ban lại (heuristic abuse-detect bỏ
 * qua). Ban THỦ CÔNG của admin vẫn hoạt động bình thường (miễn trừ chỉ chặn auto).
 *
 * `kind` dùng chung quy ước với ban_list: 'ip' | 'email' | 'fingerprint'
 * (did cũng lưu dưới 'fingerprint').
 */
/**
 * Audit append-only cho hành động nhạy cảm của admin và của cơ chế auto-ban.
 *
 * Khác `user_ip_log` (log mọi lượt truy cập của khách, khối lượng lớn): bảng này
 * chỉ ghi quyết định — ai ban ai, vì lý do gì — nên đọc lại lúc điều tra sự cố
 * không phải lọc qua hàng triệu dòng traffic.
 *
 * Không throw khi insert lỗi: mất một dòng audit không được phép làm hỏng flow
 * chính (xem `~/lib/security/security-audit`).
 */
export const securityEventTable = pgTable(
  "security_event",
  {
    id: text("id").primaryKey(),
    // 'admin_action' | 'auto_ban' | ...
    eventType: text("event_type").notNull(),
    // 'ok' | 'reject' | null
    outcome: text("outcome"),
    // Mã ngắn để filter: BAN_USER, AUTO_BAN_SCRAPE, ...
    reasonCode: text("reason_code"),
    customerEmail: text("customer_email"),
    clientIp: text("client_ip"),
    country: text("country"),
    userAgent: text("user_agent"),
    message: text("message"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("security_event_type_idx").on(t.eventType, t.createdAt),
    emailIdx: index("security_event_email_idx").on(t.customerEmail),
    ipIdx: index("security_event_ip_idx").on(t.clientIp),
  }),
);

export const autoBanExemptTable = pgTable(
  "auto_ban_exempt",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    value: text("value").notNull(),
    note: text("note"),
    createdBy: text("created_by"),
    createdByLabel: text("created_by_label"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("auto_ban_exempt_kind_value_uniq").on(t.kind, t.value),
  }),
);
