import "server-only";

/**
 * Domains thường dùng trong các đợt tấn công giá âm / spam đơn.
 * Mix: domain attacker đã dùng (bypass.net, hack.net, hacker.com)
 * + top ~50 disposable email provider phổ biến ở VN/Asia.
 */
const BLOCKED_EMAIL_DOMAINS = new Set([
  // Attacker-used (từ incident 2026-05-20)
  "bypass.net",
  "hack.net",
  "hacker.com",
  "fake.com",
  "spam.com",
  "test.com",

  // Mainstream disposable
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.dev",
  "tempmailo.com",
  "tempail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.info",
  "guerrillamail.biz",
  "mailinator.com",
  "mailinator.net",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "20minutemail.com",
  "30minutemail.com",
  "throwaway.email",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",

  // Sharklasers family (guerrilla mail aliases)
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",

  // Mohmal / mailnesia / mintemail
  "mohmal.com",
  "mailnesia.com",
  "mintemail.com",
  "fakeinbox.com",
  "fakemailgenerator.com",

  // Getairmail / getnada / inboxbear
  "getairmail.com",
  "getnada.com",
  "inboxbear.com",
  "inboxkitten.com",

  // 1secmail / dispostable / mailcatch / muskmail
  "1secmail.com",
  "1secmail.org",
  "1secmail.net",
  "dispostable.com",
  "mailcatch.com",

  // Trash mail
  "trashmail.com",
  "trashmail.de",
  "trashmail.io",
  "trashmail.me",
  "trashmail.net",
  "trash-mail.com",

  // Spambog / spamgourmet / spambox
  "spambog.com",
  "spambog.de",
  "spamgourmet.com",
  "spambox.us",
  "spam.la",

  // Misc disposable phổ biến
  "maildrop.cc",
  "moakt.com",
  "dropmail.me",
  "harakirimail.com",
  "anonbox.net",
  "fakemail.net",
  "emailondeck.com",
  "emailfake.com",
  "emailtemporanea.net",
  "yoggm.com",
  "zetmail.com",
  "tafmail.com",
  "boximail.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "einrot.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "binkmail.com",
  "bobmail.info",
  "chammy.info",
  "devnullmail.com",
  "discardmail.com",
  "incognitomail.org",
  "kasmail.com",
  "mt2014.com",
  "mt2015.com",

  // VN-specific tạm bợ
  "mailto.plus",
  "fexpost.com",
  "fexbox.org",
  "rover.info",
  "chitthi.in",
  "mailbox.in.ua",
  "vmani.com",
  "vmpan.com",
]);

/** Prefix email rõ ràng là test/spam bot. */
const BLOCKED_EMAIL_PREFIX_RE =
  /^(?:hacker\d*|guest\s*hacker|test\s*bypass|test\d*|spam\d*|fake\d*)@/i;

const EMAIL_FORMAT_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type EmailValidationError =
  | "email_required"
  | "email_invalid_format"
  | "email_blocked_domain"
  | "email_blocked_pattern"
  | "email_not_gmail";

export interface EmailValidationResult {
  ok: boolean;
  error?: EmailValidationError;
  message?: string;
}

const ERROR_MESSAGES_VI: Record<EmailValidationError, string> = {
  email_required: "Vui lòng nhập email",
  email_invalid_format: "Email không hợp lệ",
  email_blocked_domain: "Email không được phép sử dụng",
  email_blocked_pattern: "Email không được phép sử dụng",
  email_not_gmail: "Chỉ chấp nhận email @gmail.com để đăng ký",
};

export function validateCustomerEmail(email: unknown): EmailValidationResult {
  if (typeof email !== "string" || !email.trim()) {
    return {
      ok: false,
      error: "email_required",
      message: ERROR_MESSAGES_VI.email_required,
    };
  }

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_FORMAT_RE.test(normalized) || normalized.length > 254) {
    return {
      ok: false,
      error: "email_invalid_format",
      message: ERROR_MESSAGES_VI.email_invalid_format,
    };
  }

  if (BLOCKED_EMAIL_PREFIX_RE.test(normalized)) {
    return {
      ok: false,
      error: "email_blocked_pattern",
      message: ERROR_MESSAGES_VI.email_blocked_pattern,
    };
  }

  const domain = normalized.split("@")[1];
  if (domain && BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      error: "email_blocked_domain",
      message: ERROR_MESSAGES_VI.email_blocked_domain,
    };
  }

  return { ok: true };
}

/**
 * Validate email cho ĐĂNG KÝ TÀI KHOẢN: chỉ cho phép @gmail.com.
 * Vẫn chạy qua các check cũ (format, blocklist domain, pattern bot) trước,
 * rồi ràng buộc domain phải đúng "gmail.com". Dùng cho luồng sign-up để chống
 * spam đăng ký bằng domain rác / tự dựng.
 */
export function validateRegistrationEmail(email: unknown): EmailValidationResult {
  const base = validateCustomerEmail(email);
  if (!base.ok) return base;

  const domain = String(email).trim().toLowerCase().split("@")[1];
  if (domain !== "gmail.com") {
    return {
      ok: false,
      error: "email_not_gmail",
      message: ERROR_MESSAGES_VI.email_not_gmail,
    };
  }
  return { ok: true };
}

export function validateCustomerName(name: unknown): {
  ok: boolean;
  message?: string;
} {
  if (typeof name !== "string" || name.trim().length < 2) {
    return { ok: false, message: "Vui lòng nhập họ tên (tối thiểu 2 ký tự)" };
  }
  if (name.trim().length > 80) {
    return { ok: false, message: "Họ tên quá dài (tối đa 80 ký tự)" };
  }
  return { ok: true };
}
