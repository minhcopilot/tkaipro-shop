import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

/** Khóa dạng XXXX-XXXX-XXXX, bỏ ký tự dễ nhầm (I, O, 0, 1). */
export function generateAccessKey(): string {
  const groups: string[] = [];
  for (let g = 0; g < 3; g++) {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)];
    }
    groups.push(s);
  }
  return groups.join("-");
}

function normalizeAccessKey(plain: string): string {
  return (plain || "").trim().toUpperCase().replace(/\s+/g, "");
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
