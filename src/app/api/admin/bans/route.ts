import { NextRequest, NextResponse } from "next/server";

import { recordSecurityEvent } from "~/lib/security/security-audit";
import { getCurrentAdmin } from "~/lib/auth";
import {
  addBan,
  listBans,
  removeBan,
} from "~/lib/security/ban-list";
import { addExempt, removeExempt } from "~/lib/security/exempt-list";
import type { BanKind } from "~/db/schema/security/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: ReadonlySet<BanKind> = new Set<BanKind>([
  "ip",
  "email",
  "fingerprint",
]);

const IP_RE =
  /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-fA-F:]+)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidValue(kind: BanKind, value: string): boolean {
  if (!value) return false;
  if (kind === "ip") return IP_RE.test(value);
  if (kind === "email") return EMAIL_RE.test(value) && value.length <= 254;
  if (kind === "fingerprint") return value.length >= 6 && value.length <= 128;
  return false;
}

function banReasonCode(kind: BanKind, prefix: "BAN" | "UNBAN"): string {
  return `${prefix}_${kind.toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const kind = kindParam && KINDS.has(kindParam as BanKind)
    ? (kindParam as BanKind)
    : undefined;
  const search = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  try {
    const result = await listBans({
      kind,
      search: search?.trim() || undefined,
      limit: Number.isFinite(limit) ? limit : 200,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/bans GET] error:", err);
    return NextResponse.json(
      { error: "Internal" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_BODY" }, { status: 400 });
  }

  const kindRaw = String(body?.kind ?? "");
  if (!KINDS.has(kindRaw as BanKind)) {
    return NextResponse.json(
      {
        error: "INVALID_KIND",
        message: "kind phải là 'ip', 'email' hoặc 'fingerprint'",
      },
      { status: 400 },
    );
  }
  const kind = kindRaw as BanKind;

  const valueRaw = String(body?.value ?? "").trim();
  if (!isValidValue(kind, valueRaw)) {
    return NextResponse.json(
      { error: "INVALID_VALUE", message: "Giá trị IP/email/fingerprint không hợp lệ" },
      { status: 400 },
    );
  }
  const reason = body?.reason ? String(body.reason).slice(0, 500) : null;

  // bannedUntil ISO string (optional). Nếu absent → vĩnh viễn.
  let bannedUntil: Date | null = null;
  if (body?.bannedUntil) {
    const d = new Date(body.bannedUntil);
    if (Number.isFinite(d.getTime())) bannedUntil = d;
  }

  const result = await addBan({
    kind,
    value: valueRaw,
    reason,
    bannedBy: admin.id,
    bannedByLabel: admin.email ?? admin.name ?? null,
    bannedUntil,
  });

  if (!result.ok) {
    const status = result.error === "ALREADY_BANNED" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Admin chủ động ban tay lại -> xoá miễn trừ (nếu có) để reset trạng thái.
  void removeExempt(kind, valueRaw);

  // Log admin action vào audit timeline để dễ trace ai ban cái gì
  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "ok",
    reasonCode: banReasonCode(kind, "BAN"),
    customerEmail: kind === "email" ? valueRaw : undefined,
    clientIp: kind === "ip" ? valueRaw : undefined,
    metadata: {
      action: "ban",
      adminId: admin.id,
      adminEmail: admin.email,
      reason,
      bannedUntil: bannedUntil ? bannedUntil.toISOString() : null,
    },
  });

  return NextResponse.json({ ok: true, entry: result.entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kindRaw = searchParams.get("kind") ?? "";
  if (!KINDS.has(kindRaw as BanKind)) {
    return NextResponse.json({ error: "INVALID_KIND" }, { status: 400 });
  }
  const kind = kindRaw as BanKind;
  const value = (searchParams.get("value") ?? "").trim();
  if (!value) {
    return NextResponse.json({ error: "MISSING_VALUE" }, { status: 400 });
  }

  const removed = await removeBan(kind, value);
  if (!removed) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Admin đã gỡ ban -> miễn auto-ban cho định danh này (không tự ban lại nữa).
  void addExempt({
    kind,
    value,
    note: "admin gỡ ban",
    createdBy: admin.id,
    createdByLabel: admin.email ?? admin.name ?? null,
  });

  void recordSecurityEvent({
    eventType: "admin_action",
    outcome: "ok",
    reasonCode: banReasonCode(kind, "UNBAN"),
    customerEmail: kind === "email" ? value : undefined,
    clientIp: kind === "ip" ? value : undefined,
    metadata: {
      action: "unban",
      adminId: admin.id,
      adminEmail: admin.email,
    },
  });

  return NextResponse.json({ ok: true });
}
