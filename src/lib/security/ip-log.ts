import "server-only";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { userIpLogTable } from "~/db/schema";
import type { IpEventType, UserIpLog } from "~/db/schema/security/types";

/**
 * IP forensics logging + query service.
 *
 * Writes are append-only and fully fault-tolerant: a logging failure must never
 * break auth (register/login) or the order flow, so every insert is wrapped in
 * try/catch and only warns.
 *
 * Reads power the admin "IP monitor" page: per-user IP history, IPs shared by
 * multiple accounts (bypass signal), and per-IP drill-down.
 */

// Same header precedence as getClientIp() in activation/rate-limit.ts so the
// IP recorded here is consistent across the codebase.
export function getClientIpFromHeaders(
  headers: Headers | null | undefined,
): string {
  if (!headers) return "unknown";
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/** Lấy mã quốc gia (ISO-2) từ header Cloudflare/Vercel. */
export function getCountryFromHeaders(
  headers: Headers | null | undefined,
): string | null {
  if (!headers) return null;
  const c =
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-country-code");
  if (!c) return null;
  const v = c.trim().toUpperCase();
  // Cloudflare trả "XX"/"T1" cho IP ẩn danh/Tor — bỏ qua giá trị rác.
  if (!v || v === "XX" || v.length !== 2) return null;
  return v;
}

/** Lấy fingerprint từ cookie `fp` hoặc header `x-fp` của 1 Headers object. */
export function getFingerprintFromHeaders(
  headers: Headers | null | undefined,
): string | null {
  if (!headers) return null;
  const headerFp = headers.get("x-fp");
  if (headerFp && headerFp.trim()) return headerFp.trim().slice(0, 128);
  const cookie = headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)fp=([^;]+)/);
  if (m && m[1]) {
    try {
      return decodeURIComponent(m[1]).slice(0, 128);
    } catch {
      return m[1].slice(0, 128);
    }
  }
  return null;
}

/** Lấy fingerprint từ cookie `fp` hoặc header `x-fp` của request. */
export function getFingerprintFromRequest(
  request: Request | null | undefined,
): string | null {
  if (!request) return null;
  return getFingerprintFromHeaders(request.headers);
}

/** Lấy device-id (`did`) từ cookie của 1 Headers object. */
export function getDeviceIdFromHeaders(
  headers: Headers | null | undefined,
): string | null {
  if (!headers) return null;
  const cookie = headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)did=([^;]+)/);
  if (m && m[1]) {
    try {
      return decodeURIComponent(m[1]).slice(0, 64);
    } catch {
      return m[1].slice(0, 64);
    }
  }
  return null;
}

export function getDeviceIdFromRequest(
  request: Request | null | undefined,
): string | null {
  if (!request) return null;
  return getDeviceIdFromHeaders(request.headers);
}

export interface LogUserIpParams {
  userId?: string | null;
  email?: string | null;
  eventType: IpEventType;
  ip: string | null | undefined;
  userAgent?: string | null;
  orderId?: string | null;
  country?: string | null;
  fingerprint?: string | null;
  did?: string | null;
  path?: string | null;
}

/**
 * Insert a single IP log row. Never throws — returns silently on any error so
 * callers in hot paths (auth hooks, order creation) stay safe.
 */
export async function logUserIp(params: LogUserIpParams): Promise<void> {
  const ip = (params.ip ?? "").trim();
  // Skip empty/unknown IP rows — they add noise without forensic value.
  if (!ip || ip === "unknown") return;
  try {
    await db.insert(userIpLogTable).values({
      id: nanoid(),
      userId: params.userId ?? null,
      email: params.email ? params.email.trim().toLowerCase() : null,
      eventType: params.eventType,
      ip: ip.toLowerCase(),
      userAgent: params.userAgent?.slice(0, 512) ?? null,
      orderId: params.orderId ?? null,
      country: params.country ?? null,
      fingerprint: params.fingerprint ? params.fingerprint.slice(0, 128) : null,
      did: params.did ? params.did.slice(0, 64) : null,
      path: params.path ? params.path.slice(0, 256) : null,
    });
  } catch (err) {
    console.warn("[ip-log] logUserIp failed:", err);
  }
}

/**
 * Full IP history for one user (by userId or email). Returns rows newest-first,
 * capped to a sane limit.
 */
