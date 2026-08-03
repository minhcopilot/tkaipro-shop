import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { banListTable, userIpLogTable } from "./tables";

export type BanEntry = InferSelectModel<typeof banListTable>;
export type BanEntryInsert = InferInsertModel<typeof banListTable>;

export type BanKind = "ip" | "email" | "fingerprint";

export type UserIpLog = InferSelectModel<typeof userIpLogTable>;
export type UserIpLogInsert = InferInsertModel<typeof userIpLogTable>;

export type IpEventType =
  | "register"
  | "login"
  | "order"
  // Xem thong tin nhay cam cua don (credential/activation) — dung de phat hien
  // hanh vi scrape tai khoan hang loat tu 1 IP.
  | "credential_view"
  // Truy cap trang (ghi lai IP + country + fingerprint qua /api/track) de
  // theo doi thiet bi/khach truy cap, ke ca khach chua dang nhap.
  | "visit"
  // Activity log: hanh dong cu the cua user/IP/thiet bi tren web.
  | "otp_request" // yeu cau OTP dang ky
  | "checkout" // bam thanh toan / tao don
  | "order_view" // mo trang xem don
  | "activate"; // submit active login_link
