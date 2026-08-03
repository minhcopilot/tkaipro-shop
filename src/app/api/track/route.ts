import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { getCurrentUser } from "~/lib/auth";
import {
  getCountryFromHeaders,
  getDeviceIdFromRequest,
  logUserIp,
} from "~/lib/security/ip-log";

export const runtime = "nodejs";

/**
 * POST /api/track
 *
 * Ghi nhận IP + quốc gia (Cloudflare) + device fingerprint (FingerprintJS) cho
 * MỌI khách truy cập (kể cả chưa đăng nhập). Phục vụ checklist IP/thiết bị +
 * phát hiện 1 thiết bị tạo nhiều account + ban theo thiết bị.
 *
 * Body: { fingerprint: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // Rate-limit nhẹ để tránh spam log từ 1 IP (vd reload liên tục).
    const rl = rateLimit(`track:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = (await request.json().catch(() => ({}))) as {
      fingerprint?: unknown;
    };
    const fingerprint =
      typeof body.fingerprint === "string" && body.fingerprint.trim()
        ? body.fingerprint.trim().slice(0, 128)
        : null;

    const country = getCountryFromHeaders(request.headers);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    // Device-id (did): cookie httpOnly do server cấp, bền hơn fp (JS). Nếu chưa
    // có thì sinh mới + set cookie trên response.
    let did = getDeviceIdFromRequest(request);
    let setDidCookie = false;
    if (!did) {
      did = randomUUID();
      setDidCookie = true;
    }

    // Gắn với user nếu đang đăng nhập (best-effort, không bắt buộc).
    let userId: string | null = null;
    let email: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
        email = user.email ?? null;
      }
    } catch {
      // ignore
    }

    await logUserIp({
      userId,
      email,
      eventType: "visit",
      ip,
      userAgent,
      country,
      fingerprint,
      did,
    });

    const res = NextResponse.json({ ok: true });
    if (setDidCookie && did) {
      // httpOnly để JS không xoá/sửa được dễ dàng; 1 năm.
      res.cookies.set("did", did, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 31536000,
      });
    }
    return res;
  } catch (error) {
    console.error("[track] failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
