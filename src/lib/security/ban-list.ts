import "server-only";

import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { banListTable } from "~/db/schema";
import type { BanEntry, BanKind } from "~/db/schema/security/types";

/**
 * Ban list service với in-memory cache để check ở hot path (mỗi request) mà
 * không hit DB.
 *
 * Cache strategy:
 *  - Sets `bannedIps` + `bannedEmails` chứa value đang ban (đã exclude expired
 *    qua `bannedUntil < NOW()`).
 *  - TTL `CACHE_TTL_MS` (30s). Sau TTL, lần check tiếp theo trigger refresh
 *    bất đồng bộ (stale-while-revalidate) → 1 vài request có thể nhìn cache cũ
 *    tối đa 30s sau khi unban. Acceptable cho usecase admin tool.
 *  - Mọi mutation (`addBan`, `removeBan`) gọi `invalidateCache()` để force
 *    next read refresh ngay (chỉ tốn 1 round-trip DB).
 *
 * Trade-off:
 *  - Cache trên RAM mỗi container (Next.js server). Multi-instance: ban có
 *    thể trễ tới 30s cho instance khác. Đủ tốt cho 1 droplet hiện tại.
 *  - Nếu sau này scale ngang: chuyển qua Redis pub/sub hoặc database NOTIFY.
 */

const CACHE_TTL_MS = 30_000;
const PURGE_EXPIRED_INTERVAL_MS = 5 * 60_000;

interface BanCache {
  ips: Set<string>;
  emails: Set<string>;
  fingerprints: Set<string>;
  loadedAt: number;
}

let cache: BanCache | null = null;
let inflight: Promise<BanCache> | null = null;
let lastPurgeAt = 0;

async function loadCacheFromDb(): Promise<BanCache> {
  // Chỉ lấy ban còn hiệu lực: bannedUntil NULL (vĩnh viễn) hoặc > NOW()
  const rows = await db
    .select({
      kind: banListTable.kind,
      value: banListTable.value,
    })
    .from(banListTable)
    .where(
      or(
        isNull(banListTable.bannedUntil),
        sql`${banListTable.bannedUntil} > NOW()`,
      ),
    );

  const ips = new Set<string>();
  const emails = new Set<string>();
  const fingerprints = new Set<string>();
  for (const r of rows) {
    if (r.kind === "ip") ips.add(r.value);
    else if (r.kind === "email") emails.add(r.value);
    else if (r.kind === "fingerprint") fingerprints.add(r.value);
  }
  return { ips, emails, fingerprints, loadedAt: Date.now() };
}

/**
 * Đảm bảo cache còn fresh. Caller có thể dùng pattern fire-and-forget khi
 * stale (return cũ + refresh nền) hoặc await cho first-time load.
 */
async function ensureCache(): Promise<BanCache> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache;

  // First load: ai cũng phải đợi để có dữ liệu
  if (!cache) {
    inflight = inflight ?? loadCacheFromDb();
    const fresh = await inflight;
    cache = fresh;
    inflight = null;
    return fresh;
  }

  // Stale-while-revalidate: trả cache cũ, refresh nền (chỉ 1 inflight tại 1 thời điểm)
  if (!inflight) {
    inflight = loadCacheFromDb()
      .then((fresh) => {
        cache = fresh;
        inflight = null;
        return fresh;
      })
      .catch((err) => {
        console.warn("[ban-list] background refresh failed:", err);
        inflight = null;
        // ignore — giữ cache cũ
        return cache as BanCache;
      });
  }
  return cache;
}

function invalidateCache() {
  cache = null;
}

/** Lazy purge các ban đã hết hạn ở DB (chỉ chạy ~5 phút/lần). Không block hot path. */
async function maybePurgeExpired() {
  const now = Date.now();
  if (now - lastPurgeAt < PURGE_EXPIRED_INTERVAL_MS) return;
  lastPurgeAt = now;
  try {
    await db
      .delete(banListTable)
      .where(
        and(
          sql`${banListTable.bannedUntil} IS NOT NULL`,
          lt(banListTable.bannedUntil, new Date()),
        ),
      );
  } catch (err) {
    console.warn("[ban-list] purge expired failed:", err);
  }
}

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Fingerprint giữ nguyên hoa/thường (visitorId case-sensitive), chỉ trim.
function normalizeFingerprint(fp: string): string {
  return fp.trim().slice(0, 128);
}

function normalizeByKind(kind: BanKind, value: string): string {
  if (kind === "ip") return normalizeIp(value);
  if (kind === "email") return normalizeEmail(value);
  return normalizeFingerprint(value);
}

/** Check IP có đang bị ban không. Async vì cần ensure cache lần đầu. */
export async function isIpBanned(ip: string | null | undefined): Promise<boolean> {
  if (!ip) return false;
  const c = await ensureCache();
  void maybePurgeExpired();
  return c.ips.has(normalizeIp(ip));
}

export async function isEmailBanned(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const c = await ensureCache();
  void maybePurgeExpired();
  return c.emails.has(normalizeEmail(email));
}

export async function isFingerprintBanned(
  fp: string | null | undefined,
): Promise<boolean> {
  if (!fp) return false;
  const c = await ensureCache();
  void maybePurgeExpired();
  return c.fingerprints.has(normalizeFingerprint(fp));
}

/** Check 1 lần cả IP + email + fingerprint. Trả về reason code đầu tiên match. */
export async function checkBanned(input: {
  ip?: string | null;
  email?: string | null;
  fingerprint?: string | null;
}): Promise<
  | { banned: false }
  | {
      banned: true;
      reason: "BANNED_IP" | "BANNED_EMAIL" | "BANNED_FINGERPRINT";
      value: string;
    }
