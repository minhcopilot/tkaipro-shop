import "server-only";

import { addBan } from "~/lib/security/ban-list";
import { isActorExempt } from "~/lib/security/exempt-list";
import { getActorAbuseSignals } from "~/lib/security/ip-log";
import { notifySecurityEvent } from "~/lib/notifications/fraud-alert";
import { recordSecurityEvent } from "~/lib/security/security-audit";

/**
 * Heuristic phát hiện lạm dụng + TỰ ĐỘNG BAN (không cần admin).
 *
 * Chính sách (cân bằng, tránh chặn nhầm CGNAT):
 *  - 1 thiết bị (fingerprint/did) tạo >= MAX_ACCOUNTS_PER_DEVICE account / window
 *    HOẶC thao tác dồn dập (velocity) -> BAN thiết bị + email (vĩnh viễn) + IP (TẠM).
 *  - 1 IP có >= MAX_ACCOUNTS_PER_IP account / window -> chỉ BAN IP (TẠM).
 *  - Whitelist IP admin -> luôn bỏ qua.
 */

function envInt(name: string, def: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : def;
}

const WINDOW_HOURS = envInt("ABUSE_WINDOW_HOURS", 24);
const MAX_ACCOUNTS_PER_DEVICE = envInt("ABUSE_MAX_ACCOUNTS_PER_DEVICE", 3);
const MAX_ACCOUNTS_PER_IP = envInt("ABUSE_MAX_ACCOUNTS_PER_IP", 8);
const VELOCITY_MINUTES = envInt("ABUSE_VELOCITY_MINUTES", 10);
const VELOCITY_MAX_EVENTS = envInt("ABUSE_VELOCITY_MAX_EVENTS", 20);
const IP_TEMP_BAN_HOURS = envInt("ABUSE_IP_TEMP_BAN_HOURS", 48);

function whitelistIps(): Set<string> {
  const raw = process.env.ABUSE_WHITELIST_IPS ?? "123.25.100.37";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isWhitelistedIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  return whitelistIps().has(ip.trim().toLowerCase());
}

// ───────────────────────────────────────────────────────────────────────────
// Phát hiện QUÉT mã đơn (enumeration): 1 IP gọi /api/orders/[orderNumber] với
// NHIỀU orderNumber khác nhau mà KHÔNG kèm email (không phải xem đơn của mình).
// Dùng bộ đếm in-memory (per-process) theo cửa sổ trượt — không ghi DB để tránh
// spam write khi khách poll trạng thái 1 đơn.
// ───────────────────────────────────────────────────────────────────────────
const ENUM_WINDOW_MS =
  envInt("ABUSE_ENUM_WINDOW_MINUTES", 10) * 60_000;
const ENUM_MAX_ORDERS = envInt("ABUSE_ENUM_MAX_ORDERS", 15);

interface EnumEntry {
  orders: Set<string>;
  windowStart: number;
}
const globalForEnum = globalThis as unknown as {
  __orderEnumTracker?: Map<string, EnumEntry>;
};
const enumTracker: Map<string, EnumEntry> =
  globalForEnum.__orderEnumTracker ?? new Map();
globalForEnum.__orderEnumTracker = enumTracker;

/**
 * Ghi nhận 1 lượt tra mã đơn KHÔNG kèm email từ `ip`. Trả `suspicious=true`
 * khi IP tra quá nhiều orderNumber KHÁC NHAU trong cửa sổ (dấu hiệu quét).
 * Poll cùng 1 đơn nhiều lần -> set chỉ 1 phần tử -> không flag.
 */
export function recordOrderProbe(
  ip: string | null | undefined,
  orderNumber: string,
): { suspicious: boolean; distinctOrders: number } {
  if (!ip || isWhitelistedIp(ip)) {
    return { suspicious: false, distinctOrders: 0 };
  }
  const now = Date.now();
  let entry = enumTracker.get(ip);
  if (!entry || now - entry.windowStart > ENUM_WINDOW_MS) {
    entry = { orders: new Set(), windowStart: now };
    enumTracker.set(ip, entry);
  }
  entry.orders.add(orderNumber);

  // Dọn rác định kỳ (giữ map nhỏ).
  if (enumTracker.size > 5000) {
    for (const [k, v] of enumTracker) {
      if (now - v.windowStart > ENUM_WINDOW_MS) enumTracker.delete(k);
    }
  }

  return {
    suspicious: entry.orders.size >= ENUM_MAX_ORDERS,
    distinctOrders: entry.orders.size,
  };
}

