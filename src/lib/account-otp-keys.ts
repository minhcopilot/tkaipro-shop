import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export const MAX_ACCESS_KEY_LENGTH = 256;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

/** Key = mật khẩu tài khoản: phân biệt hoa thường, giữ khoảng trắng bên trong. */
function normalizeAccessKey(plain: string): string {
  return (plain || "").trim();
}

/** Tách dòng `email|password` tại dấu `|` đầu tiên (mật khẩu có thể chứa `|`). */
export function parseEmailPasswordLine(
  line: string,
): { email: string; password: string } | null {
  const idx = line.indexOf("|");
  if (idx < 0) return null;
  return {
    email: line.slice(0, idx).trim(),
    password: line.slice(idx + 1).trim(),
  };
}

export function hashAccessKey(plain: string): string {
  return createHash("sha256").update(normalizeAccessKey(plain)).digest("hex");
}

export function verifyAccessKey(plain: string, hash: string): boolean {
  if (!normalizeAccessKey(plain) || !hash) return false;
  const a = Buffer.from(hashAccessKey(plain), "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
