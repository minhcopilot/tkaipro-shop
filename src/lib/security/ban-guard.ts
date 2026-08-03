import "server-only";

import { NextResponse } from "next/server";

import { getClientIp } from "~/lib/security/rate-limit";
import { checkBanned, isFingerprintBanned, isIpBanned } from "~/lib/security/ban-list";
import { getFingerprintFromRequest } from "~/lib/security/ip-log";

/**
 * Helper trả response 403 chuẩn cho route handler khi caller bị ban.
 * Dùng pattern:
 *
 *   const banResp = await guardBannedRequest(request, { email });
 *   if (banResp) return banResp;
 */
export async function guardBannedRequest(
  request: Request,
  opts: { email?: string | null } = {},
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const fingerprint = getFingerprintFromRequest(request);
  const result = await checkBanned({
    ip,
    email: opts.email ?? null,
    fingerprint,
  });
  if (!result.banned) return null;

  // Generic message — không leak loại ban hay value cụ thể cho attacker.
  return NextResponse.json(
    {
      error: "ACCESS_DENIED",
      message: "Yêu cầu của bạn đã bị từ chối.",
    },
    { status: 403 },
  );
}

/**
 * Server-side guard cho Server Components / layouts. Trả `true` nếu IP đang
 * bị ban → caller render UI "banned" hoặc gọi `notFound()`.
 *
 * Dùng cho layout root [locale]/layout.tsx — chấp nhận bất kỳ object có
 * `headers()` (Next.js fetch headers / `headers()` từ next/headers).
 */
export async function isRequestIpBanned(
  ipOrHeaders: string | Headers | null | undefined,
): Promise<{ banned: boolean; ip: string | null }> {
  let ip: string | null = null;
  if (!ipOrHeaders) {
    return { banned: false, ip: null };
  }
  if (typeof ipOrHeaders === "string") {
    ip = ipOrHeaders;
  } else {
    const fwd = ipOrHeaders.get("x-forwarded-for");
    ip =
      fwd?.split(",")[0]?.trim() ??
      ipOrHeaders.get("x-real-ip") ??
      ipOrHeaders.get("cf-connecting-ip") ??
      null;
  }
  // Đọc fingerprint từ cookie `fp` (nếu headers có) để chặn cả theo thiết bị.
  let fingerprint: string | null = null;
  if (ipOrHeaders && typeof ipOrHeaders !== "string") {
    const cookie = ipOrHeaders.get("cookie") ?? "";
    const m = cookie.match(/(?:^|;\s*)fp=([^;]+)/);
    if (m && m[1]) {
      try {
        fingerprint = decodeURIComponent(m[1]).slice(0, 128);
      } catch {
        fingerprint = m[1].slice(0, 128);
      }
    }
  }

  if (!ip && !fingerprint) return { banned: false, ip: null };
  const [ipBanned, fpBanned] = await Promise.all([
    ip ? isIpBanned(ip) : Promise.resolve(false),
    fingerprint ? isFingerprintBanned(fingerprint) : Promise.resolve(false),
  ]);
  return { banned: ipBanned || fpBanned, ip };
}