export interface ActorInput {
  ip?: string | null;
  fingerprint?: string | null;
  did?: string | null;
  email?: string | null;
  userAgent?: string | null;
}

export type AbuseAction = "allow" | "ban_device" | "ban_ip_only";

export interface AbuseDecision {
  action: AbuseAction;
  reasons: string[];
  signals: {
    distinctAccountsByFingerprint: number;
    distinctAccountsByDid: number;
    distinctAccountsByIp: number;
    recentEvents: number;
  };
}

/** Chấm điểm 1 actor dựa trên tín hiệu trong DB. Không tự ban — chỉ ra quyết định. */
export async function evaluateActor(input: ActorInput): Promise<AbuseDecision> {
  // Whitelist admin -> luôn allow.
  if (isWhitelistedIp(input.ip)) {
    return {
      action: "allow",
      reasons: ["whitelisted_ip"],
      signals: {
        distinctAccountsByFingerprint: 0,
        distinctAccountsByDid: 0,
        distinctAccountsByIp: 0,
        recentEvents: 0,
      },
    };
  }

  // Admin đã gỡ ban định danh này -> miễn auto-ban (không tự ban lại nữa).
  if (
    await isActorExempt({
      ip: input.ip ?? null,
      email: input.email ?? null,
      fingerprint: input.fingerprint ?? null,
      did: input.did ?? null,
    })
  ) {
    return {
      action: "allow",
      reasons: ["admin_exempt"],
      signals: {
        distinctAccountsByFingerprint: 0,
        distinctAccountsByDid: 0,
        distinctAccountsByIp: 0,
        recentEvents: 0,
      },
    };
  }

  const signals = await getActorAbuseSignals({
    ip: input.ip ?? null,
    fingerprint: input.fingerprint ?? null,
    did: input.did ?? null,
    windowHours: WINDOW_HOURS,
    velocityMinutes: VELOCITY_MINUTES,
  });

  const reasons: string[] = [];
  // +1 cho action hiện tại (chưa được ghi log) để so ngưỡng đúng.
  const deviceAccounts =
    Math.max(signals.distinctAccountsByFingerprint, signals.distinctAccountsByDid) + 1;
  const ipAccounts = signals.distinctAccountsByIp + 1;

  let banDevice = false;
  let banIp = false;

  if (deviceAccounts >= MAX_ACCOUNTS_PER_DEVICE) {
    banDevice = true;
    reasons.push(
      `device_multi_account(${deviceAccounts}/${MAX_ACCOUNTS_PER_DEVICE} trong ${WINDOW_HOURS}h)`,
    );
  }
  if (signals.recentEvents + 1 >= VELOCITY_MAX_EVENTS) {
    banDevice = true;
    reasons.push(
      `velocity_spam(${signals.recentEvents + 1}/${VELOCITY_MAX_EVENTS} trong ${VELOCITY_MINUTES}m)`,
    );
  }
  if (ipAccounts >= MAX_ACCOUNTS_PER_IP) {
    banIp = true;
    reasons.push(
      `ip_multi_account(${ipAccounts}/${MAX_ACCOUNTS_PER_IP} trong ${WINDOW_HOURS}h)`,
    );
  }

  const action: AbuseAction = banDevice
    ? "ban_device"
    : banIp
      ? "ban_ip_only"
      : "allow";

  return { action, reasons, signals };
}

/**
 * Thực thi auto-ban theo quyết định. Trả về `true` nếu actor bị chặn (đã ban).
 * - ban_device: ban fingerprint + email (vĩnh viễn) + IP (tạm IP_TEMP_BAN_HOURS).
 * - ban_ip_only: chỉ ban IP (tạm).
 * Bỏ qua hoàn toàn nếu IP whitelist.
 */
