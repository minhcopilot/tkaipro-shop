import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/db";
import { accountOtpKeysTable } from "~/db/schema";
import {
  isValidEmail,
  normalizeEmail,
  verifyAccessKey,
} from "~/lib/account-otp-keys";
import { pollLatestSigninCode } from "~/lib/otp-inbox/client";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_MESSAGE = "Email or access key is not valid.";

function invalid() {
  return NextResponse.json(
    { code: "INVALID", error: INVALID_MESSAGE },
    { status: 400 },
  );
}

function tooMany() {
  return NextResponse.json(
    { code: "TOO_MANY_REQUESTS", error: "Too many requests." },
    { status: 429 },
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`account-code:${ip}`, 8, 60_000).ok) return tooMany();

  let body: { email?: unknown; accessKey?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return invalid();
  }

  const email = normalizeEmail(String(body?.email ?? ""));
  const accessKey = String(body?.accessKey ?? "").trim();
  if (!isValidEmail(email) || !accessKey || accessKey.length > 64) {
    return invalid();
  }

  if (!rateLimit(`account-code-email:${email}`, 5, 10 * 60_000).ok) {
    return tooMany();
  }

  try {
    const [row] = await db
      .select({
        id: accountOtpKeysTable.id,
        keyHash: accountOtpKeysTable.keyHash,
        isActive: accountOtpKeysTable.isActive,
      })
      .from(accountOtpKeysTable)
      .where(eq(accountOtpKeysTable.email, email))
      .limit(1);

    if (!row || !row.isActive || !verifyAccessKey(accessKey, row.keyHash)) {
      return invalid();
    }

    if (!process.env.OTP_INBOX_API_KEY) {
      return NextResponse.json(
        { code: "UNAVAILABLE", error: "Service unavailable." },
        { status: 500 },
      );
    }

    const found = await pollLatestSigninCode(email);
    if (!found) {
      return NextResponse.json(
        { code: "NO_CODE", error: "No recent code found." },
        { status: 404 },
      );
    }

    await db
      .update(accountOtpKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(accountOtpKeysTable.id, row.id));

    return NextResponse.json({
      success: true,
      code: found.code,
      receivedAt: found.receivedAt,
    });
  } catch (err) {
    console.error(
      "[public/account-code] error:",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json(
      { code: "UNKNOWN", error: "Unexpected error." },
      { status: 500 },
    );
  }
}