export async function getUserIpHistory(input: {
  userId?: string | null;
  email?: string | null;
  limit?: number;
}): Promise<UserIpLog[]> {
  const limit = Math.min(Math.max(1, input.limit ?? 200), 1000);
  const conds = [];
  if (input.userId) conds.push(eq(userIpLogTable.userId, input.userId));
  if (input.email) {
    conds.push(eq(userIpLogTable.email, input.email.trim().toLowerCase()));
  }
  if (conds.length === 0) return [];
  const where = conds.length === 1 ? conds[0] : or(...conds);

  return db
    .select()
    .from(userIpLogTable)
    .where(where)
    .orderBy(desc(userIpLogTable.createdAt))
    .limit(limit);
}

export interface SharedIpRow {
  ip: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  lastSeen: string;
}

/**
 * IPs used by >= minAccounts distinct accounts. The strongest signal that a
 * single actor is creating multiple accounts to bypass checks.
 *
 * "Account" identity = COALESCE(user_id, email) so guest orders sharing an IP
 * also surface.
 */
export async function getSuspiciousSharedIps(input?: {
  minAccounts?: number;
  limit?: number;
}): Promise<SharedIpRow[]> {
  const minAccounts = Math.max(2, input?.minAccounts ?? 2);
  const limit = Math.min(Math.max(1, input?.limit ?? 100), 500);

  const rows = await db
    .select({
      ip: userIpLogTable.ip,
      accountCount: sql<number>`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))::int`,
      eventCount: sql<number>`COUNT(*)::int`,
      emails: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.email}) FILTER (WHERE ${userIpLogTable.email} IS NOT NULL))`,
      lastSeen: sql<string>`MAX(${userIpLogTable.createdAt})`,
    })
    .from(userIpLogTable)
    .groupBy(userIpLogTable.ip)
    .having(
      sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email})) >= ${minAccounts}`,
    )
    .orderBy(
      desc(
        sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))`,
      ),
    )
    .limit(limit);

  return rows.map((r) => ({
    ip: r.ip,
    accountCount: r.accountCount,
    eventCount: r.eventCount,
    emails: (r.emails ?? []).slice(0, 50),
    lastSeen: String(r.lastSeen),
  }));
}

export interface CredentialScrapeSignal {
  ip: string;
  windowMinutes: number;
  totalViews: number;
  distinctOrders: number;
  distinctEmails: number;
  suspicious: boolean;
}

/**
 * Phat hien hanh vi "scrape credential": 1 IP xem thong tin nhay cam cua nhieu
 * don / nhieu email khac nhau trong cua so thoi gian ngan. Day la dau hieu
 * manh nhat cua viec lay tai khoan hang loat qua API (thay vi qua DB).
 *
 * Goi sau khi da `logUserIp({ eventType: "credential_view", ... })`. Tra
 * `suspicious=true` khi vuot nguong de caller gui alert (xem security-alert).
 */
export async function detectCredentialScrape(input: {
  ip: string;
  windowMinutes?: number;
  maxDistinctOrders?: number;
  maxTotalViews?: number;
}): Promise<CredentialScrapeSignal> {
  const ip = (input.ip ?? "").trim().toLowerCase();
  const windowMinutes = input.windowMinutes ?? 10;
  const maxDistinctOrders = input.maxDistinctOrders ?? 8;
  const maxTotalViews = input.maxTotalViews ?? 25;

  const empty: CredentialScrapeSignal = {
    ip,
    windowMinutes,
    totalViews: 0,
    distinctOrders: 0,
    distinctEmails: 0,
    suspicious: false,
  };
  if (!ip || ip === "unknown") return empty;

  try {
    const rows = await db
      .select({
        totalViews: sql<number>`COUNT(*)::int`,
        distinctOrders: sql<number>`COUNT(DISTINCT ${userIpLogTable.orderId})::int`,
        distinctEmails: sql<number>`COUNT(DISTINCT ${userIpLogTable.email})::int`,
      })
      .from(userIpLogTable)
      .where(
        and(
          eq(userIpLogTable.ip, ip),
          eq(userIpLogTable.eventType, "credential_view"),
          sql`${userIpLogTable.createdAt} >= NOW() - (${windowMinutes} || ' minutes')::interval`,
        ),
      );

    const r = rows[0];
    if (!r) return empty;
    const suspicious =
      r.distinctOrders >= maxDistinctOrders || r.totalViews >= maxTotalViews;
    return {
      ip,
      windowMinutes,
      totalViews: r.totalViews,
      distinctOrders: r.distinctOrders,
      distinctEmails: r.distinctEmails,
      suspicious,
    };
  } catch (err) {
    console.warn("[ip-log] detectCredentialScrape failed:", err);
    return empty;
  }
}

export interface SharedFingerprintRow {
  fingerprint: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  countries: string[];
  lastSeen: string;
}

/**
 * Các device fingerprint được >= minAccounts tài khoản khác nhau dùng chung —
 * tín hiệu 1 người tạo nhiều account (kể cả khi đổi IP/VPN, vì fingerprint
 * gắn thiết bị/trình duyệt). Bổ trợ cho `getSuspiciousSharedIps`.
 */
export async function getSuspiciousSharedFingerprints(input?: {
  minAccounts?: number;
  limit?: number;
}): Promise<SharedFingerprintRow[]> {
  const minAccounts = Math.max(2, input?.minAccounts ?? 2);
  const limit = Math.min(Math.max(1, input?.limit ?? 100), 500);

  const rows = await db
    .select({
      fingerprint: userIpLogTable.fingerprint,
      accountCount: sql<number>`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))::int`,
      eventCount: sql<number>`COUNT(*)::int`,
      emails: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.email}) FILTER (WHERE ${userIpLogTable.email} IS NOT NULL))`,
      countries: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.country}) FILTER (WHERE ${userIpLogTable.country} IS NOT NULL))`,
      lastSeen: sql<string>`MAX(${userIpLogTable.createdAt})`,
    })
    .from(userIpLogTable)
    .where(sql`${userIpLogTable.fingerprint} IS NOT NULL`)
    .groupBy(userIpLogTable.fingerprint)
    .having(
      sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email})) >= ${minAccounts}`,
    )
    .orderBy(
      desc(
        sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))`,
      ),
    )
    .limit(limit);

  return rows.map((r) => ({
    fingerprint: r.fingerprint ?? "",
    accountCount: r.accountCount,
    eventCount: r.eventCount,
    emails: (r.emails ?? []).slice(0, 50),
    countries: (r.countries ?? []).slice(0, 20),
    lastSeen: String(r.lastSeen),
  }));
}

export interface ActorAbuseSignals {
  distinctAccountsByFingerprint: number;
  distinctAccountsByDid: number;
  distinctAccountsByIp: number;
  recentEvents: number; // tổng event của actor trong cửa sổ velocity (đo dồn dập)
}

/**
 * Đếm các tín hiệu lạm dụng cho 1 "actor" (IP/fingerprint/did):
 *  - Số ACCOUNT khác nhau (COALESCE(user_id,email)) gắn với từng định danh
 *    trong `windowHours` -> phát hiện 1 thiết bị/IP tạo nhiều account.
 *  - Số event trong `velocityMinutes` -> phát hiện thao tác dồn dập (spam).
 * Dùng cho heuristic auto-ban (abuse-detect.ts).
 */
export async function getActorAbuseSignals(input: {
  ip?: string | null;
  fingerprint?: string | null;
  did?: string | null;
  windowHours?: number;
  velocityMinutes?: number;
}): Promise<ActorAbuseSignals> {
  const windowHours = input.windowHours ?? 24;
  const velocityMinutes = input.velocityMinutes ?? 10;
  const ip = input.ip ? input.ip.trim().toLowerCase() : null;
  const fp = input.fingerprint ? input.fingerprint.slice(0, 128) : null;
  const did = input.did ? input.did.slice(0, 64) : null;

  const empty: ActorAbuseSignals = {
    distinctAccountsByFingerprint: 0,
    distinctAccountsByDid: 0,
    distinctAccountsByIp: 0,
    recentEvents: 0,
  };
  if (!ip && !fp && !did) return empty;

  const accountExpr = sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))::int`;
  const windowExpr = sql`${userIpLogTable.createdAt} >= NOW() - (${windowHours} || ' hours')::interval`;

  const distinctBy = async (col: any, val: string | null): Promise<number> => {
    if (!val) return 0;
    try {
      const rows = await db
        .select({ c: accountExpr })
        .from(userIpLogTable)
        .where(and(eq(col, val), windowExpr));
      return Number(rows[0]?.c ?? 0);
    } catch (err) {
      console.warn("[ip-log] distinctBy failed:", err);
      return 0;
    }
  };

  let recentEvents = 0;
  try {
    const conds = [] as any[];
    if (ip) conds.push(eq(userIpLogTable.ip, ip));
    if (fp) conds.push(eq(userIpLogTable.fingerprint, fp));
    if (did) conds.push(eq(userIpLogTable.did, did));
    const rows = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(userIpLogTable)
      .where(
        and(
          conds.length === 1 ? conds[0] : or(...conds),
          sql`${userIpLogTable.createdAt} >= NOW() - (${velocityMinutes} || ' minutes')::interval`,
        ),
      );
    recentEvents = rows[0]?.c ?? 0;
  } catch (err) {
    console.warn("[ip-log] recentEvents failed:", err);
  }

  const [byFp, byDid, byIp] = await Promise.all([
    distinctBy(userIpLogTable.fingerprint, fp),
    distinctBy(userIpLogTable.did, did),
    distinctBy(userIpLogTable.ip, ip),
  ]);

  return {
    distinctAccountsByFingerprint: byFp,
    distinctAccountsByDid: byDid,
    distinctAccountsByIp: byIp,
    recentEvents,
  };
}

