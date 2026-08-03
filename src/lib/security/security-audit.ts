import "server-only";

import { nanoid } from "nanoid";

import { db } from "~/db";
import { securityEventTable } from "~/db/schema";

export type SecurityEventType = "admin_action" | "auto_ban";
export type SecurityEventOutcome = "ok" | "reject";

/**
 * Đọc IP/UA/country từ request headers, không throw nếu thiếu.
 */
function extractRequestMeta(request: Request | undefined): {
  clientIp?: string;
  userAgent?: string;
  country?: string;
} {
  if (!request) return {};
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for");
  const clientIp = forwarded
    ? forwarded.split(",")[0]?.trim()
    : h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? undefined;
  const country =
    h.get("cf-ipcountry") ?? h.get("x-country-code") ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  return {
    clientIp: clientIp?.slice(0, 64),
    userAgent: userAgent?.slice(0, 500),
    country: country?.slice(0, 8),
  };
}

export interface RecordSecurityEventParams {
  eventType: SecurityEventType;
  outcome?: SecurityEventOutcome;
  reasonCode?: string;
  customerEmail?: string | null;
  request?: Request;
  clientIp?: string;
  userAgent?: string;
  country?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Ghi 1 event audit. KHÔNG throw nếu DB lỗi — audit log mất 1 row không được
 * phép làm hỏng flow chính. Caller dùng `void recordSecurityEvent(...)` để
 * fire-and-forget.
 */
export async function recordSecurityEvent(
  params: RecordSecurityEventParams,
): Promise<void> {
  try {
    const meta = extractRequestMeta(params.request);

    await db.insert(securityEventTable).values({
      id: nanoid(),
      eventType: params.eventType,
      outcome: params.outcome ?? null,
      reasonCode: params.reasonCode?.slice(0, 64) ?? null,
      customerEmail:
        params.customerEmail?.trim().toLowerCase().slice(0, 255) ?? null,
      clientIp: params.clientIp ?? meta.clientIp ?? null,
      country: params.country ?? meta.country ?? null,
      userAgent: params.userAgent ?? meta.userAgent ?? null,
      message: params.message?.slice(0, 500) ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.warn(
      `[security-audit] failed to record event ${params.eventType}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
