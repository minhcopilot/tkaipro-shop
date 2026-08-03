import { NextRequest, NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { guardBannedRequest } from "~/lib/security/ban-guard";
import { validateRegistrationEmail } from "~/lib/security/email-blocklist";
import {
  consumeRegistrationOtp,
  verifyRegistrationOtp,
} from "~/lib/auth/registration-otp";

export const runtime = "nodejs";

const OTP_ERR_MSG: Record<string, string> = {
  NO_OTP: "Chưa có mã OTP cho email này. Vui lòng yêu cầu mã mới.",
  EXPIRED: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
  USED: "Mã OTP đã được sử dụng.",
  TOO_MANY: "Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.",
  WRONG: "Mã OTP không đúng.",
};

/**
 * POST /api/register/verify
 * Body: { email, code, password, name }
 *
 * Xác thực OTP rồi tạo account (qua better-auth). Account chỉ được tạo khi OTP
 * đúng -> bot không tạo được user row nếu không có mã gửi về gmail.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const banResp = await guardBannedRequest(request);
    if (banResp) return banResp;

    const rl = rateLimit(`reg-verify:${ip}`, 15, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Bạn thử quá nhanh, vui lòng đợi." },
        { status: 429 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      code?: string;
      password?: string;
      name?: string;
    };
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();

    const emailCheck = validateRegistrationEmail(email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: emailCheck.message ?? "Email không hợp lệ" },
        { status: 400 },
      );
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Mã OTP gồm 6 số." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 8 ký tự." },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json({ error: "Vui lòng nhập tên." }, { status: 400 });
    }

    // 1) Xác thực OTP
    const otp = await verifyRegistrationOtp(email, code);
    if (!otp.ok) {
      return NextResponse.json(
        { error: OTP_ERR_MSG[otp.error ?? "WRONG"] ?? "Mã OTP không đúng" },
        { status: 400 },
      );
    }

    // 2) Tạo account (user.create.before sẽ thấy OTP đã verified -> cho qua).
    try {
      await auth.api.signUpEmail({
        body: { email, password, name },
        headers: request.headers,
      });
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "").toLowerCase();
      if (
        err?.body?.code === "USER_ALREADY_EXISTS" ||
        msg.includes("already exists") ||
        msg.includes("existing email")
      ) {
        return NextResponse.json(
          { error: "Email này đã được đăng ký. Vui lòng đăng nhập." },
          { status: 409 },
        );
      }
      console.error("[register/verify] signUp failed:", err);
      return NextResponse.json(
        { error: "Không thể tạo tài khoản, vui lòng thử lại." },
        { status: 400 },
      );
    }

    // 3) Đánh dấu OTP đã dùng.
    await consumeRegistrationOtp(email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[register/verify] error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