export interface DailySuspectRow {
  type: "ip" | "fingerprint";
  value: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  countries: string[];
  lastSeen: string;
}

export interface DailySuspectReport {
  date: string;
  ips: DailySuspectRow[];
  fingerprints: DailySuspectRow[];
}

/**
 * Báo cáo "nghi ngờ trong ngày" cho admin review: IP / thiết bị có >= 2 tài
 * khoản khác nhau hoạt động trong ngày `dateStr` (YYYY-MM-DD). Đây là danh sách
 * gợi ý để admin xem xét + ban (không tự ban).
 */
export async function getDailySuspects(
  dateStr: string,
): Promise<DailySuspectReport> {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr
    : new Date().toISOString().slice(0, 10);

  const dayCond = sql`${userIpLogTable.createdAt} >= ${safeDate}::date AND ${userIpLogTable.createdAt} < (${safeDate}::date + INTERVAL '1 day')`;
  const accountExpr = sql<number>`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email}))::int`;

  const empty: DailySuspectReport = { date: safeDate, ips: [], fingerprints: [] };

  try {
    const ipRows = await db
      .select({
        value: userIpLogTable.ip,
        accountCount: accountExpr,
        eventCount: sql<number>`COUNT(*)::int`,
        emails: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.email}) FILTER (WHERE ${userIpLogTable.email} IS NOT NULL))`,
        countries: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.country}) FILTER (WHERE ${userIpLogTable.country} IS NOT NULL))`,
        lastSeen: sql<string>`MAX(${userIpLogTable.createdAt})`,
      })
      .from(userIpLogTable)
      .where(dayCond)
      .groupBy(userIpLogTable.ip)
      .having(
        sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email})) >= 2`,
      )
      .orderBy(desc(accountExpr))
      .limit(200);

    const fpRows = await db
      .select({
        value: userIpLogTable.fingerprint,
        accountCount: accountExpr,
        eventCount: sql<number>`COUNT(*)::int`,
        emails: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.email}) FILTER (WHERE ${userIpLogTable.email} IS NOT NULL))`,
        countries: sql<string[]>`(ARRAY_AGG(DISTINCT ${userIpLogTable.country}) FILTER (WHERE ${userIpLogTable.country} IS NOT NULL))`,
        lastSeen: sql<string>`MAX(${userIpLogTable.createdAt})`,
      })
      .from(userIpLogTable)
      .where(sql`${dayCond} AND ${userIpLogTable.fingerprint} IS NOT NULL`)
      .groupBy(userIpLogTable.fingerprint)
      .having(
        sql`COUNT(DISTINCT COALESCE(${userIpLogTable.userId}, ${userIpLogTable.email})) >= 2`,
      )
      .orderBy(desc(accountExpr))
      .limit(200);

    return {
      date: safeDate,
      ips: ipRows.map((r) => ({
        type: "ip" as const,
        value: r.value,
        accountCount: r.accountCount,
        eventCount: r.eventCount,
        emails: (r.emails ?? []).slice(0, 50),
        countries: (r.countries ?? []).slice(0, 20),
        lastSeen: String(r.lastSeen),
      })),
      fingerprints: fpRows.map((r) => ({
        type: "fingerprint" as const,
        value: r.value ?? "",
        accountCount: r.accountCount,
        eventCount: r.eventCount,
        emails: (r.emails ?? []).slice(0, 50),
        countries: (r.countries ?? []).slice(0, 20),
        lastSeen: String(r.lastSeen),
      })),
    };
  } catch (err) {
    console.warn("[ip-log] getDailySuspects failed:", err);
    return empty;
  }
}

/** All events recorded from a single IP (drill-down view). */
export async function getIpDetail(
  ip: string,
  limit = 300,
): Promise<UserIpLog[]> {
  const v = ip.trim().toLowerCase();
  if (!v) return [];
  return db
    .select()
    .from(userIpLogTable)
    .where(eq(userIpLogTable.ip, v))
    .orderBy(desc(userIpLogTable.createdAt))
    .limit(Math.min(Math.max(1, limit), 1000));
}