> {
  const c = await ensureCache();
  void maybePurgeExpired();
  if (input.ip) {
    const v = normalizeIp(input.ip);
    if (c.ips.has(v)) return { banned: true, reason: "BANNED_IP", value: v };
  }
  if (input.email) {
    const v = normalizeEmail(input.email);
    if (c.emails.has(v)) {
      return { banned: true, reason: "BANNED_EMAIL", value: v };
    }
  }
  if (input.fingerprint) {
    const v = normalizeFingerprint(input.fingerprint);
    if (c.fingerprints.has(v)) {
      return { banned: true, reason: "BANNED_FINGERPRINT", value: v };
    }
  }
  return { banned: false };
}

export interface AddBanParams {
  kind: BanKind;
  value: string;
  reason?: string | null;
  bannedBy?: string | null;
  bannedByLabel?: string | null;
  bannedUntil?: Date | null;
}

export interface AddBanResult {
  ok: boolean;
  entry?: BanEntry;
  error?: "ALREADY_BANNED" | "INVALID_VALUE" | "DB_ERROR";
}

export async function addBan(params: AddBanParams): Promise<AddBanResult> {
  const value = normalizeByKind(params.kind, params.value);
  if (!value || value.length > 255) {
    return { ok: false, error: "INVALID_VALUE" };
  }

  try {
    const [row] = await db
      .insert(banListTable)
      .values({
        id: nanoid(),
        kind: params.kind,
        value,
        reason: params.reason?.slice(0, 500) ?? null,
        bannedBy: params.bannedBy ?? null,
        bannedByLabel: params.bannedByLabel?.slice(0, 120) ?? null,
        bannedUntil: params.bannedUntil ?? null,
      })
      .onConflictDoNothing({
        target: [banListTable.kind, banListTable.value],
      })
      .returning();

    if (!row) {
      return { ok: false, error: "ALREADY_BANNED" };
    }

    invalidateCache();
    return { ok: true, entry: row };
  } catch (err) {
    console.error("[ban-list] addBan error:", err);
    return { ok: false, error: "DB_ERROR" };
  }
}

export async function removeBan(kind: BanKind, value: string): Promise<boolean> {
  const v = normalizeByKind(kind, value);
  try {
    const result = await db
      .delete(banListTable)
      .where(and(eq(banListTable.kind, kind), eq(banListTable.value, v)))
      .returning({ id: banListTable.id });
    invalidateCache();
    return result.length > 0;
  } catch (err) {
    console.error("[ban-list] removeBan error:", err);
    return false;
  }
}

export interface ListBansQuery {
  kind?: BanKind;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listBans(q: ListBansQuery = {}): Promise<{
  rows: BanEntry[];
  total: number;
}> {
  const limit = Math.min(Math.max(1, q.limit ?? 100), 500);
  const offset = Math.max(0, q.offset ?? 0);
  const conds = [];
  if (q.kind) conds.push(eq(banListTable.kind, q.kind));
  if (q.search) {
    const s = `%${q.search.trim().toLowerCase()}%`;
    conds.push(sql`(${banListTable.value} ILIKE ${s} OR ${banListTable.reason} ILIKE ${s})`);
  }
  const where = conds.length === 0 ? undefined : and(...conds);

  const rows = await db
    .select()
    .from(banListTable)
    .where(where)
    .orderBy(desc(banListTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(banListTable)
    .where(where);

  return { rows, total: count };
}

/** Public helper để admin endpoint force-refresh sau bulk ops nếu cần. */
export function forceInvalidateBanCache() {
  invalidateCache();
}

export interface BanStats {
  total: number;
  active: number;
  byKind: { ip: number; email: number; fingerprint: number };
  auto: number;
  manual: number;
  last24h: number;
  last7d: number;
  activeSet: { ips: string[]; emails: string[]; fingerprints: string[] };
}

/**
 * Thống kê ban cho trang Giám sát IP: tổng, theo kind, auto vs thủ công,
 * số ban gần đây, và tập giá trị đang ban (để UI hiển thị "Đã ban").
 */
export async function getBanStats(): Promise<BanStats> {
  const rows = await db
    .select({
      kind: banListTable.kind,
      value: banListTable.value,
      bannedByLabel: banListTable.bannedByLabel,
      bannedUntil: banListTable.bannedUntil,
      createdAt: banListTable.createdAt,
    })
    .from(banListTable);

  const now = Date.now();
  const stats: BanStats = {
    total: rows.length,
    active: 0,
    byKind: { ip: 0, email: 0, fingerprint: 0 },
    auto: 0,
    manual: 0,
    last24h: 0,
    last7d: 0,
    activeSet: { ips: [], emails: [], fingerprints: [] },
  };

  for (const r of rows) {
    const isActive =
      !r.bannedUntil || new Date(r.bannedUntil).getTime() > now;
    if (isActive) {
      stats.active++;
      if (r.kind === "ip") {
        stats.byKind.ip++;
        stats.activeSet.ips.push(r.value);
      } else if (r.kind === "email") {
        stats.byKind.email++;
        stats.activeSet.emails.push(r.value);
      } else if (r.kind === "fingerprint") {
        stats.byKind.fingerprint++;
        stats.activeSet.fingerprints.push(r.value);
      }
      if ((r.bannedByLabel ?? "").toLowerCase() === "auto-detect") stats.auto++;
      else stats.manual++;
    }
    const created = new Date(r.createdAt).getTime();
    if (now - created <= 24 * 3600_000) stats.last24h++;
    if (now - created <= 7 * 24 * 3600_000) stats.last7d++;
  }

  return stats;
}
