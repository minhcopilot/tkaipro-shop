import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "~/db";
import { autoBanExemptTable } from "~/db/schema";
import type { BanKind } from "~/db/schema/security/types";

/**
 * Danh sách MIỄN auto-ban (in-memory cache, mirror ban-list).
 *
 * Khi admin gỡ ban 1 IP/email/thiết bị, định danh đó được thêm vào đây để
 * heuristic abuse-detect KHÔNG tự ban lại. Ban THỦ CÔNG vẫn hoạt động — miễn
 * trừ chỉ chặn đường AUTO-ban (evaluateActor/autoBanScraper).
 *
 * `kind` dùng chung quy ước với ban_list: 'ip' | 'email' | 'fingerprint'
 * (did lưu dưới 'fingerprint').
 */

const CACHE_TTL_MS = 30_000;

interface ExemptCache {
  ips: Set<string>;
  emails: Set<string>;
  fingerprints: Set<string>;
  loadedAt: number;
}

let cache: ExemptCache | null = null;
let inflight: Promise<ExemptCache> | null = null;

async function loadCacheFromDb(): Promise<ExemptCache> {
  const rows = await db
    .select({
      kind: autoBanExemptTable.kind,
      value: autoBanExemptTable.value,
    })
    .from(autoBanExemptTable);

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

async function ensureCache(): Promise<ExemptCache> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache;

  if (!cache) {
    inflight = inflight ?? loadCacheFromDb();
    const fresh = await inflight;
    cache = fresh;
    inflight = null;
    return fresh;
  }

  // Stale-while-revalidate
  if (!inflight) {
    inflight = loadCacheFromDb()
      .then((fresh) => {
        cache = fresh;
        inflight = null;
        return fresh;
      })
      .catch((err) => {
        console.warn("[exempt-list] background refresh failed:", err);
        inflight = null;
        return cache as ExemptCache;
      });
  }
  return cache;
}

function invalidateCache() {
  cache = null;
}

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function normalizeFingerprint(fp: string): string {
  return fp.trim().slice(0, 128);
}
function normalizeByKind(kind: BanKind, value: string): string {
  if (kind === "ip") return normalizeIp(value);
  if (kind === "email") return normalizeEmail(value);
  return normalizeFingerprint(value);
}

export interface AddExemptParams {
  kind: BanKind;
  value: string;
  note?: string | null;
  createdBy?: string | null;
  createdByLabel?: string | null;
}

/** Thêm định danh vào danh sách miễn auto-ban (idempotent theo (kind,value)). */
export async function addExempt(params: AddExemptParams): Promise<boolean> {
  const value = normalizeByKind(params.kind, params.value);
  if (!value || value.length > 255) return false;
  try {
    await db
      .insert(autoBanExemptTable)
      .values({
        id: nanoid(),
        kind: params.kind,
        value,
        note: params.note?.slice(0, 500) ?? null,
        createdBy: params.createdBy ?? null,
        createdByLabel: params.createdByLabel?.slice(0, 120) ?? null,
      })
      .onConflictDoNothing({
        target: [autoBanExemptTable.kind, autoBanExemptTable.value],
      });
    invalidateCache();
    return true;
  } catch (err) {
    console.error("[exempt-list] addExempt error:", err);
    return false;
  }
}

/** Gỡ miễn trừ (vd admin chủ động ban tay lại). */
export async function removeExempt(
  kind: BanKind,
  value: string,
): Promise<boolean> {
  const v = normalizeByKind(kind, value);
  try {
    const result = await db
      .delete(autoBanExemptTable)
      .where(
        and(eq(autoBanExemptTable.kind, kind), eq(autoBanExemptTable.value, v)),
      )
      .returning({ id: autoBanExemptTable.id });
    invalidateCache();
    return result.length > 0;
  } catch (err) {
    console.error("[exempt-list] removeExempt error:", err);
    return false;
  }
}

export async function isExempt(
  kind: BanKind,
  value: string | null | undefined,
): Promise<boolean> {
  if (!value) return false;
  const c = await ensureCache();
  const v = normalizeByKind(kind, value);
  if (kind === "ip") return c.ips.has(v);
  if (kind === "email") return c.emails.has(v);
  return c.fingerprints.has(v);
}

/**
 * Check 1 actor có ĐƯỢC MIỄN auto-ban không (bất kỳ định danh nào trong miễn
 * trừ). did xem như kind 'fingerprint'.
 */
export async function isActorExempt(input: {
  ip?: string | null;
  email?: string | null;
  fingerprint?: string | null;
  did?: string | null;
}): Promise<boolean> {
  const c = await ensureCache();
  if (input.ip && c.ips.has(normalizeIp(input.ip))) return true;
  if (input.email && c.emails.has(normalizeEmail(input.email))) return true;
  if (input.fingerprint && c.fingerprints.has(normalizeFingerprint(input.fingerprint))) {
    return true;
  }
  if (input.did && c.fingerprints.has(normalizeFingerprint(input.did))) {
    return true;
  }
  return false;
}

export interface ExemptEntry {
  id: string;
  kind: string;
  value: string;
  note: string | null;
  createdByLabel: string | null;
  createdAt: Date;
}

/** Liệt kê danh sách miễn trừ (cho admin xem/quản lý nếu cần). */
export async function listExempt(): Promise<ExemptEntry[]> {
  return db
    .select({
      id: autoBanExemptTable.id,
      kind: autoBanExemptTable.kind,
      value: autoBanExemptTable.value,
      note: autoBanExemptTable.note,
      createdByLabel: autoBanExemptTable.createdByLabel,
      createdAt: autoBanExemptTable.createdAt,
    })
    .from(autoBanExemptTable)
    .orderBy(sql`${autoBanExemptTable.createdAt} DESC`);
}
