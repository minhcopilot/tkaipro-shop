import { NextRequest, NextResponse } from "next/server";

import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { guardBannedRequest } from "~/lib/security/ban-guard";
import { validateRegistrationEmail } from "~/lib/security/email-blocklist";
import { verifyTurnstileToken } from "~/lib/security/turnstile";
import {
  getCountryFromHeaders,
  getDeviceIdFromRequest,
  getFingerprintFromRequest,
  logUserIp,
} from "~/lib/security/ip-log";
import { evaluateActor } from "~/lib/security/abuse-detect";
import { createRegistrationOtp } from "~/lib/auth/registration-otp";
import { sendRegistrationOtpEmail } from "~/lib/email-service";

export const runtime = "nodejs";

/**
 * POST /api/register/request-otp
 * Body: { email, locale?, turnstileToken? }
 *
 * Gửi OTP về gmail TRƯỚC khi tạo account. Chặn bot: gmail-only + ban check +
 * Turnstile + abuse heuristic + rate-limit (per IP + per email).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Ban check (IP + fingerprint/did qua cookie).
    const banResp = await guardBannedRequest(request);
    if (banResp) return banResp;

    const ipLimit = rateLimit(`reg-otp-ip:${ip}`, 8, 60_000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: `Bạn thử quá nhanh, đợi ${Math.ceil(ipLimit.resetInMs / 1000)}s.` },
        { status: 429 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      locale?: string;
      turnstileToken?: string;
    };
    const email = String(body.email ?? "").trim().toLowerCase();

    // Gmail-only + format/blocklist
    const emailCheck = validateRegistrationEmail(email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: emailCheck.message ?? "Email không hợp lệ" },
        { status: 400 },
      );
    }

    // Ban theo email
    const emailBan = await guardBannedRequest(request, { email });
    if (emailBan) return emailBan;

    // Rate-limit per email
    const emailLimit = rateLimit(`reg-otp-email:${email}`, 5, 3_600_000);
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: "Email này yêu cầu mã quá nhiều lần, thử lại sau." },
        { status: 429 },
      );
    }

    // Turnstile (bỏ qua nếu chưa cấu hình key)
    const captcha = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { error: captcha.message ?? "Xác minh captcha thất bại" },
        { status: 403 },
      );
    }

    const fingerprint = getFingerprintFromRequest(request);
    const did = getDeviceIdFromRequest(request);

    // Abuse heuristic: nếu thiết bị/IP đang lạm dụng -> chặn (enforceActor auto-ban
    // ở đây cũng được, nhưng chỉ cần đánh giá để chặn gửi OTP).
    const decision = await evaluateActor({
      ip,
      fingerprint,
      did,
      email,
      userAgent: request.headers.get("user-agent"),
    });
    if (decision.action === "ban_device") {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối do hành vi bất thường." },
        { status: 403 },
      );
    }

    const code = await createRegistrationOtp({ email, ip, fingerprint, did });
    await sendRegistrationOtpEmail(email, code, body.locale);

    // Activity log
    void logUserIp({
      email,
      eventType: "otp_request",
      ip,
      userAgent: request.headers.get("user-agent"),
      country: getCountryFromHeaders(request.headers),
      fingerprint,
      did,
      path: "/api/register/request-otp",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[register/request-otp] error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
