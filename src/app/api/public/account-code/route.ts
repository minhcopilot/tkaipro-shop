import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/db";
import { accountOtpKeysTable } from "~/db/schema";
import {
  isValidEmail,
  MAX_ACCESS_KEY_LENGTH,
  normalizeEmail,
  verifyAccessKey,
} from "~/lib/account-otp-keys";
import { pollLatestSigninCode } from "~/lib/otp-inbox/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID_MESSAGE = "Email or password is not valid.";

function invalid() {
  return NextResponse.json(
    { code: "INVALID", error: INVALID_MESSAGE },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  let body: { email?: unknown; accessKey?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return invalid();
  }

  const email = normalizeEmail(String(body?.email ?? ""));
  const accessKey = String(body?.accessKey ?? body?.password ?? "").trim();
  if (
    !isValidEmail(email) ||
    !accessKey ||
    accessKey.length > MAX_ACCESS_KEY_LENGTH
  ) {
    return invalid();
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
