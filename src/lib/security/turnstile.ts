import "server-only";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify Cloudflare Turnstile token server-side.
 * Nếu TURNSTILE_SECRET_KEY chưa cấu hình → skip (dev/local).
 */
export async function verifyTurnstileToken(
  token: unknown,
  remoteIp?: string,
): Promise<{ ok: boolean; message?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Dev/local: không bắt buộc captcha khi chưa có key
    return { ok: true };
  }

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, message: "Vui lòng xác minh captcha" };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
    });
    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      return { ok: false, message: "Xác minh captcha thất bại, vui lòng thử lại" };
    }

    return { ok: true };
  } catch (err) {
    console.error("Turnstile verify error:", err);
    return { ok: false, message: "Không thể xác minh captcha, vui lòng thử lại" };
  }
}
