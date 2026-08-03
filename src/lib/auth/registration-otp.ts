import "server-only";
import { createHash, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { registrationOtpTable } from "~/db/schema";

const OTP_TTL_MS = 10 * 60_000; // OTP sống 10 phút
const MAX_ATTEMPTS = 5;
// Sau khi verify, OTP còn hiệu lực để tạo account trong 30 phút.
const VERIFIED_WINDOW_MS = 30 * 60_000;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function genCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function norm(email: string): string {
  return email.trim().toLowerCase();
}

/** Tạo (hoặc làm mới) OTP cho email. Trả về mã plaintext để caller gửi mail. */
export async function createRegistrationOtp(input: {
  email: string;
  ip?: string | null;
  fingerprint?: string | null;
  did?: string | null;
}): Promise<string> {
  const email = norm(input.email);
  const code = genCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db
    .insert(registrationOtpTable)
    .values({
      id: nanoid(),
      email,
      codeHash,
      ip: input.ip ?? null,
      fingerprint: input.fingerprint ?? null,
      did: input.did ?? null,
      attempts: 0,
      expiresAt,
      verifiedAt: null,
      consumedAt: null,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: registrationOtpTable.email,
      set: {
        codeHash,
        ip: input.ip ?? null,
        fingerprint: input.fingerprint ?? null,
        did: input.did ?? null,
        attempts: 0,
        expiresAt,
        verifiedAt: null,
        consumedAt: null,
        createdAt: new Date(),
      },
    });

  return code;
}

export type OtpVerifyError =
  | "NO_OTP"
  | "EXPIRED"
  | "USED"
  | "TOO_MANY"
  | "WRONG";

/** Xác thực OTP. Nếu đúng -> đánh dấu verifiedAt. */
export async function verifyRegistrationOtp(
  email: string,
  code: string,
): Promise<{ ok: boolean; error?: OtpVerifyError }> {
  const e = norm(email);
  const [row] = await db
    .select()
    .from(registrationOtpTable)
    .where(eq(registrationOtpTable.email, e))
    .limit(1);

  if (!row) return { ok: false, error: "NO_OTP" };
  if (row.consumedAt) return { ok: false, error: "USED" };
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "EXPIRED" };
  }
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "TOO_MANY" };

  if (row.codeHash !== hashCode(String(code))) {
    await db
      .update(registrationOtpTable)
      .set({ attempts: row.attempts + 1 })
      .where(eq(registrationOtpTable.email, e));
    return { ok: false, error: "WRONG" };
  }

  await db
    .update(registrationOtpTable)
    .set({ verifiedAt: new Date() })
    .where(eq(registrationOtpTable.email, e));
  return { ok: true };
}

/**
 * Kiểm tra email có OTP đã verified gần đây (chưa consumed, trong cửa sổ) —
 * dùng trong user.create.before để bắt buộc đăng ký phải qua OTP.
 */
export async function hasRecentVerifiedOtp(email: string): Promise<boolean> {
  const e = norm(email);
  const [row] = await db
    .select()
    .from(registrationOtpTable)
    .where(eq(registrationOtpTable.email, e))
    .limit(1);
  if (!row || !row.verifiedAt || row.consumedAt) return false;
  return Date.now() - new Date(row.verifiedAt).getTime() <= VERIFIED_WINDOW_MS;
}

/** Đánh dấu OTP đã dùng (sau khi tạo account thành công). */
export async function consumeRegistrationOtp(email: string): Promise<void> {
  const e = norm(email);
  await db
    .update(registrationOtpTable)
    .set({ consumedAt: new Date() })
    .where(eq(registrationOtpTable.email, e));
}