export async function enforceActor(
  input: ActorInput,
  context: { source: string },
): Promise<{ blocked: boolean; decision: AbuseDecision }> {
  const decision = await evaluateActor(input);
  if (decision.action === "allow") {
    return { blocked: false, decision };
  }

  const reason = `auto-detect: ${decision.reasons.join(", ")} [${context.source}]`;
  const tempUntil = new Date(Date.now() + IP_TEMP_BAN_HOURS * 3600_000);
  const tasks: Promise<unknown>[] = [];

  if (decision.action === "ban_device") {
    if (input.fingerprint && input.fingerprint.length >= 6) {
      tasks.push(
        addBan({
          kind: "fingerprint",
          value: input.fingerprint,
          reason,
          bannedByLabel: "auto-detect",
        }),
      );
    }
    if (input.email) {
      tasks.push(
        addBan({
          kind: "email",
          value: input.email,
          reason,
          bannedByLabel: "auto-detect",
        }),
      );
    }
  }

  // Cả 2 nhánh đều temp-ban IP (không vĩnh viễn để tránh chặn nhầm CGNAT).
  if (input.ip && !isWhitelistedIp(input.ip)) {
    tasks.push(
      addBan({
        kind: "ip",
        value: input.ip,
        reason,
        bannedByLabel: "auto-detect",
        bannedUntil: tempUntil,
      }),
    );
  }

  await Promise.allSettled(tasks);

  // Log + báo cáo admin (Telegram + console).
  notifySecurityEvent({
    title: `Tự động ban (${decision.action})`,
    ip: input.ip ?? undefined,
    email: input.email ?? undefined,
    details: {
      source: context.source,
      reasons: decision.reasons,
      signals: decision.signals,
      fingerprint: input.fingerprint ?? null,
      did: input.did ?? null,
      ipBan: input.ip ? `temp ${IP_TEMP_BAN_HOURS}h` : null,
    },
  });
  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "reject",
    reasonCode: "AUTO_BAN",
    customerEmail: input.email ?? undefined,
    clientIp: input.ip ?? undefined,
    message: reason.slice(0, 200),
    metadata: {
      action: decision.action,
      reasons: decision.reasons,
      signals: decision.signals,
      source: context.source,
    },
  });

  return { blocked: true, decision };
}

/**
 * Auto-ban kẻ SCRAPE credential (1 IP xem nhiều đơn/email khác nhau).
 * Chỉ ban IP (tạm) + fingerprint (vĩnh viễn) — KHÔNG ban email vì email ở đây
 * là của KHÁCH/đơn bị xem (nạn nhân), không phải của kẻ tấn công.
 */
export async function autoBanScraper(
  input: { ip?: string | null; fingerprint?: string | null; did?: string | null },
  context: { source: string; details?: Record<string, unknown> },
): Promise<boolean> {
  if (isWhitelistedIp(input.ip)) return false;
  // Admin đã gỡ ban -> miễn auto-ban scrape cho IP/thiết bị này.
  if (
    await isActorExempt({
      ip: input.ip ?? null,
      fingerprint: input.fingerprint ?? null,
      did: input.did ?? null,
    })
  ) {
    return false;
  }
  const reason = `auto-detect: credential_scrape [${context.source}]`;
  const tempUntil = new Date(Date.now() + IP_TEMP_BAN_HOURS * 3600_000);
  const tasks: Promise<unknown>[] = [];

  if (input.fingerprint && input.fingerprint.length >= 6) {
    tasks.push(
      addBan({
        kind: "fingerprint",
        value: input.fingerprint,
        reason,
        bannedByLabel: "auto-detect",
      }),
    );
  }
  if (input.ip) {
    tasks.push(
      addBan({
        kind: "ip",
        value: input.ip,
        reason,
        bannedByLabel: "auto-detect",
        bannedUntil: tempUntil,
      }),
    );
  }
  await Promise.allSettled(tasks);

  notifySecurityEvent({
    title: "Tự động ban (credential_scrape)",
    ip: input.ip ?? undefined,
    details: { source: context.source, ...(context.details ?? {}) },
  });
  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "reject",
    reasonCode: "AUTO_BAN_SCRAPE",
    clientIp: input.ip ?? undefined,
    message: reason.slice(0, 200),
    metadata: { source: context.source, ...(context.details ?? {}) },
  });
  return true;
}
